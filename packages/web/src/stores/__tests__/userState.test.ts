import { STASH_SCHEMA_VERSION, USER_STATE_SCHEMA_VERSION } from "@amigurumi/schema";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

import { useUserStateStore } from "../userState";

const STORAGE_KEY = "amigurumi-user-state";

beforeEach(() => {
  localStorage.clear();
  setActivePinia(createPinia());
});

describe("default state", () => {
  it("starts empty with the current schema versions when localStorage is empty", () => {
    const store = useUserStateStore();
    expect(store.state.version).toBe(USER_STATE_SCHEMA_VERSION);
    expect(store.state.patterns).toEqual({});
    expect(store.state.stash).toEqual({
      version: STASH_SCHEMA_VERSION,
      onHandYdsByFamily: {},
      quickHaveFamilies: [],
    });
  });

  it("returns a default (not-have-it, not-completed, empty notes) state for an unknown pattern id", () => {
    const store = useUserStateStore();
    expect(store.patternState("some-pattern")).toEqual({ haveIt: false, completed: false, notes: "" });
  });
});

describe("mutations persist to localStorage", () => {
  it("setHaveIt updates state and writes through to localStorage", async () => {
    const store = useUserStateStore();
    store.setHaveIt("walter-animal", true);
    await nextTick();

    expect(store.patternState("walter-animal").haveIt).toBe(true);
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.patterns["walter-animal"].haveIt).toBe(true);
  });

  it("setCompleted updates state and writes through to localStorage", async () => {
    const store = useUserStateStore();
    store.setCompleted("walter-animal", true);
    await nextTick();

    expect(store.patternState("walter-animal").completed).toBe(true);
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.patterns["walter-animal"].completed).toBe(true);
  });

  it("setNotes updates state and writes through to localStorage, without clobbering other fields", async () => {
    const store = useUserStateStore();
    store.setHaveIt("walter-animal", true);
    store.setNotes("walter-animal", "needs a bigger nose");
    await nextTick();

    expect(store.patternState("walter-animal")).toEqual({
      haveIt: true,
      completed: false,
      notes: "needs a bigger nose",
    });
  });

  it("stash yardage mutations persist to localStorage", async () => {
    const store = useUserStateStore();
    store.state.stash.onHandYdsByFamily.Brown = 42;
    await nextTick();

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.stash.onHandYdsByFamily.Brown).toBe(42);
  });

  it("toggleQuickHave adds and then removes a family, persisting to localStorage", async () => {
    const store = useUserStateStore();
    store.toggleQuickHave("Red");
    await nextTick();

    expect(store.state.stash.quickHaveFamilies).toEqual(["Red"]);
    let persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.stash.quickHaveFamilies).toEqual(["Red"]);

    store.toggleQuickHave("Red");
    await nextTick();

    expect(store.state.stash.quickHaveFamilies).toEqual([]);
    persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.stash.quickHaveFamilies).toEqual([]);
  });
});

describe("loading existing localStorage state", () => {
  it("round-trips a previously-saved valid state on store creation (simulates a page reload)", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: USER_STATE_SCHEMA_VERSION,
        patterns: { "walter-animal": { haveIt: true, completed: false, notes: "hi" } },
        stash: { version: STASH_SCHEMA_VERSION, onHandYdsByFamily: { Brown: 10 } },
      }),
    );

    const store = useUserStateStore();
    expect(store.patternState("walter-animal")).toEqual({ haveIt: true, completed: false, notes: "hi" });
    expect(store.state.stash.onHandYdsByFamily.Brown).toBe(10);
  });

  it("backfills quickHaveFamilies to an empty array for state saved before that field existed", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: USER_STATE_SCHEMA_VERSION,
        patterns: {},
        stash: { version: STASH_SCHEMA_VERSION, onHandYdsByFamily: {} },
      }),
    );

    const store = useUserStateStore();
    expect(store.state.stash.quickHaveFamilies).toEqual([]);
  });

  it("falls back to default state when localStorage holds a valid-JSON but wrong-shaped value", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ totally: "not the right shape" }));

    const store = useUserStateStore();
    expect(store.state.version).toBe(USER_STATE_SCHEMA_VERSION);
    expect(store.state.patterns).toEqual({});
  });

  it("falls back to default state instead of throwing when localStorage holds malformed JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");

    expect(() => useUserStateStore()).not.toThrow();
    const store = useUserStateStore();
    expect(store.state.version).toBe(USER_STATE_SCHEMA_VERSION);
    expect(store.state.patterns).toEqual({});
  });
});
