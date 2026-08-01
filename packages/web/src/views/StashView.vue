<script setup lang="ts">
import { ColorFamily } from "@amigurumi/schema";
import { useUserStateStore } from "../stores/userState";

const userState = useUserStateStore();
const families = ColorFamily.options;

function onInput(family: (typeof families)[number], value: string) {
  const yds = Number.parseFloat(value);
  userState.state.stash.onHandYdsByFamily[family] = Number.isFinite(yds) ? yds : 0;
}

function isQuickHave(family: (typeof families)[number]): boolean {
  return userState.state.stash.quickHaveFamilies.includes(family);
}
</script>

<template>
  <h1>Yarn Stash</h1>

  <h2>Quick check</h2>
  <p class="intro">
    Just want a fast "what can I make" answer? Click the colors you have -- no need to measure
    yardage. These count as fully on-hand for the "What Can I Make" page.
  </p>
  <div class="chips">
    <button
      v-for="family in families"
      :key="family"
      type="button"
      class="chip"
      :class="{ active: isQuickHave(family) }"
      :aria-pressed="isQuickHave(family)"
      @click="userState.toggleQuickHave(family)"
    >
      <span class="swatch" :data-family="family" aria-hidden="true"></span>
      {{ family }}
    </button>
  </div>

  <h2>Exact yardage</h2>
  <p class="intro">
    For a more precise shopping list, enter how many yards of each color family you have on hand.
  </p>
  <div class="card">
    <div class="grid">
      <div v-for="family in families" :key="family" class="row">
        <div class="family-cell">
          <span class="swatch" :data-family="family" aria-hidden="true"></span>
          {{ family }}
          <span v-if="isQuickHave(family)" class="badge" title="Also marked as a quick check -- treated as fully on-hand regardless of this amount.">
            quick check
          </span>
        </div>
        <div class="amount-cell">
          <input
            :id="`stash-${family}`"
            type="number"
            min="0"
            :value="userState.state.stash.onHandYdsByFamily[family] ?? 0"
            @input="onInput(family, ($event.target as HTMLInputElement).value)"
          />
          <label :for="`stash-${family}`" class="unit">yds</label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  h1 {
    margin-top: 0;
  }

  h2 {
    font-size: 1rem;
    margin: 1.5rem 0 0.25rem;
  }

  .intro {
    color: var(--color-text-muted);
    margin-top: 0;
    max-width: 36rem;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    font: inherit;
    font-weight: 600;
    color: var(--color-text);
    background: var(--color-surface);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-pill);
    cursor: pointer;
    transition:
      background-color var(--transition-fast),
      border-color var(--transition-fast),
      color var(--transition-fast);
  }

  .chip:hover {
    border-color: var(--color-accent);
  }

  .chip.active {
    background: var(--color-accent-soft);
    border-color: var(--color-accent);
    color: var(--color-accent-strong);
  }

  .badge {
    font-size: 0.6875rem;
    padding: 0.0625rem 0.5rem;
    border-radius: var(--radius-pill);
    background: var(--color-accent-soft);
    color: var(--color-accent-strong);
    font-weight: 600;
  }

  .card {
    padding: 1rem 1.25rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: 0.25rem 1.5rem;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.375rem 0.5rem;
    border-radius: var(--radius-sm);
  }

  .row:hover {
    background: var(--color-bg);
  }

  .family-cell {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.375rem;
    font-weight: 500;
    min-width: 0;
  }

  .amount-cell {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .swatch {
    display: inline-block;
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 50%;
    border: 1px solid var(--color-border-strong);
    background: var(--swatch-color, var(--color-neutral-soft));
  }

  .swatch[data-family="Black"] {
    --swatch-color: #2b2320;
  }
  .swatch[data-family="White"] {
    --swatch-color: #ffffff;
  }
  .swatch[data-family="Gray"] {
    --swatch-color: #9a9086;
  }
  .swatch[data-family="Brown"] {
    --swatch-color: #6b4a35;
  }
  .swatch[data-family="Tan"] {
    --swatch-color: #d2b48c;
  }
  .swatch[data-family="Cream"] {
    --swatch-color: #f5edd8;
  }
  .swatch[data-family="Red"] {
    --swatch-color: #c0392b;
  }
  .swatch[data-family="Pink"] {
    --swatch-color: #e28fb0;
  }
  .swatch[data-family="Orange"] {
    --swatch-color: #e08324;
  }
  .swatch[data-family="Yellow"] {
    --swatch-color: #e8c547;
  }
  .swatch[data-family="Green"] {
    --swatch-color: #5c8a4a;
  }
  .swatch[data-family="Blue"] {
    --swatch-color: #4a7bab;
  }
  .swatch[data-family="Purple"] {
    --swatch-color: #8a5fa8;
  }
  .swatch[data-family="Gold"] {
    --swatch-color: #c9a227;
  }
  .swatch[data-family="Silver"] {
    --swatch-color: #b8b8b8;
  }

  input {
    width: 5rem;
    padding: 0.3rem 0.5rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    font: inherit;
    transition: border-color var(--transition-fast);
    /* Without this, Chrome's native spin-button arrows only render on
       hover/focus, stealing space from the digits and shifting the "yds"
       label -- a visible jump every time you mouse over a row. */
    appearance: textfield;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input:hover {
    border-color: var(--color-accent);
  }

  .unit {
    margin-left: 0.375rem;
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }
</style>
