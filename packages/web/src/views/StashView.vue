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
  <p>How many yards of each color family do you have on hand?</p>
  <table>
    <tr v-for="family in families" :key="family">
      <td>{{ family }}</td>
      <td>
        <input
          type="number"
          min="0"
          :value="userState.state.stash.onHandYdsByFamily[family] ?? 0"
          @input="onInput(family, ($event.target as HTMLInputElement).value)"
        />
        yds
      </td>
    </tr>
  </table>
</template>

<style scoped>
  table {
    border-collapse: collapse;
  }

  td {
    padding: 0.25rem 0.75rem 0.25rem 0;
  }
</style>
