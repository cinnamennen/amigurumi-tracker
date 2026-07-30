import {
  STASH_SCHEMA_VERSION,
  USER_STATE_SCHEMA_VERSION,
  UserStateStore,
  type PatternUserState,
} from "@amigurumi/schema";
import { defineStore } from "pinia";
import { reactive, watch } from "vue";

const STORAGE_KEY = "amigurumi-user-state";

function defaultState(): UserStateStore {
  return {
    version: USER_STATE_SCHEMA_VERSION,
    patterns: {},
    stash: { version: STASH_SCHEMA_VERSION, onHandYdsByFamily: {} },
  };
}

function loadState(): UserStateStore {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  const parsed = UserStateStore.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : defaultState();
}

function defaultPatternState(): PatternUserState {
  return { haveIt: false, completed: false, notes: "" };
}

export const useUserStateStore = defineStore("userState", () => {
  const state = reactive<UserStateStore>(loadState());

  watch(
    state,
    () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
    { deep: true },
  );

  function patternState(id: string): PatternUserState {
    return state.patterns[id] ?? defaultPatternState();
  }

  function setHaveIt(id: string, haveIt: boolean) {
    state.patterns[id] = { ...patternState(id), haveIt };
  }

  function setCompleted(id: string, completed: boolean) {
    state.patterns[id] = { ...patternState(id), completed };
  }

  function setNotes(id: string, notes: string) {
    state.patterns[id] = { ...patternState(id), notes };
  }

  return { state, patternState, setHaveIt, setCompleted, setNotes };
});
