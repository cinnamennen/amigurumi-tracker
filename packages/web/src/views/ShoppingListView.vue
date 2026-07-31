<script setup lang="ts">
import type { ColorFamily, Pattern } from "@amigurumi/schema";
import { computed } from "vue";

import patternsJson from "../data/patterns.json";
import { useUserStateStore } from "../stores/userState";
import { neededByFamily } from "../utils/materialNeeds";

const patterns = patternsJson as Pattern[];
const userState = useUserStateStore();

function isHaveIt(p: Pattern): boolean {
  return userState.patternState(p.id).haveIt || p.haveIt;
}

function isCompleted(p: Pattern): boolean {
  return userState.patternState(p.id).completed || p.completed;
}

// Patterns the user actually plans to make: have the pattern, haven't made
// it yet. (Not "everything not completed" -- that's all 654 patterns and
// not a meaningful shopping list.)
const inProgress = computed(() => patterns.filter((p) => isHaveIt(p) && !isCompleted(p)));

interface ShoppingRow {
  family: ColorFamily;
  needed: number;
  onHand: number;
  deficit: number;
}

const shoppingList = computed<ShoppingRow[]>(() => {
  const totalNeeded: Partial<Record<ColorFamily, number>> = {};
  for (const pattern of inProgress.value) {
    for (const [family, yds] of Object.entries(neededByFamily(pattern.materials))) {
      const key = family as ColorFamily;
      totalNeeded[key] = (totalNeeded[key] ?? 0) + yds;
    }
  }

  const rows: ShoppingRow[] = [];
  for (const [family, needed] of Object.entries(totalNeeded) as [ColorFamily, number][]) {
    const onHand = userState.state.stash.onHandYdsByFamily[family] ?? 0;
    const deficit = needed - onHand;
    if (deficit > 0) rows.push({ family, needed, onHand, deficit });
  }
  return rows.sort((a, b) => b.deficit - a.deficit);
});

const totalYardsToBuy = computed(() => shoppingList.value.reduce((sum, row) => sum + row.deficit, 0));
</script>

<template>
  <h1>Shopping List</h1>
  <p class="intro">
    Yardage still needed, after your stash, across the {{ inProgress.length }} pattern{{
      inProgress.length === 1 ? "" : "s"
    }}
    you have and haven't made yet.
  </p>

  <table v-if="shoppingList.length > 0" class="list">
    <thead>
      <tr>
        <th scope="col">Color</th>
        <th scope="col">Needed</th>
        <th scope="col">On hand</th>
        <th scope="col">Buy at least</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in shoppingList" :key="row.family">
        <td class="family-cell">
          <span class="swatch" :data-family="row.family" aria-hidden="true"></span>
          {{ row.family }}
        </td>
        <td>{{ row.needed }}yds</td>
        <td>{{ row.onHand }}yds</td>
        <td class="deficit">{{ row.deficit }}yds</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3">Total</td>
        <td class="deficit">{{ totalYardsToBuy }}yds</td>
      </tr>
    </tfoot>
  </table>
  <p v-else class="empty">
    Nothing to buy right now -- either mark some patterns "have it", or your stash already covers
    everything you have and haven't made yet.
  </p>
</template>

<style scoped>
  h1 {
    margin-top: 0;
  }

  .intro {
    color: var(--color-text-muted);
    max-width: 36rem;
  }

  .list {
    border-collapse: collapse;
  }

  .list th,
  .list td {
    padding: 0.5rem 1rem 0.5rem 0;
    text-align: left;
  }

  .list thead th {
    border-bottom: 2px solid var(--color-border);
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .list tbody tr {
    border-bottom: 1px solid var(--color-border);
  }

  .list tfoot td {
    padding-top: 0.75rem;
    font-weight: 700;
  }

  .family-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
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

  .deficit {
    font-weight: 700;
    color: var(--color-accent-strong);
  }

  .empty {
    color: var(--color-text-muted);
    max-width: 32rem;
  }
</style>
