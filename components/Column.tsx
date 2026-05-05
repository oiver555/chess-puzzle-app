import { View } from "react-native"

const Column = () => {
    return (
        <View style={{ backgroundColor: "red", width: "100%", aspectRatio: 1 }}>
            <View style={{ backgroundColor: "green", width: "12.5%", aspectRatio: 1 }} />
            <View style={{ backgroundColor: "blue", width: "12.5%", aspectRatio: 1 }} />
            <View style={{ backgroundColor: "green", width: "12.5%", aspectRatio: 1 }} />
            <View style={{ backgroundColor: "blue", width: "12.5%", aspectRatio: 1 }} />
            <View style={{ backgroundColor: "green", width: "12.5%", aspectRatio: 1 }} />
            <View style={{ backgroundColor: "blue", width: "12.5%", aspectRatio: 1 }} />
            <View style={{ backgroundColor: "green", width: "12.5%", aspectRatio: 1 }} />
            <View style={{ backgroundColor: "blue", width: "12.5%", aspectRatio: 1 }} />
        </View>
    )
}

export default Column