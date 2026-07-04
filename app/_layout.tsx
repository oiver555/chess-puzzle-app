import { StockfishProvider } from "@/providers/StockfishProvider";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <StockfishProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </StockfishProvider>
  );
}