<template>
  <div class="fixed bottom-6 right-4 flex flex-col items-end gap-2 z-30">
    <!-- My Signups: directly visible when logged in -->
    <button v-if="user" @click="$router.push('/my-signups')"
      class="bg-white border border-green-200 text-green-700 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md hover:bg-green-50 active:scale-95 transition">
      ✅ {{ isZh ? '我的報名' : 'My Signups' }}
    </button>

    <!-- Speed dial menu -->
    <div v-show="menuOpen && user" class="flex flex-col items-end gap-2 mb-1">
      <button @click="$emit('create'); menuOpen = false"
        class="bg-indigo-600 text-white rounded-xl px-5 py-3 text-sm font-semibold shadow-lg hover:bg-indigo-700 active:scale-95 transition">
        {{ isZh ? '+ 建立場次' : '+ Create Session' }}
      </button>
      <button @click="$router.push('/my-sessions'); menuOpen = false"
        class="bg-white border border-indigo-200 text-indigo-600 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md hover:bg-indigo-50 active:scale-95 transition">
        📋 {{ isZh ? '我的開場' : 'My Sessions' }}
      </button>
    </div>

    <!-- Toggle button -->
    <button v-if="user" @click="menuOpen = !menuOpen"
      class="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 text-xl shadow-md hover:bg-gray-50 active:scale-95 transition flex items-center justify-center"
      title="選單">{{ menuOpen ? '✕' : '≡' }}</button>
  </div>

  <!-- Feedback FAB -->
  <button @click="$emit('feedback')"
    class="fixed bottom-6 left-4 z-30 bg-white border border-gray-200 text-gray-500 rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-gray-50 hover:text-indigo-600 transition text-lg"
    title="意見回饋">💬</button>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  user: { type: Object, default: null },
  isZh: { type: Boolean, default: true },
});

defineEmits(['create', 'feedback']);

const menuOpen = ref(false);
</script>
