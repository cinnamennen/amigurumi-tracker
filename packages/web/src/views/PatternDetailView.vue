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
    </div>

    <h2>Materials</h2>
    <ul class="materials">
      <li v-for="(m, i) in pattern.materials" :key="i">
        <span class="color-swatch" :data-family="m.colorFamily" aria-hidden="true"></span>
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
    height: 8rem;
    width: 8rem;
    margin: 0.5rem 0;
    background: #f0e6e0;
    border-radius: 0.75rem;
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
    color: #c2618d;
  }

  .meta {
    margin: 0;
    color: #7a6d64;
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
    border-radius: 999px;
    background: #f4efe9;
    color: #7a6d64;
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
    border-radius: 0.375rem;
  }

  .toggles label:hover {
    background: #f4efe9;
  }

  .toggles input {
    width: 1.125rem;
    height: 1.125rem;
    accent-color: #c2618d;
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

  .color-swatch {
    display: inline-block;
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 50%;
    border: 1px solid #d8ccc3;
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.0625rem 0.5rem;
    border-radius: 999px;
    background: #f0e6e0;
  }

  .badge.qualifier {
    background: #f6e3ee;
    color: #a34878;
  }

  .badge.placeholder {
    background: #eef1e6;
    color: #5c7048;
  }

  .empty {
    color: #7a6d64;
  }

  .notes {
    width: 100%;
    max-width: 30rem;
    display: block;
    padding: 0.5rem;
    border: 1px solid #d8ccc3;
    border-radius: 0.5rem;
    font: inherit;
  }

  .purchase-placeholder {
    color: #7a6d64;
    font-style: italic;
  }
</style>
