<script setup lang="ts">
import type { Pattern, SewingAmount, SkillLevel } from "@amigurumi/schema";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import patternsJson from "../data/patterns.json";
import { useUserStateStore } from "../stores/userState";

const patterns = patternsJson as Pattern[];
const userState = useUserStateStore();

const categories = [...new Set(patterns.map((p) => p.category))].sort();
const skillLevels = [...new Set(patterns.map((p) => p.skillLevel))].sort() as SkillLevel[];
const sewingAmounts = [...new Set(patterns.map((p) => p.sewingAmount))].sort() as SewingAmount[];

type SortOrder = "name" | "category";
const SORT_ORDERS: SortOrder[] = ["name", "category"];

// Filter/sort state lives in the URL query string, not just component
// state -- so a filtered view is bookmarkable/shareable, survives a reload,
// and (since navigating into a pattern uses router.push) the browser back
// button naturally restores it too. Read once on setup; every change after
// that writes back via router.replace (not push) so typing in the search
// box doesn't spam browser history with one entry per keystroke.
const route = useRoute();
const router = useRouter();

function queryString(key: string): string {
  const value = route.query[key];
  return typeof value === "string" ? value : "";
}

const search = ref(queryString("q"));
const category = ref(queryString("category"));
const skillLevel = ref(queryString("skill"));
const sewingAmount = ref(queryString("sewing"));
const haveItOnly = ref(queryString("haveIt") === "1");
const completedOnly = ref(queryString("completed") === "1");
const sort = ref<SortOrder>(SORT_ORDERS.includes(queryString("sort") as SortOrder) ? (queryString("sort") as SortOrder) : "name");

watch([search, category, skillLevel, sewingAmount, haveItOnly, completedOnly, sort], () => {
  const query: Record<string, string> = {};
  if (search.value) query.q = search.value;
  if (category.value) query.category = category.value;
  if (skillLevel.value) query.skill = skillLevel.value;
  if (sewingAmount.value) query.sewing = sewingAmount.value;
  if (haveItOnly.value) query.haveIt = "1";
  if (completedOnly.value) query.completed = "1";
  if (sort.value !== "name") query.sort = sort.value;
  router.replace({ query });
});

function isHaveIt(p: Pattern): boolean {
  return userState.patternState(p.id).haveIt || p.haveIt;
}

function isCompleted(p: Pattern): boolean {
  return userState.patternState(p.id).completed || p.completed;
}

const filtered = computed(() => {
  const result = patterns.filter((p) => {
    if (search.value && !p.name.toLowerCase().includes(search.value.toLowerCase())) return false;
    if (category.value && p.category !== category.value) return false;
    if (skillLevel.value && p.skillLevel !== skillLevel.value) return false;
    if (sewingAmount.value && p.sewingAmount !== sewingAmount.value) return false;
    if (haveItOnly.value && !isHaveIt(p)) return false;
    if (completedOnly.value && !isCompleted(p)) return false;
    return true;
  });
  const sorted = [...result];
  if (sort.value === "category") {
    sorted.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  } else {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
});
</script>

<template>
  <h1>Gallery ({{ filtered.length }} / {{ patterns.length }} patterns)</h1>

  <form class="filters" @submit.prevent>
    <div class="field">
      <label for="search">Search</label>
      <input id="search" v-model="search" type="search" placeholder="Pattern name..." />
    </div>
    <div class="field">
      <label for="category">Category</label>
      <select id="category" v-model="category">
        <option value="">All categories</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>
    <div class="field">
      <label for="skill">Skill level</label>
      <select id="skill" v-model="skillLevel">
        <option value="">All skill levels</option>
        <option v-for="s in skillLevels" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>
    <div class="field">
      <label for="sewing">Sewing amount</label>
      <select id="sewing" v-model="sewingAmount">
        <option value="">Any sewing amount</option>
        <option v-for="s in sewingAmounts" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>
    <div class="field checkbox">
      <input id="have-it-only" v-model="haveItOnly" type="checkbox" />
      <label for="have-it-only">Have it</label>
    </div>
    <div class="field checkbox">
      <input id="completed-only" v-model="completedOnly" type="checkbox" />
      <label for="completed-only">Made it</label>
    </div>
    <div class="field">
      <label for="sort">Sort by</label>
      <select id="sort" v-model="sort">
        <option value="name">Name (A–Z)</option>
        <option value="category">Category, then name</option>
      </select>
    </div>
  </form>

  <div class="grid">
    <RouterLink
      v-for="pattern in filtered"
      :key="pattern.id"
      :to="{ name: 'pattern-detail', params: { id: pattern.id } }"
      class="card"
    >
      <div class="thumb" aria-hidden="true">
        <img v-if="pattern.imageUrl" :src="pattern.imageUrl" :alt="pattern.name" />
        <span v-else class="thumb-placeholder">{{ pattern.name.charAt(0) }}</span>
      </div>
      <h3>{{ pattern.name }}</h3>
      <p class="meta">{{ pattern.category }}<span v-if="pattern.subcategory"> · {{ pattern.subcategory }}</span></p>
      <p v-if="pattern.collectionTags.length" class="tags">
        <span v-for="tag in pattern.collectionTags" :key="tag" class="tag">{{ tag }}</span>
      </p>
      <p class="badges">
        <span v-if="isHaveIt(pattern)" class="badge">Have it</span>
        <span v-if="isCompleted(pattern)" class="badge done">Made it</span>
      </p>
    </RouterLink>
    <p v-if="filtered.length === 0" class="empty">No patterns match the current filters.</p>
  </div>
</template>

<style scoped>
  h1 {
    margin-top: 0;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: end;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
  }

  .field.checkbox {
    flex-direction: row;
    align-items: center;
    gap: 0.375rem;
  }

  .field label {
    font-weight: 600;
  }

  .field input,
  .field select {
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    font: inherit;
    background: var(--color-surface);
    color: var(--color-text);
    transition: border-color var(--transition-fast);
  }

  .field input:hover,
  .field select:hover {
    border-color: var(--color-accent);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: 1rem;
  }

  .empty {
    color: var(--color-text-muted);
  }

  .card {
    display: block;
    padding: 1rem;
    border-radius: var(--radius-md);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    text-decoration: none;
    color: inherit;
    box-shadow: var(--shadow-sm);
    transition:
      transform var(--transition-fast),
      box-shadow var(--transition-fast),
      border-color var(--transition-fast);
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-accent);
  }

  .thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 6rem;
    margin-bottom: 0.5rem;
    background: var(--color-neutral-soft);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumb-placeholder {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-accent);
  }

  .card h3 {
    margin: 0 0 0.25rem;
  }

  .meta {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }

  .tags {
    margin: 0.375rem 0 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .tag {
    font-size: 0.6875rem;
    padding: 0.0625rem 0.375rem;
    border-radius: var(--radius-pill);
    background: var(--color-tag-bg);
    color: var(--color-text-muted);
  }

  .badges {
    margin: 0.5rem 0 0;
    display: flex;
    gap: 0.375rem;
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    border-radius: var(--radius-pill);
    background: var(--color-neutral-soft);
  }

  .badge.done {
    background: var(--color-success-bg);
  }
</style>
