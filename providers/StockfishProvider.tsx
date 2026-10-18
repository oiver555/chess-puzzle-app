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
type InitializationPhase = "waiting-uciok" | "waiting-readyok" | "ready" | "failed";
const INITIALIZATION_TIMEOUT_MS = 30000;

export function StockfishProvider({ children }: { children: React.ReactNode }) {
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
    const initializationPhaseRef = useRef<InitializationPhase>("waiting-uciok");
    const initializationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialReadyRequestedRef = useRef(false);

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

    const clearInitializationTimer = useCallback(() => {
        if (initializationTimerRef.current !== null) clearTimeout(initializationTimerRef.current);
        initializationTimerRef.current = null;
    }, []);

    const failEngine = useCallback((message: string, event = "failure") => {
        if (failedRef.current) return;
        const active = activeSearchRef.current;
        const pending = pendingSearchRef.current;
        if (active) logSearch(event, active);
        clearInitializationTimer();
        if (active?.timeout) clearTimeout(active.timeout);
        activeSearchRef.current = null;
        pendingSearchRef.current = null;
        failedRef.current = true;
        initializationPhaseRef.current = "failed";
        initialReadyRequestedRef.current = false;
        readyRef.current = false;
        setIsEngineReady(false);
        setEngineError(message);
        // Stopping is best-effort: another native exception must not prevent failure callbacks.
        try {
            sendCommandToStockfish("stop");
        } catch (error) {
            console.log("Could not stop failed Stockfish:", error);
        }
        if (active && !active.cancelled) active.onError(message);
        pending?.onError(message);
    }, [clearInitializationTimer, logSearch, sendCommandToStockfish]);

    const sendCommand = useCallback((command: string) => {
        if (failedRef.current) return false;
        try {
            sendCommandToStockfish(command);
            return true;
        } catch (error) {
            console.log("Stockfish command failed:", command, error);
            failEngine("A computer command failed. Restart the app before playing Stockfish again.");
            return false;
        }
    }, [failEngine, sendCommandToStockfish]);

    const watchInitialization = useCallback((phase: "waiting-uciok" | "waiting-readyok") => {
        clearInitializationTimer();
        const timer = setTimeout(() => {
            if (initializationPhaseRef.current !== phase || initializationTimerRef.current !== timer) return;
            console.log("Stockfish initialization timed out:", phase);
            const response = phase === "waiting-uciok" ? "uciok" : "readyok";
            failEngine(`The computer could not initialize (waiting for ${response}). Restart the app before playing Stockfish again.`, "initialization-timeout");
        }, INITIALIZATION_TIMEOUT_MS);
        initializationTimerRef.current = timer;
    }, [clearInitializationTimer, failEngine]);

    const failSearch = useCallback(() => {
        failEngine("The computer did not respond. Restart the app before playing Stockfish again.", "timeout");
    }, [failEngine]);

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
        if (!sendCommand(`setoption name UCI_LimitStrength value ${search.profile !== "hint"}`)) return;
        if (!sendCommand(`setoption name UCI_Elo value ${profile.elo}`)) return;
        if (!sendCommand(`setoption name MultiPV value ${search.profile === "skilled" ? 4 : 1}`)) return;
        if (!sendCommand(`position fen ${search.fen}`)) return;
        sendCommand(search.profile === "skilled"
            ? "go depth 6 movetime 750"
            : `go movetime ${profile.milliseconds}`);
    }, [logSearch, sendCommand, watchSearch]);

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
            if (!sendCommand("ucinewgame")) return;
            sendCommand("isready");
        } else {
            beginSearch(search);
        }
    }, [beginSearch, logSearch, sendCommand, watchSearch]);

    const stopSearch = useCallback((search: Search) => {
        const wasCancelled = search.cancelled;
        search.cancelled = true;
        if (search.phase === "searching") {
            search.phase = "stopping";
            search.phaseStartedAt = Date.now();
            logSearch("stopping", search);
            watchSearch(search);
            sendCommand("stop");
        } else if (!wasCancelled) logSearch("cancelled", search);
    }, [logSearch, sendCommand, watchSearch]);

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
                if (initializationPhaseRef.current !== "waiting-uciok") return;
                initializationPhaseRef.current = "waiting-readyok";
                initialReadyRequestedRef.current = false;
                watchInitialization("waiting-readyok");
                if (!sendCommand("setoption name Threads value 3")) return;
                if (!sendCommand("ucinewgame")) return;
                // Mark the readiness request before submission to allow a synchronous reply.
                initialReadyRequestedRef.current = true;
                sendCommand("isready");
                return;
            }
            const active = activeSearchRef.current;
            if (output === "readyok") {
                if (initializationPhaseRef.current === "waiting-readyok" && initialReadyRequestedRef.current) {
                    clearInitializationTimer();
                    initializationPhaseRef.current = "ready";
                    initialReadyRequestedRef.current = false;
                    readyRef.current = true;
                    setIsEngineReady(true);
                    startPendingSearch();
                    return;
                }
                if (initializationPhaseRef.current !== "ready") return;
                if (active) logSearch("readyok", active);
                if (active?.phase === "preparing" && !active.cancelled) {
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
            if (failedRef.current || activeSearchRef.current !== active) return;
            if (output.startsWith("bestmove")) {
                // Drain bestmove BEFORE asking for readyok. isready can respond during search.
                active.phase = "syncing";
                active.phaseStartedAt = Date.now();
                logSearch("syncing", active);
                watchSearch(active);
                sendCommand("isready");
            }
        };
    }, [beginSearch, clearInitializationTimer, logSearch, sendCommand, startPendingSearch, watchInitialization, watchSearch]);

    useEffect(() => {
        if (loopStartedRef.current) {
            // Effect cleanup/replay must not leave an unfinished startup without a deadline.
            const phase = initializationPhaseRef.current;
            if (phase === "waiting-uciok" || phase === "waiting-readyok") watchInitialization(phase);
            return;
        }
        loopStartedRef.current = true;
        watchInitialization("waiting-uciok");
        try {
            stockfishLoop();
        } catch (error) {
            console.log("Stockfish startup failed:", error);
            failEngine("The computer could not start. Restart the app before playing Stockfish again.");
            return;
        }
        sendCommand("uci");
    }, [failEngine, sendCommand, stockfishLoop, watchInitialization]);

    useEffect(() => () => {
        clearInitializationTimer();
        const active = activeSearchRef.current;
        if (active?.timeout) clearTimeout(active.timeout);
        activeSearchRef.current = null;
        pendingSearchRef.current = null;
        outputRef.current = () => {};
        outputBufferRef.current = "";
    }, [clearInitializationTimer]);

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
