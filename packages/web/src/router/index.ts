import { createRouter, createWebHashHistory } from "vue-router";

// Hash history — GitHub Pages serves this as a static SPA with no
// server-side rewrite rule, so path-based history would 404 on refresh.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "gallery", component: () => import("../views/GalleryView.vue") },
    // Pattern detail is a modal (see App.vue + PatternDetailModal.vue) driven
    // by a `?pattern=<id>` query param on whatever page is underneath, not a
    // route of its own -- this old path is kept as a redirect so existing
    // bookmarks/shared links still land on the right pattern.
    {
      path: "/patterns/:id",
      redirect: (to) => ({ path: "/", query: { pattern: to.params.id as string } }),
    },
    { path: "/stash", name: "stash", component: () => import("../views/StashView.vue") },
    {
      path: "/what-can-i-make",
      name: "what-can-i-make",
      component: () => import("../views/WhatCanIMakeView.vue"),
    },
    {
      path: "/shopping-list",
      name: "shopping-list",
      component: () => import("../views/ShoppingListView.vue"),
    },
  ],
});
