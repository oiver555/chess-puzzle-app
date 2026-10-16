import AsyncStorage from "@react-native-async-storage/async-storage";
import { Difficulty, SavedAppState, SavedMatchState } from "@/types/match";
import { Chess } from "chess.js";
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

export function isSupportedDifficulty(value: unknown): value is Difficulty {
  return value === "rookie" || value === "skilled" || value === "advanced" || value === "master";
}

function isSquare(value: unknown): boolean {
  return typeof value === "string" && /^[a-h][1-8]$/.test(value);
}

export async function loadMatchState(): Promise<SavedMatchState | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY);

  if (data === null) return null;
  const state: unknown = JSON.parse(data);
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("Invalid saved match");
  }
  const saved = state as Record<string, unknown>;
  const lastMove = saved.lastMove;
  const validLastMove = lastMove === undefined || lastMove === null || (
    typeof lastMove === "object" && !Array.isArray(lastMove) &&
    "from" in lastMove && "to" in lastMove && (
      (lastMove.from === null && lastMove.to === null) ||
      (isSquare(lastMove.from) && isSquare(lastMove.to))
    )
  );
  if (typeof saved.fen !== "string" || typeof saved.pgn !== "string" ||
      (saved.playerColor !== "w" && saved.playerColor !== "b") ||
      saved.aiColor !== (saved.playerColor === "w" ? "b" : "w") ||
      !isSupportedDifficulty(saved.difficulty) ||
      (saved.selectedSquare !== null && !isSquare(saved.selectedSquare)) ||
      !validLastMove || typeof saved.savedAt !== "string" ||
      !Number.isFinite(Date.parse(saved.savedAt))) {
    throw new Error("Invalid saved match settings");
  }
  // Validate on temporary boards; never partially mutate the live match.
  const expected = new Chess(saved.fen);
  const reconstructed = new Chess();
  reconstructed.loadPgn(saved.pgn);
  if (reconstructed.fen() !== expected.fen()) {
    throw new Error("Saved FEN and PGN do not match");
  }
  return state as SavedMatchState;
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
