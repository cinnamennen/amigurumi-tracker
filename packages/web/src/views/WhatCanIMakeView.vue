<script setup lang="ts">
import type { Pattern } from "@amigurumi/schema";
import { computed } from "vue";

import patternsJson from "../data/patterns.json";
import { useUserStateStore } from "../stores/userState";

const patterns = patternsJson as Pattern[];
const userState = useUserStateStore();

// Simple per-material check against on-hand yardage — doesn't account for
// yarn shared across multiple patterns you might make in the same sitting.
function canMake(pattern: Pattern): boolean {
  return pattern.materials.every((m) => {
    if (m.isPlaceholder || m.amountYds === null) return true;
    const onHand = userState.state.stash.onHandYdsByFamily[m.colorFamily] ?? 0;
    return onHand >= m.amountYds;
  });
}

const makeable = computed(() => patterns.filter((p) => !p.completed && canMake(p)));
</script>

<template>
  <h1>What Can I Make ({{ makeable.length }})</h1>
  <p>Patterns not yet completed whose materials fit your current stash.</p>
  <ul>
    <li v-for="pattern in makeable" :key="pattern.id">
      <RouterLink :to="{ name: 'pattern-detail', params: { id: pattern.id } }">{{ pattern.name }}</RouterLink>
    </li>
  </ul>
</template>
