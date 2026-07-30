<script setup lang="ts"></script>

<template>
  <nav class="nav">
    <RouterLink to="/">Gallery</RouterLink>
    <RouterLink to="/stash">Stash</RouterLink>
    <RouterLink to="/what-can-i-make">What Can I Make</RouterLink>
  </nav>
  <main>
    <RouterView />
  </main>
</template>

<style>
  body {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: #faf7f5;
    color: #2b2320;
  }

  .nav {
    display: flex;
    gap: 1.5rem;
    padding: 1rem 1.5rem;
    background: #fff;
    border-bottom: 1px solid #eadfd8;
  }

  .nav a {
    color: #2b2320;
    text-decoration: none;
    font-weight: 600;
  }

  .nav a.router-link-active {
    color: #c2618d;
  }

  main {
    padding: 1.5rem;
  }
</style>
