import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', component: () => import('@/views/HomeView.vue') },
  { path: '/my-sessions', component: () => import('@/views/MySessionsView.vue') },
  { path: '/my-signups', component: () => import('@/views/MySignupsView.vue') },
  { path: '/admin', component: () => import('@/views/AdminView.vue') },
  { path: '/share/:id', component: () => import('@/views/ShareView.vue') },
  { path: '/og/:id', component: () => import('@/views/ShareView.vue') },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
