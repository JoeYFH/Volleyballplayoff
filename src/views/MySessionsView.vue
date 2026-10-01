<template>
  <div class="min-h-screen bg-gray-50 pb-24">
    <!-- Auth loading -->
    <div v-if="authLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-4xl animate-bounce">🏐</div>
    </div>

    <!-- Login screen -->
    <div v-else-if="!user" class="flex items-center justify-center min-h-screen px-4">
      <div class="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm text-center">
        <div class="flex justify-end mb-2">
          <button @click="toggleLang" class="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-indigo-600 transition">
            {{ lang === 'zh' ? 'EN' : '中' }}
          </button>
        </div>
        <div class="text-5xl mb-3">🏐</div>
        <h1 class="text-xl font-bold text-gray-800 mb-1">{{ isZh ? '我的開場' : 'My Sessions' }}</h1>
        <p class="text-sm text-gray-400 mb-6">{{ isZh ? '請先登入' : 'Please sign in' }}</p>
        <button @click="signInWithGoogle" class="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" />
          {{ isZh ? '使用 Google 帳號登入' : 'Sign in with Google' }}
        </button>
        <div class="mt-6 border-t pt-4">
          <RouterLink to="/" class="text-xs text-gray-400 hover:text-gray-500">
            {{ isZh ? '← 回到報名頁面' : '← Back to sessions' }}
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Main app -->
    <div v-else class="max-w-2xl mx-auto">
      <!-- Sticky header -->
      <div class="sticky top-0 z-10 bg-gray-50 px-4 pt-4 pb-3 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <RouterLink to="/" class="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition shadow-sm shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </RouterLink>
            <h1 class="text-xl font-bold text-gray-800">📋 {{ isZh ? '我的開場' : 'My Sessions' }}</h1>
          </div>
          <div class="flex items-center gap-2">
            <button @click="toggleLang" class="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition shadow-sm">
              {{ lang === 'zh' ? 'EN' : '中' }}
            </button>
            <div class="flex items-center gap-2">
              <img v-if="photoURL" :src="photoURL" referrerpolicy="no-referrer" class="w-8 h-8 rounded-full border border-gray-200 shrink-0" alt="" onerror="this.style.display='none'" />
              <div class="flex flex-col items-start gap-0.5">
                <div class="flex items-center gap-1.5">
                  <p class="text-xs font-medium text-gray-700 max-w-[80px] truncate leading-none">{{ displayName }}</p>
                  <span v-if="isAdmin()" class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium leading-none">{{ isZh ? '管理員' : 'Admin' }}</span>
                </div>
                <button @click="signOut" class="text-[11px] text-gray-400 hover:text-red-400 transition leading-none">{{ isZh ? '登出' : 'Logout' }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="px-4 pt-4">
        <!-- Create button -->
        <button @click="showCreateSheet = true" class="w-full mb-3 bg-indigo-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition">
          + {{ isZh ? '建立新場次' : 'New Session' }}
        </button>

        <!-- Status filters -->
        <div class="flex gap-1.5 mb-1.5 overflow-x-auto pb-1">
          <button v-for="f in statusFilters" :key="f.key" @click="statusFilter = f.key"
            :class="statusFilter === f.key ? 'text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 text-white transition shrink-0' : 'text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 transition shrink-0'">
            {{ f.label }}
          </button>
        </div>

        <!-- Sort controls -->
        <div class="flex justify-end gap-1.5 mb-3">
          <select v-model="sortType" class="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-300">
            <option value="createdAt">{{ isZh ? '🕐 建立時間' : '🕐 Created' }}</option>
            <option value="date">{{ isZh ? '📅 活動日期' : '📅 By Date' }}</option>
            <option value="closeAt">{{ isZh ? '⏰ 截止時間' : '⏰ By Close' }}</option>
          </select>
          <select v-model="sortDir" class="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-300">
            <option value="desc">{{ isZh ? '遠→近' : 'Far→Near' }}</option>
            <option value="asc">{{ isZh ? '近→遠' : 'Near→Far' }}</option>
          </select>
        </div>

        <!-- Skeleton loading -->
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 2" :key="i" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div class="skeleton h-5 w-2/3 rounded-lg mb-2"></div>
            <div class="skeleton h-3 w-1/4 rounded mb-4"></div>
            <div class="skeleton h-3 w-1/2 rounded mb-1"></div>
            <div class="skeleton h-3 w-1/3 rounded mb-4"></div>
            <div class="flex gap-2">
              <div class="skeleton h-7 w-20 rounded-lg"></div>
              <div class="skeleton h-7 w-16 rounded-lg"></div>
              <div class="skeleton h-7 w-20 rounded-lg"></div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!filteredSessions.length" class="text-center py-10 text-gray-400">
          <div class="text-4xl mb-2">📭</div>
          <p class="text-sm">{{ isZh ? '還沒有建立任何場次' : 'No sessions created yet' }}</p>
          <p class="text-xs mt-2 text-gray-300">{{ isZh ? '只顯示透過本網頁建立的場次' : 'Only shows sessions created through this website' }}</p>
        </div>

        <!-- Sessions list -->
        <div v-else class="space-y-4">
          <MgmtSessionCard
            v-for="s in filteredSessions"
            :key="s.id"
            :session="s"
            :user="user"
            :is-zh="isZh"
            @toggle-open="toggleOpen"
            @toggle-private="togglePrivate"
            @delete="deleteSession"
            @share="shareSession"
          />
        </div>
      </div>
    </div>

    <!-- Create / Edit session sheet -->
    <CreateSessionSheet
      v-if="showCreateSheet"
      :editSession="editingSession"
      @close="showCreateSheet = false; editingSession = null"
      @created="onSessionCreated"
      @updated="onSessionUpdated"
    />

    <!-- Share modal -->
    <div v-if="shareUrl" class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center px-4" @click.self="shareUrl = ''">
      <div class="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <h3 class="font-bold text-gray-800 mb-4">{{ isZh ? '分享報名連結' : 'Share Sign-up Link' }}</h3>
        <input :value="shareUrl" readonly class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 mb-3" />
        <button @click="copyShare" class="w-full bg-indigo-600 text-white rounded-xl py-2.5 font-semibold text-sm mb-2">
          {{ copiedShare ? (isZh ? '✅ 已複製！' : '✅ Copied!') : (isZh ? '📋 複製連結' : '📋 Copy Link') }}
        </button>
        <button @click="shareUrl = ''" class="w-full text-gray-400 text-sm py-1">{{ isZh ? '關閉' : 'Close' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from '@/lib/i18n.js';
import { useAuth } from '@/composables/useAuth.js';
import { supabase } from '@/lib/supabase.js';
import MgmtSessionCard from '@/components/MgmtSessionCard.vue';
import CreateSessionSheet from '@/components/CreateSessionSheet.vue';

const route = useRoute();
const { lang, setLang } = useI18n();
const { user, loading: authLoading, isAdmin, signInWithGoogle, signOut } = useAuth();

const isZh = computed(() => lang.value === 'zh');
function toggleLang() { setLang(lang.value === 'zh' ? 'en' : 'zh'); }

const photoURL = computed(() =>
  user.value?.user_metadata?.avatar_url
  || user.value?.identities?.[0]?.identity_data?.avatar_url || null
);
const displayName = computed(() =>
  user.value?.user_metadata?.full_name
  || user.value?.user_metadata?.name
  || user.value?.email || ''
);

const statusFilter = ref('all');
const sortType = ref('createdAt');
const sortDir = ref('desc');
const showCreateSheet = ref(false);
const editingSession = ref(null);

const statusFilters = computed(() => [
  { key: 'all', label: isZh.value ? '所有' : 'All' },
  { key: 'upcoming', label: isZh.value ? '尚未開始' : 'Upcoming' },
  { key: 'open', label: isZh.value ? '報名中' : 'Open' },
  { key: 'closed', label: isZh.value ? '已關閉' : 'Closed' },
  { key: 'past', label: isZh.value ? '過去' : 'Past' },
]);

// Data
const loading = ref(true);
const sessions = ref([]);
let channel = null;

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

async function loadSessions() {
  if (!user.value) return;
  const uid = user.value.id;
  const name = user.value.user_metadata?.full_name || user.value.user_metadata?.name || '';
  // Fetch by UID and by name separately to avoid .or() escaping issues with spaces
  const [{ data: byUid }, { data: byName }] = await Promise.all([
    supabase.from('sessions').select('*').eq('created_by', uid),
    name ? supabase.from('sessions').select('*').eq('creator_name', name) : { data: [] },
  ]);
  const seen = new Set();
  sessions.value = [...(byUid || []), ...(byName || [])]
    .filter(r => seen.has(r.id) ? false : seen.add(r.id))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map(mapSession);
  loading.value = false;
}

watch(user, (u) => {
  if (u) {
    loading.value = true;
    loadSessions();
    if (channel) supabase.removeChannel(channel);
    channel = supabase.channel('my-sessions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `created_by=eq.${u.id}` }, loadSessions)
      .subscribe();
  } else {
    sessions.value = [];
    if (channel) { supabase.removeChannel(channel); channel = null; }
  }
}, { immediate: true });

onUnmounted(() => { if (channel) supabase.removeChannel(channel); });

const filteredSessions = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();
  let list = sessions.value.filter(s => {
    const isPast = (s.date || '') < today;
    const openAtMs = s.openAt ? new Date(s.openAt).getTime() : null;
    const closeAtMs = s.closeAt ? new Date(s.closeAt).getTime() : null;
    const notStarted = !!(openAtMs && openAtMs > now);
    const effectivelyClosed = !s.isOpen || (closeAtMs && closeAtMs < now);
    if (statusFilter.value === 'all') return true;
    if (statusFilter.value === 'past') return isPast;
    if (statusFilter.value === 'upcoming') return !isPast && notStarted;
    if (statusFilter.value === 'open') return !isPast && !notStarted && !effectivelyClosed;
    if (statusFilter.value === 'closed') return !isPast && !notStarted && effectivelyClosed;
    return true;
  });
  const desc = sortDir.value === 'desc';
  if (sortType.value === 'date') {
    list = [...list].sort((a, b) => desc ? (b.date || '').localeCompare(a.date || '') : (a.date || '').localeCompare(b.date || ''));
  } else if (sortType.value === 'closeAt') {
    list = [...list].sort((a, b) => {
      const aMs = a.closeAt ? new Date(a.closeAt).getTime() : Infinity;
      const bMs = b.closeAt ? new Date(b.closeAt).getTime() : Infinity;
      return desc ? bMs - aMs : aMs - bMs;
    });
  } else {
    list = [...list].sort((a, b) => {
      const aTs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return desc ? bTs - aTs : aTs - bTs;
    });
  }
  return list;
});

async function toggleOpen(sessionId, currentIsOpen) {
  await supabase.from('sessions').update({ is_open: !currentIsOpen }).eq('id', sessionId);
}

async function togglePrivate(sessionId, currentIsPrivate) {
  await supabase.from('sessions').update({ is_private: !currentIsPrivate }).eq('id', sessionId);
}

async function deleteSession(sessionId) {
  const msg = isZh.value ? '確定刪除此場次？此操作無法恢復！' : 'Delete this session? This cannot be undone!';
  if (!confirm(msg)) return;
  await supabase.from('sessions').delete().eq('id', sessionId);
}

function onSessionCreated() {
  showCreateSheet.value = false;
  editingSession.value = null;
}
function onSessionUpdated() {
  showCreateSheet.value = false;
  editingSession.value = null;
}

const shareUrl = ref('');
const copiedShare = ref(false);
function shareSession(sessionId) {
  shareUrl.value = `${location.origin}/?session=${sessionId}`;
  copiedShare.value = false;
  navigator.clipboard.writeText(shareUrl.value).catch(() => {});
}
async function copyShare() {
  await navigator.clipboard.writeText(shareUrl.value);
  copiedShare.value = true;
  setTimeout(() => { copiedShare.value = false; }, 2000);
}
</script>

<style scoped>
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
