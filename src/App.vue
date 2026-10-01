<template>
  <RouterView />
  <div id="toastEl" ref="toastEl"></div>
</template>

<script setup>
import { ref, provide } from 'vue';

const toastEl = ref(null);

function showToast(msg, duration = 2500) {
  const el = toastEl.value;
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

provide('showToast', showToast);
</script>
