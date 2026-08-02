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
    <div class="thumb" aria-hidden="true">
      <img v-if="pattern.imageUrl" :src="pattern.imageUrl" :alt="pattern.name" />
      <span v-else class="thumb-placeholder">{{ pattern.name.charAt(0) }}</span>
    </div>

    <h1>{{ pattern.name }}</h1>
    <p class="meta">{{ pattern.category }}<span v-if="pattern.subcategory"> · {{ pattern.subcategory }}</span></p>
    <p v-if="pattern.collectionTags.length" class="tags">
      <span v-for="tag in pattern.collectionTags" :key="tag" class="tag">{{ tag }}</span>
    </p>

    <div class="toggles">
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
      <label>
        <input
          type="checkbox"
          :checked="userState.patternState(pattern.id).wantToMake"
          @change="userState.setWantToMake(pattern.id, ($event.target as HTMLInputElement).checked)"
        />
        Want to make
      </label>
    </div>

    <h2>Materials</h2>
    <ul class="materials">
      <li v-for="(m, i) in pattern.materials" :key="i">
        <span class="swatch" :data-family="m.colorFamily" aria-hidden="true"></span>
        {{ m.colorRaw }}
        <span class="badge family">{{ m.colorFamily }}</span>
        <span v-if="m.qualifier" class="badge qualifier">{{ m.qualifier }}</span>
        <span v-if="m.isPlaceholder" class="badge placeholder">your choice</span>
        &mdash; {{ m.amountYds ?? "?" }}yds, {{ m.weight }}
      </li>
      <li v-if="pattern.materials.length === 0" class="empty">No material data extracted for this pattern.</li>
    </ul>

    <h2>Notes</h2>
    <textarea
      class="notes"
      rows="4"
      placeholder="Notes about this pattern..."
      :value="userState.patternState(pattern.id).notes"
      @input="userState.setNotes(pattern.id, ($event.target as HTMLTextAreaElement).value)"
    ></textarea>

    <h2>Purchase</h2>
    <p class="purchase-link">
      <a v-if="pattern.purchaseUrl" :href="pattern.purchaseUrl" target="_blank" rel="noopener">Buy this pattern</a>
      <span v-else class="purchase-placeholder">Purchase link not yet available.</span>
    </p>
  </template>
  <p v-else>Pattern not found.</p>
</template>

<style scoped>
  .thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    /* Real product photos are square -- size the thumb off that ratio
       instead of a small fixed 8rem box so the actual photo (not just a
       recognizable letter placeholder) is legible on the detail page. */
    width: 100%;
    max-width: 16rem;
    aspect-ratio: 1 / 1;
    margin: 0.5rem 0;
    background: var(--color-neutral-soft);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumb-placeholder {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-accent);
  }

  .meta {
    margin: 0;
    color: var(--color-text-muted);
  }

  .tags {
    margin: 0.5rem 0;
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

  .toggles {
    display: flex;
    gap: 1rem;
    margin: 1rem 0;
  }

  .toggles label {
    display: flex;
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

  .toggles label:hover {
    background: var(--color-tag-bg);
  }

  .toggles input {
    width: 1.125rem;
    height: 1.125rem;
    accent-color: var(--color-accent);
  }

  .materials {
    list-style: none;
    padding: 0;
  }

  .materials li {
    padding: 0.375rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.0625rem 0.5rem;
    border-radius: var(--radius-pill);
    background: var(--color-neutral-soft);
  }

  .badge.qualifier {
    background: var(--color-accent-soft);
    color: var(--color-accent-strong);
  }

  .badge.placeholder {
    background: var(--color-success-soft);
    color: var(--color-success);
  }

  .empty {
    color: var(--color-text-muted);
  }

  .notes {
    width: 100%;
    max-width: 30rem;
    display: block;
    padding: 0.5rem;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    font: inherit;
    transition: border-color var(--transition-fast);
  }

  .notes:hover {
    border-color: var(--color-accent);
  }

  .purchase-placeholder {
    color: var(--color-text-muted);
    font-style: italic;
  }
</style>
