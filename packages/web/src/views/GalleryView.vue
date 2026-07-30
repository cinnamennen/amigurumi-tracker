<script setup lang="ts">
import type { Pattern } from "@amigurumi/schema";
import { computed, ref } from "vue";

import patternsJson from "../data/patterns.json";
import { useUserStateStore } from "../stores/userState";

const patterns = patternsJson as Pattern[];
const userState = useUserStateStore();

const search = ref("");
const filtered = computed(() =>
  patterns.filter((p) => p.name.toLowerCase().includes(search.value.toLowerCase())),
);
</script>

<template>
  <h1>Gallery ({{ patterns.length }} patterns)</h1>
  <input v-model="search" type="search" placeholder="Search patterns..." class="search" />
  <div class="grid">
    <RouterLink
      v-for="pattern in filtered"
      :key="pattern.id"
      :to="{ name: 'pattern-detail', params: { id: pattern.id } }"
      class="card"
    >
      <h3>{{ pattern.name }}</h3>
      <p class="meta">{{ pattern.category }}<span v-if="pattern.subcategory"> · {{ pattern.subcategory }}</span></p>
      <p class="badges">
        <span v-if="userState.patternState(pattern.id).haveIt || pattern.haveIt" class="badge">Have it</span>
        <span v-if="userState.patternState(pattern.id).completed || pattern.completed" class="badge done"
          >Made it</span
        >
      </p>
    </RouterLink>
  </div>
</template>

<style scoped>
  .search {
    width: 100%;
    max-width: 24rem;
    padding: 0.5rem 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid #eadfd8;
    border-radius: 0.5rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: 1rem;
  }

  .card {
    display: block;
    padding: 1rem;
    border-radius: 0.75rem;
    background: #fff;
    border: 1px solid #eadfd8;
    text-decoration: none;
    color: inherit;
  }

  .card h3 {
    margin: 0 0 0.25rem;
  }

  .meta {
    margin: 0;
    color: #7a6d64;
    font-size: 0.875rem;
  }

  .badges {
    margin: 0.5rem 0 0;
    display: flex;
    gap: 0.375rem;
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    background: #f0e6e0;
  }

  .badge.done {
    background: #dcefe0;
  }
</style>
