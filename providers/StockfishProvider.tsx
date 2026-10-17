import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { useStockfish } from "@loloof64/react-native-stockfish";
import { Difficulty } from "@/types/match";

type SearchRequest = {
    owner: symbol;
    fen: string;
    profile: "hint" | Exclude<Difficulty, "rookie">;
    onOutput: (output: string) => void;
    onError: (message: string) => void;
};

type Search = SearchRequest & {
    id: number;
    startedAt: number;
    phaseStartedAt: number;
    fragments: number;
    lines: number;
    latestDepth?: number;
    engineTimeMs?: number;
    phase: "preparing" | "searching" | "stopping" | "syncing";
    cancelled: boolean;
    timeout?: ReturnType<typeof setTimeout>;
};

type StockfishContextType = {
    isEngineReady: boolean;
    engineError: string | null;
    requestSearch: (request: SearchRequest) => void;
    cancelSearch: (owner: symbol, newGame?: boolean) => void;
};

const StockfishContext = createContext<StockfishContextType | null>(null);

export function StockfishProvider({ children }: { children: React.ReactNode }) {
    const [isUciInitialized, setIsUciInitialized] = useState(false);
    const [isEngineReady, setIsEngineReady] = useState(false);
    const [engineError, setEngineError] = useState<string | null>(null);
    const loopStartedRef = useRef(false);
    const readyRef = useRef(false);
    const failedRef = useRef(false);
    const activeSearchRef = useRef<Search | null>(null);
    const pendingSearchRef = useRef<SearchRequest | null>(null);
    const newGameRef = useRef(false);
    const outputRef = useRef<(output: string) => void>(() => {});
    const outputBufferRef = useRef("");
    const searchIdRef = useRef(0);

    const logSearch = useCallback((event: string, search: Search) => {
        const now = Date.now();
        console.log("[Stockfish search]", {
            event, id: search.id, profile: search.profile, phase: search.phase,
            elapsedMs: now - search.startedAt, phaseElapsedMs: now - search.phaseStartedAt,
            fragments: search.fragments, lines: search.lines, cancelled: search.cancelled,
            latestDepth: search.latestDepth, engineTimeMs: search.engineTimeMs,
            bufferedCharacters: outputBufferRef.current.length,
        });
    }, []);

    const receiveOutput = useCallback((fragment: string) => {
        const active = activeSearchRef.current;
        if (active) active.fragments++;
        // Native callbacks are stream fragments, including separate newline fragments.
        // Keep the remainder across cancellations so the old search can drain safely.
        outputBufferRef.current += fragment;
        let end: number;
        while ((end = outputBufferRef.current.search(/[\r\n]/)) !== -1) {
            const line = outputBufferRef.current.slice(0, end).trim();
            outputBufferRef.current = outputBufferRef.current.slice(end + 1);
            // CRLF (even across callbacks) produces an empty line, which is ignored.
            if (line) {
                if (activeSearchRef.current) activeSearchRef.current.lines++;
                outputRef.current(line);
            }
        }
    }, []);

    const { stockfishLoop, sendCommandToStockfish } = useStockfish({
        onOutput: receiveOutput,
        onError: useCallback((error: string) => console.log("Stockfish error:", error), []),
    });

    const failSearch = useCallback(() => {
        const active = activeSearchRef.current;
        const pending = pendingSearchRef.current;
        if (active) logSearch("timeout", active);
        if (active?.timeout) clearTimeout(active.timeout);
        activeSearchRef.current = null;
        pendingSearchRef.current = null;
        failedRef.current = true;
        readyRef.current = false;
        setIsEngineReady(false);
        sendCommandToStockfish("stop");
        const message = "The computer did not respond. Restart the app before playing Stockfish again.";
        setEngineError(message);
        if (active && !active.cancelled) active.onError(message);
        pending?.onError(message);
    }, [logSearch, sendCommandToStockfish]);

    const watchSearch = useCallback((search: Search) => {
        if (search.timeout) clearTimeout(search.timeout);
        // A timeout must not release the engine: late output would have no safe owner.
        const timer = setTimeout(() => {
            if (activeSearchRef.current === search && search.timeout === timer) failSearch();
        }, 15000);
        search.timeout = timer;
    }, [failSearch]);

    const beginSearch = useCallback((search: Search) => {
        search.phase = "searching";
        search.phaseStartedAt = Date.now();
        logSearch("searching", search);
        watchSearch(search);
        // The previous search has drained before this function can run.
        const profiles = {
            skilled: { elo: 1320, milliseconds: 750 },
            advanced: { elo: 1700, milliseconds: 1000 },
            master: { elo: 2200, milliseconds: 1500 },
            hint: { elo: 2200, milliseconds: 1500 },
        };
        const profile = profiles[search.profile];
        sendCommandToStockfish(`setoption name UCI_LimitStrength value ${search.profile !== "hint"}`);
        sendCommandToStockfish(`setoption name UCI_Elo value ${profile.elo}`);
        sendCommandToStockfish(`setoption name MultiPV value ${search.profile === "skilled" ? 4 : 1}`);
        sendCommandToStockfish(`position fen ${search.fen}`);
        sendCommandToStockfish(search.profile === "skilled"
            ? "go depth 6 movetime 750"
            : `go movetime ${profile.milliseconds}`);
    }, [logSearch, sendCommandToStockfish, watchSearch]);

    const startPendingSearch = useCallback(() => {
        if (activeSearchRef.current || !readyRef.current || failedRef.current) return;
        const pending = pendingSearchRef.current;
        if (!pending) return;
        pendingSearchRef.current = null;
        const now = Date.now();
        const search: Search = {
            ...pending, phase: "preparing", cancelled: false,
            id: ++searchIdRef.current, startedAt: now, phaseStartedAt: now,
            fragments: 0, lines: 0,
        };
        activeSearchRef.current = search;
        logSearch("preparing", search);
        if (newGameRef.current) {
            newGameRef.current = false;
            watchSearch(search);
            sendCommandToStockfish("ucinewgame");
            sendCommandToStockfish("isready");
        } else {
            beginSearch(search);
        }
    }, [beginSearch, logSearch, sendCommandToStockfish, watchSearch]);

    const stopSearch = useCallback((search: Search) => {
        const wasCancelled = search.cancelled;
        search.cancelled = true;
        if (search.phase === "searching") {
            search.phase = "stopping";
            search.phaseStartedAt = Date.now();
            logSearch("stopping", search);
            watchSearch(search);
            sendCommandToStockfish("stop");
        } else if (!wasCancelled) logSearch("cancelled", search);
    }, [logSearch, sendCommandToStockfish, watchSearch]);

    const cancelSearch = useCallback((owner: symbol, newGame = false) => {
        if (pendingSearchRef.current?.owner === owner) pendingSearchRef.current = null;
        const active = activeSearchRef.current;
        if (active?.owner === owner) stopSearch(active);
        if (newGame) newGameRef.current = true;
    }, [stopSearch]);

    const requestSearch = useCallback((request: SearchRequest) => {
        if (failedRef.current) {
            request.onError("The computer is unavailable. Restart the app before playing Stockfish again.");
            return;
        }
        // Only the latest replacement is needed; an old screen can cancel only its owner.
        pendingSearchRef.current = request;
        if (activeSearchRef.current) stopSearch(activeSearchRef.current);
        startPendingSearch();
    }, [startPendingSearch, stopSearch]);

    useEffect(() => {
        outputRef.current = (output) => {
            if (failedRef.current) return;
            if (output === "uciok") {
                setIsUciInitialized(true);
                return;
            }
            const active = activeSearchRef.current;
            if (output === "readyok") {
                if (active) logSearch("readyok", active);
                if (!readyRef.current) {
                    readyRef.current = true;
                    setIsEngineReady(true);
                } else if (active?.phase === "preparing" && !active.cancelled) {
                    beginSearch(active);
                    return;
                } else if (active?.phase === "syncing" || active?.phase === "preparing") {
                    if (active.timeout) clearTimeout(active.timeout);
                    activeSearchRef.current = null;
                }
                startPendingSearch();
                return;
            }
            if (!active || (active.phase !== "searching" && active.phase !== "stopping")) return;
            if (output.startsWith("info ")) {
                const depth = /\bdepth (\d+)\b/.exec(output);
                const time = /\btime (\d+)\b/.exec(output);
                if (depth) active.latestDepth = Number(depth[1]);
                if (time) active.engineTimeMs = Number(time[1]);
            }
            if (output.startsWith("bestmove")) logSearch("bestmove", active);
            if (!active.cancelled) active.onOutput(output);
            if (output.startsWith("bestmove")) {
                // Drain bestmove BEFORE asking for readyok. isready can respond during search.
                active.phase = "syncing";
                active.phaseStartedAt = Date.now();
                logSearch("syncing", active);
                watchSearch(active);
                sendCommandToStockfish("isready");
            }
        };
    }, [beginSearch, logSearch, sendCommandToStockfish, startPendingSearch, watchSearch]);

    useEffect(() => {
        if (loopStartedRef.current) return;
        loopStartedRef.current = true;
        stockfishLoop();
        sendCommandToStockfish("uci");
    }, [stockfishLoop, sendCommandToStockfish]);

    useEffect(() => {
        if (!isUciInitialized) return;
        sendCommandToStockfish("setoption name Threads value 3");
        sendCommandToStockfish("ucinewgame");
        sendCommandToStockfish("isready");
    }, [isUciInitialized, sendCommandToStockfish]);

    useEffect(() => () => {
        const active = activeSearchRef.current;
        if (active?.timeout) clearTimeout(active.timeout);
        activeSearchRef.current = null;
        pendingSearchRef.current = null;
        outputRef.current = () => {};
        outputBufferRef.current = "";
    }, []);

    return (
        <StockfishContext.Provider value={{ isEngineReady, engineError, requestSearch, cancelSearch }}>
            {children}
        </StockfishContext.Provider>
    );
}

export function useStockfishContext() {
    const context = useContext(StockfishContext);
    if (!context) throw new Error("useStockfishContext must be used inside StockfishProvider");
    return context;
}
