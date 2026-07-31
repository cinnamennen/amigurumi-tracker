<script setup lang="ts">
import type { ColorFamily, MaterialRow, Pattern } from "@amigurumi/schema";
import { computed } from "vue";

import patternsJson from "../data/patterns.json";
import { useUserStateStore } from "../stores/userState";

const patterns = patternsJson as Pattern[];
const userState = useUserStateStore();

function isHaveIt(p: Pattern): boolean {
  return userState.patternState(p.id).haveIt || p.haveIt;
}

function isCompleted(p: Pattern): boolean {
  return userState.patternState(p.id).completed || p.completed;
}

// Family-level yardage totals needed per pattern (summing multiple materials
// in the same family), ignoring placeholder "your choice" materials.
function neededByFamily(materials: MaterialRow[]): Partial<Record<ColorFamily, number>> {
  const totals: Partial<Record<ColorFamily, number>> = {};
  for (const m of materials) {
    if (m.isPlaceholder || m.amountYds === null) continue;
    totals[m.colorFamily] = (totals[m.colorFamily] ?? 0) + m.amountYds;
  }
  return totals;
}

function stashCovers(materials: MaterialRow[]): boolean {
  const needed = neededByFamily(materials);
  return Object.entries(needed).every(
    ([family, yds]) => (userState.state.stash.onHandYdsByFamily[family as ColorFamily] ?? 0) >= yds,
  );
}

// Qualifier-bearing materials ("Dark Brown") can't be confirmed against a
// family-level stash total alone — flag them for a manual shade check
// instead of silently treating the family match as good enough.
function needsShadeVerification(materials: MaterialRow[]): boolean {
  return materials.some((m) => !m.isPlaceholder && m.qualifier);
}

interface Makeable {
  pattern: Pattern;
  verifyShade: boolean;
}

const makeable = computed<Makeable[]>(() =>
  patterns
    .filter((p) => isHaveIt(p) && !isCompleted(p) && stashCovers(p.materials))
    .map((p) => ({ pattern: p, verifyShade: needsShadeVerification(p.materials) })),
);
</script>

<template>
  <h1>What Can I Make ({{ makeable.length }})</h1>
  <p>Patterns you have and haven't made yet, whose materials fit your current stash.</p>
  <ul class="list">
    <li v-for="{ pattern, verifyShade } in makeable" :key="pattern.id">
      <RouterLink :to="{ name: 'pattern-detail', params: { id: pattern.id } }">{{ pattern.name }}</RouterLink>
      <span v-if="verifyShade" class="badge verify" title="One or more materials specify a shade (e.g. 'Dark Brown') — check it matches your stash.">
        verify shade
      </span>
    </li>
    <li v-if="makeable.length === 0" class="empty">
      Nothing yet — mark patterns as "have it" and enter your stash yardage.
    </li>
  </ul>
</template>

<style scoped>
  h1 {
    margin-top: 0;
  }

  .list {
    list-style: none;
    padding: 0;
  }

  .list li {
    padding: 0.5rem 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: var(--radius-sm);
    transition: background-color var(--transition-fast);
  }

  .list li:hover {
    background: var(--color-surface);
  }

  .list a {
    text-decoration: none;
    font-weight: 600;
    color: var(--color-text);
  }

  .list a:hover {
    color: var(--color-accent);
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.0625rem 0.5rem;
    border-radius: var(--radius-pill);
  }

  .badge.verify {
    background: var(--color-accent-soft);
    color: var(--color-accent-strong);
  }

  .empty {
    color: var(--color-text-muted);
  }
</style>
