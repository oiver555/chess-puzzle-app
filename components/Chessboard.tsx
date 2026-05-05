import React from "react"
import { View, Text, StyleSheet, Pressable, } from "react-native"
import { useAudioPlayer } from "expo-audio";
import WK from "../assets/pieces/wK.svg";
import BB from "../assets/pieces/bB.svg";
import BN from "../assets/pieces/bN.svg";
import BP from "../assets/pieces/bP.svg";
import BR from "../assets/pieces/bR.svg";
import BQ from "../assets/pieces/bQ.svg";
import BK from "../assets/pieces/bK.svg";
import WP from "../assets/pieces/wP.svg";
import WR from "../assets/pieces/wR.svg";
import WN from "../assets/pieces/wN.svg";
import WB from "../assets/pieces/wB.svg";
import WQ from "../assets/pieces/wQ.svg";

import {
    getLegalMoves,
    movePiece,
    getPieceAtSquare,
} from "../logic/chessGame";

const moveSound = require("../assets/sounds/move-self.mp3");

const Chessboard = () => {
    const movePlayer = useAudioPlayer(moveSound);
    const [selectedSquare, setSelectedSquare] = React.useState<string | null>(null);
    const [legalMoves, setLegalMoves] = React.useState<string[]>([]);
    const [refresh, setRefresh] = React.useState(0);

    const pieceMap = {
        r: BR,
        n: BN,
        b: BB,
        q: BQ,
        k: BK,
        p: BP,

        R: WR,
        N: WN,
        B: WB,
        Q: WQ,
        K: WK,
        P: WP,
    };

    const indexToSquare = (i: number) => {
        const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
        const row = Math.floor(i / 8);        
        const col = i % 8;
        const rank = 8 - row;

        return `${files[col]}${rank}`;
    };

    return (
        <View style={{ flex: 1 }}>
            <Text style={styles.text}>Chess Mockup</Text>
            <View style={{ flex: 1, justifyContent: "center", }}>
                <View style={styles.board}>
                    {Array.from({ length: 64 }).map((_, i) => {
                        const squareName = indexToSquare(i);
                        console.log(squareName);
                        
                        const isSelected = selectedSquare === squareName;
                        // @ts-ignore
                        const chessPiece = getPieceAtSquare(squareName);
                        const pieceCode = chessPiece
                            ? chessPiece.color === "w"
                                ? chessPiece.type.toUpperCase()
                                : chessPiece.type
                            : "";
                        // @ts-ignore
                        const Piece = pieceCode ? pieceMap[pieceCode] : null;
                        const isLegalMove = legalMoves.includes(squareName);
                        const row = Math.floor(i / 8);
                        const col = i % 8;
                        const isDark = (row + col) % 2 === 1;


                        return (
                            <Pressable
                                key={i}
                                style={[
                                    styles.square,
                                    { backgroundColor: isDark ? "blue" : "green" },
                                    isSelected && { backgroundColor: "yellow" },
                                ]}
                                onPress={() => {
                                    const piece = getPieceAtSquare(squareName);


                                    if (selectedSquare && legalMoves.includes(squareName)) {
                                        movePiece(selectedSquare, squareName);
                                        movePlayer.volume = 1.0;
                                        movePlayer.seekTo(0);
                                        movePlayer.play();

                                        setSelectedSquare(null);
                                        setLegalMoves([]);
                                        setRefresh((prev) => prev + 1);
                                        return;
                                    }

                                    if (piece) {
                                        setSelectedSquare(squareName);
                                        setLegalMoves(getLegalMoves(squareName));
                                        console.log(piece);
                                    } else {
                                        setSelectedSquare(null);
                                        setLegalMoves([]);
                                        console.log(squareName);
                                    }
                                }}

                            >

                                {/* <Text style={{width:50, height: 50}}>{squareName}</Text> */}
                                {Piece ? <Piece width={40} height={40} /> : <View style={{ width: 40, height: 40 }} />}
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </View>
    )

}



const styles = StyleSheet.create({
    text: {
        textAlign: "center"
    },
    board: {
        width: "100%",
        aspectRatio: 1,
        flexDirection: "row",
        flexWrap: "wrap",
    },
    square: {
        width: "12.5%",
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    piece: {
        fontSize: 32,
    },
})


export default Chessboard