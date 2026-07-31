import { createRouter, createWebHashHistory } from "vue-router";

// Hash history — GitHub Pages serves this as a static SPA with no
// server-side rewrite rule, so path-based history would 404 on refresh.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "gallery", component: () => import("../views/GalleryView.vue") },
    {
      path: "/patterns/:id",
      name: "pattern-detail",
      component: () => import("../views/PatternDetailView.vue"),
      props: true,
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
