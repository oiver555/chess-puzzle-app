import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useSyncExternalStore } from "react";
import { Alert } from "react-native";
import { STORAGE_KEYS } from "@/constants/storage";

type Preferences = { highlightMoves: boolean; showMoveHints: boolean; soundEnabled: boolean };
let preferences: Preferences = { highlightMoves: true, showMoveHints: false, soundEnabled: true };
let initialized = false;
let initialization: Promise<void> | undefined;
let writes: Promise<unknown> = Promise.resolve();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());

export function initializeSettings(): Promise<void> {
  if (initialized) return Promise.resolve();
  if (!initialization) {
    initialization = (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw !== null) {
        const value: unknown = JSON.parse(raw);
        if (!value || typeof value !== "object" || Array.isArray(value) ||
            !("highlightMoves" in value) || typeof value.highlightMoves !== "boolean" ||
            !("showMoveHints" in value) || typeof value.showMoveHints !== "boolean" ||
            !("soundEnabled" in value) || typeof value.soundEnabled !== "boolean") {
          throw new Error("Invalid saved settings");
        }
        preferences = { highlightMoves: value.highlightMoves, showMoveHints: value.showMoveHints, soundEnabled: value.soundEnabled };
      }
      initialized = true;
      notify();
    })().catch(error => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}

export function useSettings(): Preferences {
  const value = useSyncExternalStore(
    listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    () => preferences,
    () => preferences,
  );
  useEffect(() => {
    void initializeSettings().catch(error => {
      console.log("Could not load settings:", error);
      Alert.alert("Settings unavailable", "Saved preferences could not be loaded. Sounds remain muted and preferences will not be overwritten. Please reopen this screen to retry.");
    });
  }, []);
  return value;
}

export async function updateSetting<K extends keyof Preferences>(key: K, value: Preferences[K]): Promise<void> {
  // No update can race ahead of an unread preference record.
  await initializeSettings();
  preferences = { ...preferences, [key]: value };
  notify();
  const snapshot = preferences;
  const write = writes.catch(() => {}).then(() => AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(snapshot)));
  writes = write;
  await write;
}

export function soundsEnabled(): boolean {
  return initialized && preferences.soundEnabled;
}
