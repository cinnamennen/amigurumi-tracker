<script setup lang="ts"></script>

<template>
  <header class="nav">
    <RouterLink to="/" class="brand">🧶 Amigurumi Tracker</RouterLink>
    <div class="links">
      <RouterLink to="/">Gallery</RouterLink>
      <RouterLink to="/stash">Stash</RouterLink>
      <RouterLink to="/what-can-i-make">What Can I Make</RouterLink>
    </div>
  </header>
  <main>
    <RouterView />
  </main>
</template>

<style>
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: var(--font-sans);
    background: var(--color-bg);
    color: var(--color-text);
    line-height: 1.5;
  }

  h1,
  h2,
  h3 {
    line-height: 1.25;
  }

  a {
    color: inherit;
  }

  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .brand {
    font-weight: 700;
    font-size: 1.125rem;
    text-decoration: none;
    color: var(--color-text);
  }

  .links {
    display: flex;
    gap: 1.5rem;
  }

  .links a {
    text-decoration: none;
    font-weight: 600;
    color: var(--color-text-muted);
    padding-bottom: 0.125rem;
    border-bottom: 2px solid transparent;
    transition:
      color var(--transition-fast),
      border-color var(--transition-fast);
  }

  .links a:hover {
    color: var(--color-text);
  }

  .links a.router-link-active {
    color: var(--color-accent);
    border-bottom-color: var(--color-accent);
  }

  main {
    padding: 1.5rem;
    max-width: 72rem;
    margin: 0 auto;
  }
</style>
