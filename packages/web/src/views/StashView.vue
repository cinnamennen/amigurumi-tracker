<script setup lang="ts">
import { ColorFamily } from "@amigurumi/schema";
import { useUserStateStore } from "../stores/userState";

const userState = useUserStateStore();
const families = ColorFamily.options;

function onInput(family: (typeof families)[number], value: string) {
  const yds = Number.parseFloat(value);
  userState.state.stash.onHandYdsByFamily[family] = Number.isFinite(yds) ? yds : 0;
}
</script>

<template>
  <h1>Yarn Stash</h1>
  <p class="intro">How many yards of each color family do you have on hand?</p>
  <div class="card">
    <table>
      <tr v-for="family in families" :key="family">
        <td class="family-cell">
          <span class="swatch" :data-family="family" aria-hidden="true"></span>
          {{ family }}
        </td>
        <td>
          <input
            :id="`stash-${family}`"
            type="number"
            min="0"
            :value="userState.state.stash.onHandYdsByFamily[family] ?? 0"
            @input="onInput(family, ($event.target as HTMLInputElement).value)"
          />
          <label :for="`stash-${family}`" class="unit">yds</label>
        </td>
      </tr>
    </table>
  </div>
</template>

<style scoped>
  h1 {
    margin-top: 0;
  }

  .intro {
    color: var(--color-text-muted);
    margin-top: 0;
  }

  .card {
    display: inline-block;
    padding: 1rem 1.25rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  table {
    border-collapse: collapse;
  }

  tr:hover td {
    background: var(--color-bg);
  }

  td {
    padding: 0.375rem 0.75rem 0.375rem 0;
  }

  .family-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
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
