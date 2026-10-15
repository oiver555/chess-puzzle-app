import AsyncStorage from "@react-native-async-storage/async-storage";
import { SavedAppState, SavedMatchState } from "@/types/match";
import { OpeningProgress } from "@/data/openings";
import { STORAGE_KEYS } from "@/constants/storage";

export async function saveMatchState(state: SavedMatchState) {
  console.log(state);
  await AsyncStorage.setItem(
    STORAGE_KEYS.MATCH_STORAGE_KEY,
    JSON.stringify(state),
  );
}

export async function saveWins(wins: number) {
  await AsyncStorage.setItem(STORAGE_KEYS.WINS, JSON.stringify(wins));
}
export async function saveHints(hints: number) {
  await AsyncStorage.setItem(STORAGE_KEYS.HINTS, JSON.stringify(hints));
}

export async function loadHints(): Promise<number> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.HINTS);

  if (data === null) {
    return 3; // or whatever default you want
  }

  return JSON.parse(data);
}

export async function loadWins(): Promise<number> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.WINS);

  if (data === null) {
    return 0; // or whatever default you want
  }

  return JSON.parse(data);
}

export async function loadMatchState(): Promise<SavedMatchState | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY);

  if (!data) return null;
  return JSON.parse(data);
}

export async function clearMatchState() {
  await AsyncStorage.removeItem(STORAGE_KEYS.MATCH_STORAGE_KEY);
}

export async function saveAppState(state: SavedAppState) {
  await AsyncStorage.setItem(STORAGE_KEYS.APP_STATE_KEY, JSON.stringify(state));
}

export async function loadAppState(): Promise<SavedAppState | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.APP_STATE_KEY);
  return data ? JSON.parse(data) : null;
}

export async function clearAppState() {
  await AsyncStorage.removeItem(STORAGE_KEYS.APP_STATE_KEY);
}

export async function getOpeningProgress(
  openingId: string,
): Promise<OpeningProgress | null> {
  const saved = await AsyncStorage.getItem(STORAGE_KEYS.OPENING_PROGRESS);

  if (!saved) {
    return null;
  }

  const allProgress: Record<string, OpeningProgress> = JSON.parse(saved);

  return allProgress[openingId] ?? null;
}

export async function getLearnedOpeningsCount() {
  const saved = await AsyncStorage.getItem(STORAGE_KEYS.OPENING_PROGRESS);

  if (!saved) return 0;

  const allProgress: Record<string, OpeningProgress> = JSON.parse(saved);

  return Object.values(allProgress).filter(
    (progress) => progress.mastery >= 100,
  ).length;
}
