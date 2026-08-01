import {
  STASH_SCHEMA_VERSION,
  USER_STATE_SCHEMA_VERSION,
  UserStateStore,
  type ColorFamily,
  type PatternUserState,
} from "@amigurumi/schema";
import { defineStore } from "pinia";
import { reactive, watch } from "vue";

const STORAGE_KEY = "amigurumi-user-state";

function defaultState(): UserStateStore {
  return {
    version: USER_STATE_SCHEMA_VERSION,
    patterns: {},
    stash: { version: STASH_SCHEMA_VERSION, onHandYdsByFamily: {}, quickHaveFamilies: [] },
  };
}

function loadState(): UserStateStore {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  // Malformed JSON (corrupted storage, a future incompatible write) should
  // fall back to defaults, not crash the whole app on load.
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return defaultState();
  }
  const parsed = UserStateStore.safeParse(json);
  return parsed.success ? parsed.data : defaultState();
}

function defaultPatternState(): PatternUserState {
  return { haveIt: false, completed: false, notes: "", wantToMake: false };
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

  function setWantToMake(id: string, wantToMake: boolean) {
    state.patterns[id] = { ...patternState(id), wantToMake };
  }

  function toggleQuickHave(family: ColorFamily) {
    const families = state.stash.quickHaveFamilies;
    const index = families.indexOf(family);
    if (index === -1) {
      families.push(family);
    } else {
      families.splice(index, 1);
    }
  }

  return { state, patternState, setHaveIt, setCompleted, setNotes, setWantToMake, toggleQuickHave };
});
