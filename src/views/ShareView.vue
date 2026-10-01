<template>
  <div class="min-h-screen flex items-center justify-center p-4"
    style="background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)">

    <!-- Card -->
    <div class="bg-white rounded-3xl shadow-lg w-full max-w-sm p-8">

      <!-- Loading -->
      <div v-if="state === 'loading'" class="text-center py-4">
        <div class="text-5xl animate-bounce mb-4">🏐</div>
        <p class="text-sm text-gray-500">{{ isZh ? '正在載入活動資訊…' : 'Loading session info…' }}</p>
      </div>

      <!-- Error -->
      <div v-else-if="state === 'error'" class="text-center py-4">
        <div class="text-5xl mb-4">😢</div>
        <p class="text-red-500 font-semibold mb-2">{{ isZh ? '找不到此活動' : 'Session not found' }}</p>
        <p class="text-sm text-gray-400 mb-6">{{ isZh ? '可能已被刪除或連結失效' : 'It may have been deleted or the link is invalid.' }}</p>
        <RouterLink to="/" class="text-sm text-gray-400 hover:text-indigo-500 transition">← {{ isZh ? '回首頁' : 'Back to home' }}</RouterLink>
      </div>

      <!-- Content -->
      <div v-else-if="state === 'loaded' && session">
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="text-5xl mb-2">🏐</div>
          <h1 class="text-xl font-bold text-indigo-900 leading-snug mb-2">{{ session.title || (isZh ? '排球活動' : 'Volleyball Session') }}</h1>
          <span v-if="session.type" :class="['text-xs font-semibold px-3 py-1 rounded-full', typeStyle]">{{ typeLabel }}</span>
        </div>

        <!-- Info grid -->
        <div class="space-y-2.5 mb-6">
          <div class="flex items-start gap-3 bg-indigo-50/60 rounded-xl px-4 py-3">
            <span class="text-base mt-0.5">📅</span>
            <div>
              <p class="text-xs text-gray-400 font-medium">{{ isZh ? '日期' : 'Date' }}</p>
              <p class="text-sm text-gray-800 font-semibold">{{ formattedDate }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3 bg-indigo-50/60 rounded-xl px-4 py-3">
            <span class="text-base mt-0.5">⏰</span>
            <div>
              <p class="text-xs text-gray-400 font-medium">{{ isZh ? '時間' : 'Time' }}</p>
              <p class="text-sm text-gray-800 font-semibold">{{ session.time || '—' }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3 bg-indigo-50/60 rounded-xl px-4 py-3">
            <span class="text-base mt-0.5">📍</span>
            <div>
              <p class="text-xs text-gray-400 font-medium">{{ isZh ? '地點' : 'Location' }}</p>
              <p class="text-sm text-gray-800 font-semibold">{{ session.location || '—' }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3 bg-indigo-50/60 rounded-xl px-4 py-3">
            <span class="text-base mt-0.5">👤</span>
            <div>
              <p class="text-xs text-gray-400 font-medium">{{ isZh ? '開團人' : 'Organizer' }}</p>
              <p class="text-sm text-gray-800 font-semibold">{{ session.creator_name || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- CTA button -->
        <a :href="joinUrl"
          class="block w-full text-center text-white font-bold py-4 rounded-2xl shadow-md transition active:scale-95"
          style="background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 4px 16px rgba(99,102,241,0.3)">
          🏐 {{ isZh ? '前往報名' : 'Sign Up Now' }}
        </a>

        <!-- Back link -->
        <RouterLink to="/" class="block text-center text-xs text-gray-400 hover:text-indigo-500 mt-4 transition">
          ← {{ isZh ? '回首頁' : 'Back to home' }}
        </RouterLink>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { supabase } from '@/lib/supabase.js';
import { useI18n } from '@/lib/i18n.js';

const route = useRoute();
const { lang } = useI18n();

const isZh = computed(() => lang.value === 'zh');
const state = ref('loading'); // 'loading' | 'loaded' | 'error'
const session = ref(null);

const sessionId = route.params.id;

const joinUrl = computed(() => {
  if (!sessionId) return '/';
  return `/?session=${encodeURIComponent(sessionId)}`;
});

const formattedDate = computed(() => {
  if (!session.value?.date) return '—';
  const dt = new Date(session.value.date + 'T00:00:00');
  if (!isZh.value) {
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short', year: 'numeric' });
  }
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}（週${days[dt.getDay()]}）`;
});

const typeLabel = computed(() => {
  const map = {
    mixed: isZh.value ? '混排' : 'Mixed',
    male: isZh.value ? '男生' : 'Male',
    female: isZh.value ? '女生' : 'Female',
  };
  return map[session.value?.type] || session.value?.type || '';
});

const typeStyle = computed(() => {
  const map = {
    mixed: 'bg-violet-100 text-violet-700',
    male: 'bg-blue-100 text-blue-700',
    female: 'bg-pink-100 text-pink-700',
  };
  return map[session.value?.type] || 'bg-gray-100 text-gray-600';
});

onMounted(async () => {
  if (!sessionId) {
    state.value = 'error';
    return;
  }
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (error || !data) {
      state.value = 'error';
    } else {
      session.value = data;
      state.value = 'loaded';
    }
  } catch {
    state.value = 'error';
  }
});
</script>
