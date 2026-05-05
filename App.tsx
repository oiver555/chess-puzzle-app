import React from "react"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"; // ✅ correct
import Chessboard from "./components/Chessboard";

const App = () => {

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }}>
                <Chessboard />
            </SafeAreaView>
        </SafeAreaProvider>
    )
}

export default App