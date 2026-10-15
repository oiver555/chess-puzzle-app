import { StockfishProvider } from "@/providers/StockfishProvider";
import * as SplashScreen from "expo-splash-screen";

import { Stack } from "expo-router";

SplashScreen.preventAutoHideAsync();

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