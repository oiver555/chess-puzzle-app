import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";

import { useStockfish } from "@loloof64/react-native-stockfish";

type OutputHandler = (output: string) => void;

type StockfishContextType = {
    isEngineReady: boolean;
    sendCommandToStockfish: (command: string) => void;
    setOutputHandler: (handler: OutputHandler | null) => void;
};

const StockfishContext = createContext<StockfishContextType | null>(null);

export function StockfishProvider({ children }: { children: React.ReactNode }) {
    const [isUciInitialized, setIsUciInitialized] = useState(false);
    const [isEngineReady, setIsEngineReady] = useState(false);
    const loopStartedRef = useRef(false);
    const outputHandlerRef = useRef<OutputHandler | null>(null);

    const setOutputHandler = useCallback((handler: OutputHandler | null) => {
        outputHandlerRef.current = handler;
    }, []);

    const { stockfishLoop, sendCommandToStockfish } = useStockfish({
        onOutput: useCallback((output: string) => {
            const response = output.trim();
            if (response === "uciok") {
                setIsUciInitialized(true);
            } else if (response === "readyok") {
                setIsEngineReady(true);
            }
            outputHandlerRef.current?.(output);
        }, []),

        onError: useCallback((error: string) => {
            console.log("Stockfish error:", error);
        }, []),
    });

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

    return (
        <StockfishContext.Provider
            value={{
                isEngineReady,
                sendCommandToStockfish,
                setOutputHandler,
            }}
        >
            {children}
        </StockfishContext.Provider>
    );
}

export function useStockfishContext() {
    const context = useContext(StockfishContext);

    if (!context) {
        throw new Error("useStockfishContext must be used inside StockfishProvider");
    }

    return context;
}
