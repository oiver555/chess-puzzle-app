import AsyncStorage from "@react-native-async-storage/async-storage";
import { Difficulty, SavedAppState, SavedMatchState } from "@/types/match";
import { Chess, DEFAULT_POSITION } from "chess.js";
import { OpeningProgress } from "@/data/openings";
import { STORAGE_KEYS } from "@/constants/storage";
import { requiredNumOfWins } from "@/constants/globals";

type IdentifiedMatchState = SavedMatchState & { matchId?: string };
type Progress = { wins: number; hints: number; awardedMatchIds: string[] };
const PROGRESS_KEY = "chess-sandbox-progress-v1";
const AWARD_KEY = "chess-sandbox-pending-award-v1";
let progressQueue: Promise<unknown> = Promise.resolve();
let pendingHints: number | undefined;
const pendingAwards = new Set<string>();
let nextMatchId = 0;

export function createMatchId(): string {
  return `${Date.now()}-${++nextMatchId}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function isMatchId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 200;
}

function queueProgress<T>(operation: () => Promise<T>): Promise<T> {
  const result = progressQueue.catch(() => {}).then(operation);
  progressQueue = result;
  return result;
}

function isHintBalance(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isWinProgress(value: unknown): value is number {
  return isHintBalance(value) && value <= requiredNumOfWins;
}

async function writeProgress(progress: Progress) {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

async function applyAward(progress: Progress, matchId: string): Promise<Progress> {
  if (progress.awardedMatchIds.includes(matchId)) return progress;
  const wins = progress.wins === requiredNumOfWins ? 1 : progress.wins + 1;
  const hints = progress.hints + (wins === requiredNumOfWins ? 2 : 0);
  if (!isHintBalance(hints)) throw new Error("Hint balance overflow");
  const updated = { wins, hints, awardedMatchIds: [...progress.awardedMatchIds, matchId] };
  // Count, bonus, and duplicate protection are committed in the same value.
  await writeProgress(updated);
  return updated;
}

async function readProgress(): Promise<Progress> {
  const raw = await AsyncStorage.getItem(PROGRESS_KEY);
  let progress: Progress;
  if (raw === null) {
    const wins = await AsyncStorage.getItem(STORAGE_KEYS.WINS);
    const hints = await AsyncStorage.getItem(STORAGE_KEYS.HINTS);
    progress = {
      wins: wins === null ? 0 : JSON.parse(wins),
      hints: hints === null ? 3 : JSON.parse(hints),
      awardedMatchIds: [],
    };
    if (!isWinProgress(progress.wins) || !isHintBalance(progress.hints)) {
      throw new Error("Invalid saved progress");
    }
    await writeProgress(progress);
  } else {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" ||
        !("wins" in value) || !isWinProgress(value.wins) ||
        !("hints" in value) || !isHintBalance(value.hints) ||
        !("awardedMatchIds" in value) || !Array.isArray(value.awardedMatchIds) ||
        !value.awardedMatchIds.every(isMatchId)) {
      throw new Error("Invalid saved progress");
    }
    progress = value as Progress;
  }
  // Failed spending is retried before applying any subsequent bonus.
  if (pendingHints !== undefined) {
    progress = { ...progress, hints: pendingHints };
    await writeProgress(progress);
    pendingHints = undefined;
  }
  const pending = await AsyncStorage.getItem(AWARD_KEY);
  if (pending !== null) {
    const matchId: unknown = JSON.parse(pending);
    if (!isMatchId(matchId)) throw new Error("Invalid pending victory");
    progress = await applyAward(progress, matchId);
    await AsyncStorage.removeItem(AWARD_KEY);
    pendingAwards.delete(matchId);
  }
  // A failed first journal write can still be retried during this app session.
  for (const matchId of pendingAwards) {
    if (!progress.awardedMatchIds.includes(matchId)) {
      await AsyncStorage.setItem(AWARD_KEY, JSON.stringify(matchId));
      progress = await applyAward(progress, matchId);
      await AsyncStorage.removeItem(AWARD_KEY);
    }
    pendingAwards.delete(matchId);
  }
  return progress;
}

export function loadProgress(): Promise<Progress> {
  return queueProgress(readProgress);
}

export function awardVictory(matchId: string): Promise<Progress> {
  return queueProgress(async () => {
    if (!isMatchId(matchId)) throw new Error("Invalid victory match identifier");
    try {
      const progress = await readProgress();
      if (progress.awardedMatchIds.includes(matchId)) return progress;
      // Recovery can finish this intent even if the terminal board never saves.
      await AsyncStorage.setItem(AWARD_KEY, JSON.stringify(matchId));
      const updated = await applyAward(progress, matchId);
      await AsyncStorage.removeItem(AWARD_KEY);
      return updated;
    } catch (error) {
      pendingAwards.add(matchId);
      throw error;
    }
  });
}

export async function saveMatchState(state: IdentifiedMatchState) {
  console.log(state);
  await AsyncStorage.setItem(
    STORAGE_KEYS.MATCH_STORAGE_KEY,
    JSON.stringify(state),
  );
}

export async function saveHints(hints: number) {
  if (!isHintBalance(hints)) throw new Error("Invalid hint balance");
  await queueProgress(async () => {
    try {
      const progress = await readProgress();
      await writeProgress({ ...progress, hints });
    } catch (error) {
      pendingHints = hints;
      throw error;
    }
  });
}

export async function loadHints(): Promise<number> {
  return (await loadProgress()).hints;
}

export async function loadWins(): Promise<number> {
  return (await loadProgress()).wins;
}

export function isSupportedDifficulty(value: unknown): value is Difficulty {
  return value === "rookie" || value === "skilled" || value === "advanced" || value === "master";
}

function isSquare(value: unknown): boolean {
  return typeof value === "string" && /^[a-h][1-8]$/.test(value);
}

export async function loadMatchState(): Promise<IdentifiedMatchState | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.MATCH_STORAGE_KEY);

  if (data === null) return null;
  const state: unknown = JSON.parse(data);
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("Invalid saved match");
  }
  const saved = state as Record<string, unknown>;
  if (typeof saved.fen !== "string" || typeof saved.pgn !== "string" ||
      (saved.playerColor !== "w" && saved.playerColor !== "b") ||
      saved.aiColor !== (saved.playerColor === "w" ? "b" : "w") ||
      !isSupportedDifficulty(saved.difficulty) ||
      (saved.selectedSquare !== null && !isSquare(saved.selectedSquare)) ||
      (saved.matchId !== undefined && !isMatchId(saved.matchId)) ||
      typeof saved.savedAt !== "string" ||
      !Number.isFinite(Date.parse(saved.savedAt))) {
    throw new Error("Invalid saved match settings");
  }
  // Validate on temporary boards; never partially mutate the live match.
  const expected = new Chess(saved.fen);
  const reconstructed = new Chess();
  reconstructed.loadPgn(saved.pgn);
  const history = reconstructed.history({ verbose: true });
  if ((history[0]?.before ?? reconstructed.fen()) !== DEFAULT_POSITION) {
    throw new Error("Saved match must start from the standard position");
  }
  if (reconstructed.fen() !== expected.fen()) {
    throw new Error("Saved FEN and PGN do not match");
  }
  const lastMove = history[history.length - 1];
  return {
    ...state as IdentifiedMatchState,
    lastMove: lastMove ? { from: lastMove.from, to: lastMove.to } : null,
  };
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
