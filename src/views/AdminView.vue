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
    <div v-else class="max-w-2xl mx-auto px-4 py-4 pb-16">

      <!-- ── 所有開場 ── -->
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-bold text-gray-700">📋 {{ isZh ? '所有開場' : 'All Sessions' }}</h2>
        <div class="flex items-center gap-2">
          <span class="text-xs bg-indigo-100 text-indigo-600 font-semibold px-2.5 py-1 rounded-full">{{ sessions.length }}</span>
          <button @click="fetchSessions" class="text-xs text-gray-400 hover:text-indigo-500 transition" title="Refresh">↻</button>
          <button @click="handleClearGarbage" class="text-xs text-red-400 hover:text-red-600 transition">🗑️</button>
        </div>
      </div>
      <div v-if="fetchError" class="mb-3 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs">⚠️ {{ fetchError }}</div>

      <!-- Filter tabs -->
      <div class="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-hide">
        <button v-for="f in filters" :key="f.key" @click="activeFilter = f.key"
          :class="['text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition',
            activeFilter === f.key ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50']">
          {{ f.label }}
        </button>
      </div>

      <!-- Session cards -->
      <div v-if="sessionsLoading && !sessions.length" class="flex justify-center py-16">
        <div class="text-4xl animate-bounce">🏐</div>
      </div>
      <div v-else-if="!filteredSessions.length" class="text-center py-10 text-gray-400">
        <div class="text-3xl mb-2">📭</div>
        <p class="text-sm">{{ isZh ? '沒有符合條件的場次' : 'No sessions match this filter' }}</p>
      </div>
      <div v-else class="space-y-4 mb-8">
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
          @edit="handleEdit"
        />
      </div>

      <!-- ── 意見回覆 ── -->
      <div class="flex items-center justify-between mb-3 mt-4 border-t border-gray-100 pt-4">
        <h2 class="font-bold text-gray-700">💬 {{ isZh ? '意見回覆' : 'Feedback' }}</h2>
        <div class="flex items-center gap-2">
          <span v-if="pendingCount" class="text-xs bg-red-100 text-red-600 font-semibold px-2.5 py-1 rounded-full">{{ pendingCount }}</span>
          <button @click="fetchFeedback" class="text-xs text-gray-400 hover:text-indigo-500 transition" title="Refresh">↻</button>
        </div>
      </div>

      <!-- Feedback filter + sort -->
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <div class="flex gap-1">
          <button v-for="f in fbFilters" :key="f.key" @click="fbFilter = f.key"
            :class="['text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition',
              fbFilter === f.key ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50']">
            {{ f.label }}
          </button>
        </div>
        <select v-model="fbSort" class="ml-auto text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400 text-gray-600">
          <option value="created_at">{{ isZh ? '建立日期' : 'Date' }}</option>
          <option value="urgency">{{ isZh ? '緊急程度' : 'Urgency' }}</option>
          <option value="type">{{ isZh ? '類別' : 'Type' }}</option>
        </select>
      </div>

      <div v-if="feedbackLoading" class="text-center py-8 text-gray-400 text-sm animate-pulse">{{ isZh ? '載入中…' : 'Loading…' }}</div>
      <div v-else-if="!filteredFeedback.length" class="text-center py-8 text-gray-400">
        <div class="text-3xl mb-2">📭</div>
        <p class="text-sm">{{ isZh ? '沒有符合條件的回饋' : 'No feedback in this category' }}</p>
      </div>
      <div v-else class="space-y-3">
        <!-- Bulk action bar -->
        <div v-if="selectedFbIds.size" class="sticky top-0 z-20 bg-indigo-600 text-white rounded-xl px-4 py-2.5 flex items-center gap-2 flex-wrap shadow-lg">
          <span class="text-xs font-semibold">{{ isZh ? `已選 ${selectedFbIds.size} 筆` : `${selectedFbIds.size} selected` }}</span>
          <button @click="bulkMoveFb('pending')" class="text-xs px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition">{{ isZh ? '待處理' : 'Pending' }}</button>
          <button @click="bulkMoveFb('in_progress')" class="text-xs px-2.5 py-1 rounded-lg bg-amber-400/80 hover:bg-amber-400 transition">{{ isZh ? '處理中' : 'In Progress' }}</button>
          <button @click="bulkMoveFb('done')" class="text-xs px-2.5 py-1 rounded-lg bg-green-400/80 hover:bg-green-400 transition">{{ isZh ? '已處理' : 'Done' }}</button>
          <button @click="bulkDeleteFb" class="text-xs px-2.5 py-1 rounded-lg bg-red-400/80 hover:bg-red-400 transition">🗑️ {{ isZh ? '刪除' : 'Delete' }}</button>
          <button @click="selectedFbIds = new Set()" class="text-xs px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition ml-auto">✕</button>
        </div>

        <div v-for="fb in filteredFeedback" :key="fb.id"
          @click.self="toggleFbSelect(fb.id)"
          :class="['bg-white rounded-xl border shadow-sm p-4 transition cursor-pointer',
            selectedFbIds.has(fb.id) ? 'border-indigo-400 ring-2 ring-indigo-200' :
            fb.status === 'done' ? 'border-green-100 opacity-70' : fb.status === 'in_progress' ? 'border-amber-200' : 'border-gray-100']">
          <!-- Header row -->
          <div class="flex items-start justify-between gap-2 mb-1" @click="toggleFbSelect(fb.id)">
            <div class="flex items-center gap-2 flex-wrap">
              <input type="checkbox" :checked="selectedFbIds.has(fb.id)" @click.stop @change="toggleFbSelect(fb.id)"
                class="rounded border-gray-300 text-indigo-600 shrink-0" />
              <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', typeClass(fb.type)]">{{ typeLabel(fb.type) }}</span>
              <span :class="['text-xs px-2 py-0.5 rounded-full', urgencyClass(fb.urgency)]">{{ urgencyLabel(fb.urgency) }}</span>
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', fbStatusClass(fb.status)]">{{ fbStatusLabel(fb.status) }}</span>
            </div>
            <span class="text-xs text-gray-300 shrink-0">{{ fmtFbDate(fb.created_at) }}</span>
          </div>
          <!-- Description -->
          <p class="text-sm text-gray-700 mt-2 whitespace-pre-wrap" @click="toggleFbSelect(fb.id)">{{ fb.description }}</p>
          <p v-if="fb.email" class="text-xs text-indigo-500 mt-1.5" @click="toggleFbSelect(fb.id)">📧 {{ fb.email }}</p>
          <!-- Actions -->
          <div class="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-50 flex-wrap">
            <button v-if="fb.status !== 'pending'" @click.stop="updateFbStatus(fb.id, 'pending')"
              class="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
              {{ isZh ? '待處理' : 'Pending' }}
            </button>
            <button v-if="fb.status !== 'in_progress'" @click.stop="updateFbStatus(fb.id, 'in_progress')"
              class="text-xs px-2.5 py-1 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 transition">
              {{ isZh ? '處理中' : 'In Progress' }}
            </button>
            <button v-if="fb.status !== 'done'" @click.stop="updateFbStatus(fb.id, 'done')"
              class="text-xs px-2.5 py-1 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition">
              {{ isZh ? '已處理' : 'Done' }}
            </button>
            <button @click.stop="deleteFb(fb.id)"
              class="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition ml-auto">
              🗑️ {{ isZh ? '刪除' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit session sheet -->
    <CreateSessionSheet
      v-if="showEditSheet"
      :editSession="editingSession"
      @close="showEditSheet = false; editingSession = null"
      @updated="onSessionUpdated"
    />

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
import { ref, computed, watch, watchEffect, onMounted, onUnmounted } from 'vue';
import { RouterLink } from 'vue-router';
import { supabase } from '@/lib/supabase.js';
import { useAuth } from '@/composables/useAuth.js';
import { useI18n } from '@/lib/i18n.js';
import MgmtSessionCard from '@/components/MgmtSessionCard.vue';
import CreateSessionSheet from '@/components/CreateSessionSheet.vue';

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
const fetchError = ref('');
const activeFilter = ref('all');
const shareUrl = ref('');
const copiedShare = ref(false);
const feedbackList = ref([]);
const feedbackLoading = ref(false);
const fbFilter = ref('pending');
const fbSort = ref('created_at');
const selectedFbIds = ref(new Set());
const editingSession = ref(null);
const showEditSheet = ref(false);

const today = new Date().toISOString().split('T')[0];

const filters = computed(() => [
  { key: 'all',      label: isZh.value ? '全部' : 'All' },
  { key: 'upcoming', label: isZh.value ? '即將舉行' : 'Upcoming' },
  { key: 'open',     label: isZh.value ? '報名中' : 'Open' },
  { key: 'closed',   label: isZh.value ? '已關閉' : 'Closed' },
  { key: 'past',     label: isZh.value ? '已結束' : 'Past' },
]);

const fbFilters = computed(() => [
  { key: 'pending',     label: isZh.value ? '尚未處理' : 'Pending' },
  { key: 'in_progress', label: isZh.value ? '處理中' : 'In Progress' },
  { key: 'done',        label: isZh.value ? '已處理' : 'Done' },
  { key: 'all',         label: isZh.value ? '全部' : 'All' },
]);

const URGENCY_ORDER = { high: 0, medium: 1, low: 2 };
const TYPE_ORDER = { bug: 0, idea: 1, other: 2 };

const pendingCount = computed(() => feedbackList.value.filter(f => f.status === 'pending' || !f.status).length);

const filteredFeedback = computed(() => {
  let list = [...feedbackList.value];
  if (fbFilter.value !== 'all') {
    const key = fbFilter.value;
    list = list.filter(f => (f.status || 'pending') === key);
  }
  if (fbSort.value === 'urgency') {
    list.sort((a, b) => (URGENCY_ORDER[a.urgency] ?? 3) - (URGENCY_ORDER[b.urgency] ?? 3));
  } else if (fbSort.value === 'type') {
    list.sort((a, b) => (TYPE_ORDER[a.type] ?? 3) - (TYPE_ORDER[b.type] ?? 3));
  } else {
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return list;
});

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
  fetchError.value = '';
  try {
    const { data, error } = await supabase.from('sessions').select('*').order('date', { ascending: false });
    if (error) { fetchError.value = error.message; return; }
    sessions.value = (data || []).map(mapSession);
  } catch (e) {
    fetchError.value = e.message || 'Unknown error';
  } finally {
    sessionsLoading.value = false;
  }
}

// ── Realtime subscription ──────────────────────────────────────────────────────
let channel = null;

function subscribeRealtime() {
  channel = supabase
    .channel('admin-sessions-' + Math.random().toString(36).slice(2))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
      fetchSessions();
    })
    .subscribe();
}

// ── Create test session ────────────────────────────────────────────────────────
async function handleCreateTestSession() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = tomorrow.toISOString().split('T')[0];
  const { error } = await supabase.from('sessions').insert({
    title: '[測試場次]',
    date,
    time: '19:00',
    location: '測試球館',
    venue: '場館一樓大廳集合',
    type: 'mixed',
    limit_total: 12,
    male_limit: 6,
    female_limit: 6,
    is_open: true,
    is_private: false,
    created_by: user.value?.id,
    creator_name: 'test',
    creator_photo: null,
    note: '這是測試場次',
  });
  if (error) { alert('Error: ' + error.message); return; }
  alert(isZh.value ? '✅ 測試場次已建立！' : '✅ Test session created!');
  fetchSessions();
}

// ── Fix missing creator info for admin's own sessions ─────────────────────────
async function handleFixCreatorInfo() {
  if (!user.value) return;
  const name = user.value.user_metadata?.full_name || user.value.user_metadata?.name || user.value.email || '';
  const photo = user.value.user_metadata?.avatar_url || null;
  const uid = user.value.id;
  const { error, count } = await supabase.from('sessions')
    .update({ creator_name: name, creator_photo: photo })
    .eq('created_by', uid)
    .is('creator_name', null);
  if (error) { alert('Error: ' + error.message); return; }
  // Also match by name for old Firebase sessions
  await supabase.from('sessions').update({ creator_name: name, creator_photo: photo })
    .eq('creator_name', '');
  alert(isZh.value ? `✅ 已補全建立者資料（${count ?? '?'} 筆）` : `✅ Updated creator info (${count ?? '?'} records)`);
  fetchSessions();
}

async function fetchFeedback() {
  feedbackLoading.value = true;
  try {
    const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
    feedbackList.value = data || [];
  } finally {
    feedbackLoading.value = false;
  }
}

async function updateFbStatus(id, status) {
  await supabase.from('feedback').update({ status }).eq('id', id);
  const fb = feedbackList.value.find(f => f.id === id);
  if (fb) fb.status = status;
}

async function deleteFb(id) {
  const msg = isZh.value ? '確定刪除此回饋？' : 'Delete this feedback?';
  if (!confirm(msg)) return;
  const { error } = await supabase.from('feedback').delete().eq('id', id);
  if (error) { alert(isZh.value ? `刪除失敗：${error.message}` : `Delete failed: ${error.message}`); return; }
  feedbackList.value = feedbackList.value.filter(f => f.id !== id);
  const s = new Set(selectedFbIds.value); s.delete(id); selectedFbIds.value = s;
}

function toggleFbSelect(id) {
  const s = new Set(selectedFbIds.value);
  s.has(id) ? s.delete(id) : s.add(id);
  selectedFbIds.value = s;
}

async function bulkMoveFb(status) {
  const ids = [...selectedFbIds.value];
  if (!ids.length) return;
  await Promise.all(ids.map(id => supabase.from('feedback').update({ status }).eq('id', id)));
  ids.forEach(id => { const fb = feedbackList.value.find(f => f.id === id); if (fb) fb.status = status; });
  selectedFbIds.value = new Set();
}

async function bulkDeleteFb() {
  const ids = [...selectedFbIds.value];
  if (!ids.length) return;
  const msg = isZh.value ? `確定刪除 ${ids.length} 筆回饋？` : `Delete ${ids.length} feedback items?`;
  if (!confirm(msg)) return;
  const { error } = await supabase.from('feedback').delete().in('id', ids);
  if (error) { alert(isZh.value ? `刪除失敗：${error.message}` : `Delete failed: ${error.message}`); return; }
  feedbackList.value = feedbackList.value.filter(f => !ids.includes(f.id));
  selectedFbIds.value = new Set();
}

// Use watchEffect for reliable reactive re-evaluation
watchEffect(() => {
  if (!authLoading.value && user.value && isAdmin()) {
    fetchSessions();
    fetchFeedback();
    if (!channel) subscribeRealtime();
  }
});

// Extra safety: also try on mount
onMounted(() => {
  if (!authLoading.value && user.value && isAdmin()) {
    fetchSessions();
    fetchFeedback();
    if (!channel) subscribeRealtime();
  }
});

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel);
});

function handleEdit(session) {
  editingSession.value = session;
  showEditSheet.value = true;
}
function onSessionUpdated() {
  showEditSheet.value = false;
  editingSession.value = null;
  fetchSessions();
}

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


function typeLabel(type) {
  if (!isZh.value) return type === 'bug' ? 'Bug' : type === 'idea' ? 'Idea' : 'Other';
  return type === 'bug' ? '🐛 問題' : type === 'idea' ? '💡 建議' : '📝 其他';
}
function typeClass(type) {
  return type === 'bug' ? 'bg-red-100 text-red-600' : type === 'idea' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500';
}
function urgencyLabel(u) {
  if (!isZh.value) return u === 'high' ? 'High' : u === 'medium' ? 'Med' : 'Low';
  return u === 'high' ? '⚠️ 高' : u === 'medium' ? '⚡ 中' : '低';
}
function urgencyClass(u) {
  return u === 'high' ? 'bg-red-50 text-red-500' : u === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-400';
}
function fbStatusLabel(status) {
  const s = status || 'pending';
  if (!isZh.value) return s === 'done' ? 'Done' : s === 'in_progress' ? 'In Progress' : 'Pending';
  return s === 'done' ? '✅ 已處理' : s === 'in_progress' ? '⏳ 處理中' : '🔴 待處理';
}
function fbStatusClass(status) {
  const s = status || 'pending';
  return s === 'done' ? 'bg-green-100 text-green-600' : s === 'in_progress' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-500';
}

function fmtFbDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ── Clear garbage data ─────────────────────────────────────────────────────────
async function handleClearGarbage() {
  const msg = isZh.value
    ? '這會刪除所有「已取消」的場次（cancelled=true）以及姓名為空的報名紀錄。確定繼續？'
    : 'This will delete all cancelled sessions and signups with empty names. Proceed?';
  if (!confirm(msg)) return;

  let deleted = 0;
  // Delete cancelled sessions (signups cascade-delete via FK)
  const { data: cancelledSessions } = await supabase.from('sessions').select('id').eq('cancelled', true);
  if (cancelledSessions?.length) {
    await supabase.from('sessions').delete().eq('cancelled', true);
    deleted += cancelledSessions.length;
  }
  // Delete signups with empty name
  const { data: badSignups } = await supabase.from('signups').select('id').eq('name', '');
  if (badSignups?.length) {
    await supabase.from('signups').delete().eq('name', '');
    deleted += badSignups.length;
  }

  sessions.value = sessions.value.filter(s => !s.cancelled);
  const doneMsg = isZh.value ? `完成！已清除 ${deleted} 筆資料。` : `Done! Cleared ${deleted} records.`;
  alert(doneMsg);
}
</script>
