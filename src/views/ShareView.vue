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

        <!-- Share button -->
        <button @click="copyShareLink"
          class="block w-full text-center text-indigo-600 font-semibold py-3 rounded-2xl border border-indigo-200 hover:bg-indigo-50 transition mt-3 text-sm">
          {{ copied ? (isZh ? '✅ 已複製分享連結' : '✅ Copied!') : (isZh ? '🔗 複製分享連結' : '🔗 Copy Share Link') }}
        </button>

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
import { supabase, ogShareUrl } from '@/lib/supabase.js';
import { useI18n } from '@/lib/i18n.js';

const route = useRoute();
const { lang } = useI18n();

const isZh = computed(() => lang.value === 'zh');
const state = ref('loading'); // 'loading' | 'loaded' | 'error'
const session = ref(null);

const sessionId = route.params.id;
const copied = ref(false);

async function copyShareLink() {
  const url = ogShareUrl(sessionId);
  await navigator.clipboard.writeText(url).catch(() => {});
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

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

function setMeta(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

function updatePageMeta(data) {
  const title = '🏐 ' + (data.title || (data.date + ' 臨打'));
  const days = ['日','一','二','三','四','五','六'];
  const dt = data.date ? new Date(data.date + 'T00:00:00') : null;
  const parts = [];
  if (dt) parts.push('📅 ' + `${dt.getFullYear()}/${dt.getMonth()+1}/${dt.getDate()}（週${days[dt.getDay()]}）`);
  if (data.time) parts.push('🕐 ' + data.time);
  if (data.location) parts.push('📍 ' + data.location);
  const typeMap = { mixed: '混排', male: '男生', female: '女生' };
  if (typeMap[data.type]) parts.push(typeMap[data.type]);
  if (data.creator_name) parts.push('👤 ' + data.creator_name);
  const description = parts.join(' · ');

  document.title = title;
  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[property="og:description"]', 'content', description);
  setMeta('meta[property="og:url"]', 'content', window.location.href);
  setMeta('meta[name="twitter:title"]', 'content', title);
  setMeta('meta[name="twitter:description"]', 'content', description);
}

function parsePreloaded() {
  // Cloud Function injects window.__SESSION__ for instant data
  if (window.__SESSION__) return window.__SESSION__;
  // Fallback: ?d= base64 param from old redirect approach
  try {
    const d = new URLSearchParams(window.location.search).get('d');
    if (!d) return null;
    const bytes = Uint8Array.from(atob(d), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

onMounted(async () => {
  if (!sessionId) {
    state.value = 'error';
    return;
  }

  // 優先使用 ?d= 預載資料，立即顯示不用 loading
  const preloaded = parsePreloaded();
  if (preloaded) {
    session.value = preloaded;
    state.value = 'loaded';
    updatePageMeta(preloaded);
  }

  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (error || !data) {
      if (!preloaded) state.value = 'error';
    } else {
      session.value = data;
      state.value = 'loaded';
      updatePageMeta(data);
    }
  } catch {
    if (!preloaded) state.value = 'error';
  }
});
</script>
