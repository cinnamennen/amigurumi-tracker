<script setup lang="ts">
import { ColorFamily, type Pattern, type SewingAmount, type SkillLevel } from "@amigurumi/schema";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import patternsJson from "../data/patterns.json";
import { useUserStateStore } from "../stores/userState";

const patterns = patternsJson as Pattern[];
const userState = useUserStateStore();

const categories = [...new Set(patterns.map((p) => p.category))].sort();
const skillLevels = [...new Set(patterns.map((p) => p.skillLevel))].sort() as SkillLevel[];
const sewingAmounts = [...new Set(patterns.map((p) => p.sewingAmount))].sort() as SewingAmount[];
const colorFamilies = ColorFamily.options;

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
const wantToMakeOnly = ref(queryString("wantToMake") === "1");
const sort = ref<SortOrder>(SORT_ORDERS.includes(queryString("sort") as SortOrder) ? (queryString("sort") as SortOrder) : "name");
const initialTags = queryString("tags");
const activeTags = ref<string[]>(initialTags ? initialTags.split(",") : []);
const initialColors = queryString("colors");
const activeColors = ref<string[]>(initialColors ? initialColors.split(",") : []);

watch(
  [search, category, skillLevel, sewingAmount, haveItOnly, completedOnly, wantToMakeOnly, sort, activeTags, activeColors],
  () => {
    const query: Record<string, string> = {};
    if (search.value) query.q = search.value;
    if (category.value) query.category = category.value;
    if (skillLevel.value) query.skill = skillLevel.value;
    if (sewingAmount.value) query.sewing = sewingAmount.value;
    if (haveItOnly.value) query.haveIt = "1";
    if (completedOnly.value) query.completed = "1";
    if (wantToMakeOnly.value) query.wantToMake = "1";
    if (activeTags.value.length > 0) query.tags = activeTags.value.join(",");
    if (activeColors.value.length > 0) query.colors = activeColors.value.join(",");
    if (sort.value !== "name") query.sort = sort.value;
    router.replace({ query });
  },
  { deep: true },
);

function addTagFilter(tag: string) {
  if (!activeTags.value.includes(tag)) activeTags.value.push(tag);
}

function removeTagFilter(tag: string) {
  activeTags.value = activeTags.value.filter((t) => t !== tag);
}

function toggleColorFilter(family: string) {
  if (activeColors.value.includes(family)) {
    activeColors.value = activeColors.value.filter((c) => c !== family);
  } else {
    activeColors.value.push(family);
  }
}

function usesColor(p: Pattern, family: string): boolean {
  return p.materials.some((m) => m.colorFamily === family);
}

function matchingColorCount(p: Pattern): number {
  return activeColors.value.filter((family) => usesColor(p, family)).length;
}

function isHaveIt(p: Pattern): boolean {
  return userState.patternState(p.id).haveIt || p.haveIt;
}

function isCompleted(p: Pattern): boolean {
  return userState.patternState(p.id).completed || p.completed;
}

function isWantToMake(p: Pattern): boolean {
  return userState.patternState(p.id).wantToMake;
}

function percent(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

const stats = computed(() => {
  const total = patterns.length;
  const haveIt = patterns.filter(isHaveIt).length;
  const completed = patterns.filter(isCompleted).length;
  return {
    total,
    haveIt,
    haveItPercent: percent(haveIt, total),
    completed,
    completedPercent: percent(completed, total),
  };
});

const filtered = computed(() => {
  const result = patterns.filter((p) => {
    if (search.value && !p.name.toLowerCase().includes(search.value.toLowerCase())) return false;
    if (category.value && p.category !== category.value) return false;
    if (skillLevel.value && p.skillLevel !== skillLevel.value) return false;
    if (sewingAmount.value && p.sewingAmount !== sewingAmount.value) return false;
    if (haveItOnly.value && !isHaveIt(p)) return false;
    if (completedOnly.value && !isCompleted(p)) return false;
    if (wantToMakeOnly.value && !isWantToMake(p)) return false;
    if (activeTags.value.length > 0 && !activeTags.value.every((tag) => p.collectionTags.includes(tag))) return false;
    if (activeColors.value.length > 0 && !activeColors.value.some((family) => usesColor(p, family))) return false;
    return true;
  });
  const sorted = [...result];
  if (sort.value === "category") {
    sorted.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  } else {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  // Patterns matching more of the selected colors rank first -- an active
  // color filter is a relevance signal, not just a yes/no gate, so someone
  // picking Red+Blue+Green should see the pattern using all three above one
  // that only happens to use Red.
  if (activeColors.value.length > 0) {
    sorted.sort((a, b) => matchingColorCount(b) - matchingColorCount(a));
  }
  return sorted;
});
</script>

<template>
  <h1>Gallery ({{ filtered.length }} / {{ patterns.length }} patterns)</h1>

  <dl class="stats" aria-label="Collection progress">
    <div class="stat">
      <dt>Total patterns</dt>
      <dd>{{ stats.total }}</dd>
    </div>
    <div class="stat">
      <dt>Have it</dt>
      <dd>{{ stats.haveIt }} <span class="stat-percent">({{ stats.haveItPercent }}%)</span></dd>
    </div>
    <div class="stat">
      <dt>Made</dt>
      <dd>{{ stats.completed }} <span class="stat-percent">({{ stats.completedPercent }}%)</span></dd>
    </div>
  </dl>

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
    <label class="field checkbox">
      <input id="have-it-only" v-model="haveItOnly" type="checkbox" />
      Have it
    </label>
    <label class="field checkbox">
      <input id="completed-only" v-model="completedOnly" type="checkbox" />
      Made it
    </label>
    <label class="field checkbox">
      <input id="want-to-make-only" v-model="wantToMakeOnly" type="checkbox" />
      Want to make
    </label>
    <div class="field">
      <label for="sort">Sort by</label>
      <select id="sort" v-model="sort">
        <option value="name">Name (A–Z)</option>
        <option value="category">Category, then name</option>
      </select>
    </div>
    <div class="field colors-field">
      <span class="colors-label">Colors used (any match; more matches rank higher)</span>
      <div class="color-chips">
        <button
          v-for="family in colorFamilies"
          :key="family"
          type="button"
          class="chip"
          :class="{ active: activeColors.includes(family) }"
          :aria-pressed="activeColors.includes(family)"
          @click="toggleColorFilter(family)"
        >
          <span class="swatch" :data-family="family" aria-hidden="true"></span>
          {{ family }}
        </button>
      </div>
    </div>
  </form>

  <div v-if="activeTags.length > 0" class="active-tags">
    <span class="active-tags-label">Tags:</span>
    <button
      v-for="tag in activeTags"
      :key="tag"
      type="button"
      class="active-tag"
      :aria-label="`Remove tag filter ${tag}`"
      @click="removeTagFilter(tag)"
    >
      {{ tag }} <span aria-hidden="true">&times;</span>
    </button>
  </div>

  <div class="grid">
    <RouterLink
      v-for="pattern in filtered"
      :key="pattern.id"
      :to="{ path: route.path, query: { ...route.query, pattern: pattern.id } }"
      class="card"
    >
      <div class="thumb" aria-hidden="true">
        <img v-if="pattern.imageUrl" :src="pattern.imageUrl" :alt="pattern.name" />
        <span v-else class="thumb-placeholder">{{ pattern.name.charAt(0) }}</span>
      </div>
      <h3>{{ pattern.name }}</h3>
      <p class="meta">{{ pattern.category }}<span v-if="pattern.subcategory"> · {{ pattern.subcategory }}</span></p>
      <p v-if="pattern.collectionTags.length" class="tags">
        <button
          v-for="tag in pattern.collectionTags"
          :key="tag"
          type="button"
          class="tag"
          :class="{ active: activeTags.includes(tag) }"
          :aria-label="`Filter by tag ${tag}`"
          @click.stop.prevent="addTagFilter(tag)"
        >
          {{ tag }}
        </button>
      </p>
      <p class="badges">
        <span v-if="isHaveIt(pattern)" class="badge">Have it</span>
        <span v-if="isCompleted(pattern)" class="badge done">Made it</span>
        <span v-if="isWantToMake(pattern)" class="badge want">Want to make</span>
      </p>
    </RouterLink>
    <p v-if="filtered.length === 0" class="empty">No patterns match the current filters.</p>
  </div>
</template>

<style scoped>
  h1 {
    margin-top: 0;
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin: 0 0 1.5rem;
  }

  .stat {
    padding: 0.75rem 1.25rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    min-width: 8rem;
  }

  .stat dt {
    margin: 0 0 0.25rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--color-text-muted);
  }

  .stat dd {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .stat-percent {
    font-size: 0.875rem;
    font-weight: 400;
    color: var(--color-text-muted);
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
    gap: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    /* Padding makes the whole row (not just the tiny native checkbox) a
       comfortably tappable target on mobile. */
    padding: 0.4rem 0.5rem;
    margin: -0.4rem -0.5rem;
    border-radius: var(--radius-sm);
  }

  .field.checkbox:hover {
    background: var(--color-tag-bg);
  }

  .field.checkbox input {
    width: 1.125rem;
    height: 1.125rem;
    accent-color: var(--color-accent);
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

  .colors-field {
    flex-basis: 100%;
  }

  .colors-label {
    font-weight: 600;
  }

  .color-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.625rem;
    font: inherit;
    font-size: 0.8125rem;
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
    /* Real product photos from the source catalog are square (1:1) --
       matching that ratio here (instead of a fixed short height) means the
       whole photo shows instead of cover-cropping off its left/right edges
       to fit a wide letterbox box. */
    aspect-ratio: 1 / 1;
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
    font-size: 3rem;
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
    font: inherit;
    font-size: 0.6875rem;
    padding: 0.0625rem 0.375rem;
    border: none;
    border-radius: var(--radius-pill);
    background: var(--color-tag-bg);
    color: var(--color-text-muted);
    cursor: pointer;
    transition:
      background-color var(--transition-fast),
      color var(--transition-fast);
  }

  .tag:hover {
    background: var(--color-accent-soft);
    color: var(--color-accent-strong);
  }

  .tag.active {
    background: var(--color-accent);
    color: white;
  }

  .active-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin: -0.5rem 0 1.5rem;
  }

  .active-tags-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .active-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.25rem 0.625rem;
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-pill);
    background: var(--color-accent-soft);
    color: var(--color-accent-strong);
    cursor: pointer;
  }

  .active-tag:hover {
    background: var(--color-accent);
    color: white;
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

  .badge.want {
    background: var(--color-accent-soft);
    color: var(--color-accent-strong);
  }
</style>
