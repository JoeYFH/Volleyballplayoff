<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Sticky header -->
    <header class="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div class="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
        <RouterLink to="/" class="text-gray-400 hover:text-indigo-500 transition text-sm mr-1">←</RouterLink>
        <h1 class="font-bold text-gray-800 flex-1 truncate">
          {{ isZh ? '管理後台' : 'Admin Panel' }}
        </h1>
        <!-- Lang toggle -->
        <button @click="setLang(lang === 'zh' ? 'en' : 'zh')"
          class="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
          {{ lang === 'zh' ? 'EN' : '中' }}
        </button>
        <!-- Logout -->
        <button v-if="user" @click="signOut"
          class="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
          {{ isZh ? '登出' : 'Logout' }}
        </button>
      </div>
    </header>

    <!-- Not logged in -->
    <div v-if="!authLoading && !user" class="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div class="text-5xl mb-4">🔐</div>
      <h2 class="text-lg font-bold text-gray-700 mb-2">{{ isZh ? '請先登入' : 'Please sign in' }}</h2>
      <p class="text-sm text-gray-400 mb-6">{{ isZh ? '管理後台需要 Google 登入' : 'Admin panel requires Google sign-in' }}</p>
      <button @click="signInWithGoogle"
        class="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition shadow">
        {{ isZh ? '使用 Google 帳號登入' : 'Sign in with Google' }}
      </button>
    </div>

    <!-- Not admin -->
    <div v-else-if="!authLoading && user && !isAdmin()" class="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div class="text-5xl mb-4">🚫</div>
      <h2 class="text-lg font-bold text-gray-700 mb-2">{{ isZh ? '無存取權限' : 'Access Denied' }}</h2>
      <p class="text-sm text-gray-400 mb-6">{{ isZh ? '此帳號沒有管理員權限' : 'This account does not have admin access.' }}</p>
      <RouterLink to="/" class="text-indigo-500 text-sm hover:underline">← {{ isZh ? '回首頁' : 'Back to home' }}</RouterLink>
    </div>

    <!-- Auth loading -->
    <div v-else-if="authLoading" class="flex justify-center items-center min-h-[60vh]">
      <div class="text-4xl animate-bounce">🏐</div>
    </div>

    <!-- Admin content -->
    <div v-else class="max-w-2xl mx-auto px-4 py-4">

      <!-- Stats row -->
      <div class="flex items-center gap-2 mb-4">
        <span class="text-xs bg-indigo-100 text-indigo-600 font-semibold px-3 py-1 rounded-full">
          {{ isZh ? `共 ${sessions.length} 場` : `${sessions.length} sessions` }}
        </span>
        <span v-if="sessionsLoading" class="text-xs text-gray-400 animate-pulse">{{ isZh ? '載入中…' : 'Loading…' }}</span>
      </div>

      <!-- Filter bar -->
      <div class="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        <button v-for="f in filters" :key="f.key"
          @click="activeFilter = f.key"
          :class="['text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition',
            activeFilter === f.key
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50']">
          {{ f.label }}
        </button>
      </div>

      <!-- Session cards -->
      <div v-if="sessionsLoading && !sessions.length" class="flex justify-center py-16">
        <div class="text-4xl animate-bounce">🏐</div>
      </div>

      <div v-else-if="!filteredSessions.length" class="text-center py-12 text-gray-400">
        <div class="text-3xl mb-3">📭</div>
        <p class="text-sm">{{ isZh ? '沒有符合條件的場次' : 'No sessions match this filter' }}</p>
      </div>

      <div v-else class="space-y-4">
        <MgmtSessionCard
          v-for="s in filteredSessions"
          :key="s.id"
          :session="s"
          :user="user"
          :is-zh="isZh"
          @toggle-open="handleToggleOpen"
          @toggle-private="handleTogglePrivate"
          @delete="handleDelete"
          @share="handleShare"
        />
      </div>
    </div>

    <!-- Share modal -->
    <div v-if="shareUrl" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" @click.self="shareUrl = ''">
      <div class="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <h3 class="font-bold text-gray-800 mb-4">{{ isZh ? '分享活動連結' : 'Share Link' }}</h3>
        <input :value="shareUrl" readonly class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 mb-3 select-all" />
        <button @click="copyShareUrl"
          class="w-full bg-indigo-600 text-white rounded-xl py-2.5 font-semibold text-sm mb-2 hover:bg-indigo-700 transition">
          {{ copiedShare ? (isZh ? '✅ 已複製！' : '✅ Copied!') : (isZh ? '📋 複製連結' : '📋 Copy Link') }}
        </button>
        <button @click="shareUrl = ''" class="w-full text-gray-400 text-sm py-1 hover:text-gray-600 transition">
          {{ isZh ? '關閉' : 'Close' }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { RouterLink } from 'vue-router';
import { supabase } from '@/lib/supabase.js';
import { useAuth } from '@/composables/useAuth.js';
import { useI18n } from '@/lib/i18n.js';
import MgmtSessionCard from '@/components/MgmtSessionCard.vue';

const { user, loading: authLoading, isAdmin, signInWithGoogle, signOut } = useAuth();
const { lang, setLang } = useI18n();

const isZh = computed(() => lang.value === 'zh');

// ── Session mapper ─────────────────────────────────────────────────────────────
function mapSession(row) {
  return {
    id: row.id, title: row.title, date: row.date, time: row.time,
    location: row.location, venue: row.venue, type: row.type || '',
    limit: row.limit_total || 0, maleLimit: row.male_limit || 0, femaleLimit: row.female_limit || 0,
    equipment: row.equipment || [], note: row.note,
    isOpen: row.is_open, isPrivate: row.is_private, cancelled: row.cancelled,
    openAt: row.open_at, closeAt: row.close_at,
    createdBy: row.created_by, creatorName: row.creator_name, creatorPhoto: row.creator_photo,
    createdAt: row.created_at,
  };
}

// ── Data ───────────────────────────────────────────────────────────────────────
const sessions = ref([]);
const sessionsLoading = ref(false);
const activeFilter = ref('all');
const shareUrl = ref('');
const copiedShare = ref(false);

const today = new Date().toISOString().split('T')[0];

const filters = computed(() => [
  { key: 'all',      label: isZh.value ? '全部' : 'All' },
  { key: 'upcoming', label: isZh.value ? '即將舉行' : 'Upcoming' },
  { key: 'open',     label: isZh.value ? '報名中' : 'Open' },
  { key: 'closed',   label: isZh.value ? '已關閉' : 'Closed' },
  { key: 'past',     label: isZh.value ? '已結束' : 'Past' },
]);

const filteredSessions = computed(() => {
  let list = [...sessions.value];
  // Sort by date desc
  list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  switch (activeFilter.value) {
    case 'upcoming': return list.filter(s => (s.date || '') >= today);
    case 'open':     return list.filter(s => (s.date || '') >= today && s.isOpen);
    case 'closed':   return list.filter(s => (s.date || '') >= today && !s.isOpen);
    case 'past':     return list.filter(s => (s.date || '') < today);
    default:         return list;
  }
});

// ── Fetch all sessions ─────────────────────────────────────────────────────────
async function fetchSessions() {
  sessionsLoading.value = true;
  try {
    const { data, error } = await supabase.from('sessions').select('*').order('date', { ascending: false });
    if (!error && data) {
      sessions.value = data.map(mapSession);
    }
  } finally {
    sessionsLoading.value = false;
  }
}

// ── Realtime subscription ──────────────────────────────────────────────────────
let channel = null;

function subscribeRealtime() {
  channel = supabase
    .channel('admin-sessions-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
      fetchSessions();
    })
    .subscribe();
}

watch([user, authLoading], ([u, loading]) => {
  if (!loading && u && isAdmin()) {
    fetchSessions();
    if (!channel) subscribeRealtime();
  }
}, { immediate: true });

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel);
});

// ── Handlers ───────────────────────────────────────────────────────────────────
async function handleToggleOpen(id, isOpen) {
  await supabase.from('sessions').update({ is_open: !isOpen }).eq('id', id);
  // Update local state optimistically
  const s = sessions.value.find(s => s.id === id);
  if (s) s.isOpen = !isOpen;
}

async function handleTogglePrivate(id, isPrivate) {
  await supabase.from('sessions').update({ is_private: !isPrivate }).eq('id', id);
  const s = sessions.value.find(s => s.id === id);
  if (s) s.isPrivate = !isPrivate;
}

async function handleDelete(id) {
  const confirmMsg = isZh.value ? '確定刪除此場次？此操作無法復原。' : 'Delete this session? This cannot be undone.';
  if (!confirm(confirmMsg)) return;
  await supabase.from('sessions').delete().eq('id', id);
  sessions.value = sessions.value.filter(s => s.id !== id);
}

function handleShare(id) {
  shareUrl.value = `${window.location.origin}/share/${id}`;
  copiedShare.value = false;
}

async function copyShareUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    copiedShare.value = true;
    setTimeout(() => { copiedShare.value = false; }, 2000);
  } catch {
    // fallback: select the input text
  }
}
</script>
