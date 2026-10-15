import React, { createContext, useContext, useCallback, useEffect, useRef } from "react";

import { useStockfish } from "@loloof64/react-native-stockfish";

type OutputHandler = (output: string) => void;

type StockfishContextType = {
    sendCommandToStockfish: (command: string) => void;
    setOutputHandler: (handler: OutputHandler | null) => void;
};

const StockfishContext = createContext<StockfishContextType | null>(null);

export function StockfishProvider({ children }: { children: React.ReactNode }) {
    const loopStartedRef = useRef(false);
    const outputHandlerRef = useRef<OutputHandler | null>(null);

    const setOutputHandler = useCallback((handler: OutputHandler | null) => {
        outputHandlerRef.current = handler;
    }, []);

    const { stockfishLoop, sendCommandToStockfish } = useStockfish({
        onOutput: useCallback((output: string) => {
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
        sendCommandToStockfish("setoption name UCI_LimitStrength value true");
        sendCommandToStockfish("setoption name UCI_Elo value 1350");
        sendCommandToStockfish("setoption name MultiPV value 10");
        sendCommandToStockfish("setoption name Threads value 3");
        sendCommandToStockfish("isready");
        sendCommandToStockfish("ucinewgame");
    }, []);

    return (
        <StockfishContext.Provider
            value={{
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