

import AsyncStorage from "@react-native-async-storage/async-storage";
import { SavedAppState, SavedMatchState } from "@/types/match";

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