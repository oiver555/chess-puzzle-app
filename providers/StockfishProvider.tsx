import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { useStockfish } from "@loloof64/react-native-stockfish";

type SearchRequest = {
    owner: symbol;
    fen: string;
    onOutput: (output: string) => void;
    onError: (message: string) => void;
};

type Search = SearchRequest & {
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

    const { stockfishLoop, sendCommandToStockfish } = useStockfish({
        onOutput: useCallback((output: string) => outputRef.current(output.trim()), []),
        onError: useCallback((error: string) => console.log("Stockfish error:", error), []),
    });

    const failSearch = useCallback(() => {
        const active = activeSearchRef.current;
        const pending = pendingSearchRef.current;
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
    }, [sendCommandToStockfish]);

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
        watchSearch(search);
        sendCommandToStockfish(`position fen ${search.fen}`);
        sendCommandToStockfish("go depth 1 movetime 1500");
    }, [sendCommandToStockfish, watchSearch]);

    const startPendingSearch = useCallback(() => {
        if (activeSearchRef.current || !readyRef.current || failedRef.current) return;
        const pending = pendingSearchRef.current;
        if (!pending) return;
        pendingSearchRef.current = null;
        const search: Search = { ...pending, phase: "preparing", cancelled: false };
        activeSearchRef.current = search;
        if (newGameRef.current) {
            newGameRef.current = false;
            watchSearch(search);
            sendCommandToStockfish("ucinewgame");
            sendCommandToStockfish("isready");
        } else {
            beginSearch(search);
        }
    }, [beginSearch, sendCommandToStockfish, watchSearch]);

    const stopSearch = useCallback((search: Search) => {
        search.cancelled = true;
        if (search.phase === "searching") {
            search.phase = "stopping";
            watchSearch(search);
            sendCommandToStockfish("stop");
        }
    }, [sendCommandToStockfish, watchSearch]);

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
            if (!active.cancelled) active.onOutput(output);
            if (output.startsWith("bestmove")) {
                // Drain bestmove BEFORE asking for readyok. isready can respond during search.
                active.phase = "syncing";
                watchSearch(active);
                sendCommandToStockfish("isready");
            }
        };
    }, [beginSearch, sendCommandToStockfish, startPendingSearch, watchSearch]);

    useEffect(() => {
        if (loopStartedRef.current) return;
        loopStartedRef.current = true;
        stockfishLoop();
        sendCommandToStockfish("uci");
    }, [stockfishLoop, sendCommandToStockfish]);

    useEffect(() => {
        if (!isUciInitialized) return;
        sendCommandToStockfish("setoption name UCI_LimitStrength value true");
        sendCommandToStockfish("setoption name UCI_Elo value 1350");
        sendCommandToStockfish("setoption name MultiPV value 10");
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
