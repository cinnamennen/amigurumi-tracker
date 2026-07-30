<script setup lang="ts">
import type { Pattern } from "@amigurumi/schema";
import { computed } from "vue";

import patternsJson from "../data/patterns.json";
import { useUserStateStore } from "../stores/userState";

const props = defineProps<{ id: string }>();
const patterns = patternsJson as Pattern[];
const pattern = computed(() => patterns.find((p) => p.id === props.id));
const userState = useUserStateStore();
</script>

<template>
  <RouterLink to="/">&larr; Back to gallery</RouterLink>
  <template v-if="pattern">
    <h1>{{ pattern.name }}</h1>
    <p>{{ pattern.category }}<span v-if="pattern.subcategory"> · {{ pattern.subcategory }}</span></p>
    <label>
      <input
        type="checkbox"
        :checked="userState.patternState(pattern.id).haveIt"
        @change="userState.setHaveIt(pattern.id, ($event.target as HTMLInputElement).checked)"
      />
      Have it
    </label>
    <label>
      <input
        type="checkbox"
        :checked="userState.patternState(pattern.id).completed"
        @change="userState.setCompleted(pattern.id, ($event.target as HTMLInputElement).checked)"
      />
      Made it
    </label>
    <h2>Materials</h2>
    <ul>
      <li v-for="(m, i) in pattern.materials" :key="i">
        {{ m.colorRaw }} ({{ m.colorFamily }}<span v-if="m.qualifier">, {{ m.qualifier }}</span
        >) &mdash; {{ m.amountYds ?? "?" }}yds, {{ m.weight }}
      </li>
    </ul>
  </template>
  <p v-else>Pattern not found.</p>
</template>
