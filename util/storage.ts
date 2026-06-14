

import AsyncStorage from "@react-native-async-storage/async-storage";
import { SavedAppState, SavedMatchState } from "@/types/match";
import { OpeningProgress } from "@/data/openings";
import { STORAGE_KEYS } from "@/constants/storage";

const MATCH_STORAGE_KEY = "current_match";


export async function saveMatchState(state: SavedMatchState) {
    await AsyncStorage.setItem(MATCH_STORAGE_KEY, JSON.stringify(state));
}

export async function loadMatchState(): Promise<SavedMatchState | null> {
    const data = await AsyncStorage.getItem(MATCH_STORAGE_KEY);
    console.log(data);

    if (!data) return null;

    return JSON.parse(data);
}

export async function clearMatchState() {
    await AsyncStorage.removeItem(MATCH_STORAGE_KEY);
}

const APP_STATE_KEY = "app_state";

export async function saveAppState(state: SavedAppState) {
    await AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
}

export async function loadAppState(): Promise<SavedAppState | null> {
    const data = await AsyncStorage.getItem(APP_STATE_KEY);
    return data ? JSON.parse(data) : null;
}

export async function clearAppState() {
    await AsyncStorage.removeItem(APP_STATE_KEY);
}


export async function getOpeningProgress(
    openingId: string
): Promise<OpeningProgress | null> {
    const saved = await AsyncStorage.getItem(
        STORAGE_KEYS.OPENING_PROGRESS
    );

    if (!saved) {
        return null;
    }

    const allProgress: Record<string, OpeningProgress> =
        JSON.parse(saved);

    return allProgress[openingId] ?? null;
}

export async function getLearnedOpeningsCount() {
    const saved = await AsyncStorage.getItem(
        STORAGE_KEYS.OPENING_PROGRESS
    );

    if (!saved) return 0;

    const allProgress: Record<string, OpeningProgress> =
        JSON.parse(saved);

    return Object.values(allProgress).filter(
        (progress) => progress.mastery >= 100
    ).length;
}