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

      <div class="px-4 pt-4 pb-16">

        <!-- ── 建立新場次 ── -->
        <button @click="showCreateSheet = true" class="w-full mb-3 bg-indigo-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition">
          + {{ isZh ? '建立新場次' : 'New Session' }}
        </button>

        <!-- ── Tab 列 ── -->
        <div class="flex bg-gray-100 rounded-xl p-1 gap-1 mb-4">
          <button @click="setTab('my')"
            :class="['flex-1 text-xs font-semibold py-2 rounded-lg transition',
              activeTab === 'my' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']">
            🏃 {{ isZh ? '我的開場' : 'My' }}
          </button>
          <button @click="setTab('templates')"
            :class="['flex-1 text-xs font-semibold py-2 rounded-lg transition',
              activeTab === 'templates' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']">
            📑 {{ isZh ? '我的範本' : 'Templates' }}
          </button>
          <button v-if="isAdmin()" @click="setTab('all')"
            :class="['flex-1 text-xs font-semibold py-2 rounded-lg transition',
              activeTab === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']">
            📋 {{ isZh ? '所有開場' : 'All' }}
          </button>
          <button v-if="isAdmin()" @click="setTab('feedback')"
            :class="['flex-1 text-xs font-semibold py-2 rounded-lg transition relative',
              activeTab === 'feedback' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']">
            💬 {{ isZh ? '意見回覆' : 'Feedback' }}
            <span v-if="pendingFbCount" class="absolute top-0.5 right-0.5 text-[9px] bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">{{ pendingFbCount }}</span>
          </button>
        </div>

        <!-- ── 我的開場 ── -->
        <div v-if="activeTab === 'my'">
          <div class="flex gap-1.5 mb-1.5 overflow-x-auto pb-1">
            <button v-for="f in statusFilters" :key="f.key" @click="statusFilter = f.key"
              :class="statusFilter === f.key ? 'text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 text-white transition shrink-0' : 'text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 transition shrink-0'">
              {{ f.label }}
            </button>
          </div>
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
          <div v-if="loading" class="space-y-4">
            <div v-for="i in 2" :key="i" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div class="skeleton h-5 w-2/3 rounded-lg mb-2"></div>
              <div class="skeleton h-3 w-1/4 rounded mb-4"></div>
              <div class="flex gap-2"><div class="skeleton h-7 w-20 rounded-lg"></div><div class="skeleton h-7 w-16 rounded-lg"></div></div>
            </div>
          </div>
          <div v-else-if="!filteredSessions.length" class="text-center py-10 text-gray-400">
            <div class="text-4xl mb-2">📭</div>
            <p class="text-sm">{{ isZh ? '還沒有建立任何場次' : 'No sessions created yet' }}</p>
          </div>
          <div v-else class="space-y-4">
            <MgmtSessionCard v-for="s in filteredSessions" :key="s.id"
              :session="s" :user="user" :is-zh="isZh"
              @toggle-open="toggleOpen" @toggle-private="togglePrivate"
              @delete="deleteSession" @share="shareSession" @edit="openEdit" />
          </div>
        </div>

        <!-- ── 我的範本 ── -->
        <div v-else-if="activeTab === 'templates'">
          <div v-if="templatesLoading" class="flex justify-center py-8"><div class="text-3xl animate-bounce">🏐</div></div>
          <div v-else-if="!templates.length" class="text-center py-10 text-gray-400">
            <div class="text-4xl mb-2">📭</div>
            <p class="text-sm">{{ isZh ? '還沒有儲存任何範本' : 'No templates saved yet' }}</p>
            <p class="text-xs text-gray-300 mt-1">{{ isZh ? '建立場次時可儲存為範本' : 'Save a template when creating a session' }}</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="tpl in templates" :key="tpl.id" class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-gray-800 text-sm truncate">{{ tpl.name }}</p>
                  <div class="text-xs text-gray-400 mt-0.5 space-y-0.5">
                    <div v-if="tpl.data?.location">📍 {{ tpl.data.location }}</div>
                    <div v-if="tpl.data?.limit">👥 {{ tpl.data.limit }}{{ isZh ? '人' : '' }}
                      <span v-if="tpl.data.type === 'mixed' && (tpl.data.maleLimit || tpl.data.femaleLimit)"> (♂{{ tpl.data.maleLimit || 0 }} ♀{{ tpl.data.femaleLimit || 0 }})</span>
                    </div>
                    <div v-if="tpl.data?.type">🏷️ {{ tpl.data.type === 'mixed' ? (isZh ? '混排' : 'Mixed') : tpl.data.type === 'male' ? (isZh ? '男生' : 'Male') : (isZh ? '女生' : 'Female') }}</div>
                  </div>
                </div>
                <div class="flex gap-1.5 shrink-0">
                  <button @click="loadTemplateCreate(tpl)"
                    class="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition font-medium">
                    {{ isZh ? '使用' : 'Use' }}
                  </button>
                  <button @click="editTemplate(tpl)"
                    class="text-xs px-2 py-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition">
                    ✏️
                  </button>
                  <button @click="deleteTemplate(tpl.id)"
                    class="text-xs px-2 py-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 所有開場 (admin) ── -->
        <div v-else-if="activeTab === 'all'">
          <div class="flex gap-1.5 mb-2 overflow-x-auto pb-1">
            <button v-for="f in adminFilters" :key="f.key" @click="adminFilter = f.key"
              :class="['text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition shrink-0',
                adminFilter === f.key ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50']">
              {{ f.label }}
            </button>
          </div>
          <div v-if="allSessionsLoading" class="flex justify-center py-8"><div class="text-3xl animate-bounce">🏐</div></div>
          <div v-else-if="!filteredAllSessions.length" class="text-center py-8 text-gray-400 text-sm">
            <div class="text-3xl mb-2">📭</div>{{ isZh ? '沒有符合條件的場次' : 'No matching sessions' }}
          </div>
          <div v-else class="space-y-3">
            <MgmtSessionCard v-for="s in filteredAllSessions" :key="s.id"
              :session="s" :user="user" :is-zh="isZh"
              @toggle-open="toggleOpen" @toggle-private="togglePrivate"
              @delete="deleteSession" @share="shareSession" @edit="openEdit" />
          </div>
        </div>

        <!-- ── 意見回覆 (admin) ── -->
        <div v-else-if="activeTab === 'feedback'">
          <!-- Filter + sort -->
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

          <!-- Bulk action bar -->
          <div v-if="selectedFbIds.size" class="sticky top-0 z-20 bg-indigo-600 text-white rounded-xl px-4 py-2.5 mb-3 flex items-center gap-2 flex-wrap shadow-lg">
            <span class="text-xs font-semibold">{{ isZh ? `已選 ${selectedFbIds.size} 筆` : `${selectedFbIds.size} selected` }}</span>
            <button @click="bulkMoveFb('pending')" class="text-xs px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition">{{ isZh ? '待處理' : 'Pending' }}</button>
            <button @click="bulkMoveFb('in_progress')" class="text-xs px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition">{{ isZh ? '處理中' : 'In Progress' }}</button>
            <button @click="bulkMoveFb('done')" class="text-xs px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition">{{ isZh ? '已處理' : 'Done' }}</button>
            <button @click="bulkDeleteFb" class="text-xs px-2.5 py-1 rounded-lg bg-red-400/80 hover:bg-red-400 transition">🗑️ {{ isZh ? '刪除' : 'Delete' }}</button>
            <button @click="selectedFbIds = new Set()" class="ml-auto text-xs text-white/70 hover:text-white transition">✕</button>
          </div>

          <div v-if="feedbackLoading" class="text-center py-8 text-gray-400 text-sm animate-pulse">{{ isZh ? '載入中…' : 'Loading…' }}</div>
          <div v-else-if="!filteredFeedback.length" class="text-center py-8 text-gray-400">
            <div class="text-3xl mb-2">📭</div><p class="text-sm">{{ isZh ? '沒有符合條件的回饋' : 'No feedback in this category' }}</p>
          </div>
          <div v-else class="space-y-3 pb-4">
            <div v-for="fb in filteredFeedback" :key="fb.id"
              :class="['bg-white rounded-xl border shadow-sm p-4 transition cursor-pointer',
                selectedFbIds.has(fb.id) ? 'border-indigo-400 ring-2 ring-indigo-200' :
                (fb.status||'pending')==='done'?'border-green-100 opacity-70':(fb.status||'pending')==='in_progress'?'border-amber-200':'border-gray-100']"
              @click.self="toggleFbSelect(fb.id)">
              <div class="flex justify-between items-start gap-2 mb-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <input type="checkbox" :checked="selectedFbIds.has(fb.id)" @change="toggleFbSelect(fb.id)"
                    class="w-4 h-4 rounded accent-indigo-600 shrink-0" @click.stop />
                  <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', fb.type==='bug'?'bg-red-100 text-red-600':fb.type==='idea'?'bg-blue-100 text-blue-600':'bg-gray-100 text-gray-500']">
                    {{ fb.type==='bug'?(isZh?'🐛 問題':'Bug'):fb.type==='idea'?(isZh?'💡 建議':'Idea'):(isZh?'📝 其他':'Other') }}
                  </span>
                  <span :class="['text-xs px-2 py-0.5 rounded-full', fb.urgency==='high'?'bg-red-50 text-red-500':fb.urgency==='medium'?'bg-amber-50 text-amber-500':'bg-gray-50 text-gray-400']">
                    {{ fb.urgency==='high'?(isZh?'⚠️ 高':'High'):fb.urgency==='medium'?(isZh?'⚡ 中':'Med'):(isZh?'低':'Low') }}
                  </span>
                  <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', fbStatusClass(fb.status)]">{{ fbStatusLabel(fb.status) }}</span>
                </div>
                <span class="text-xs text-gray-300 shrink-0">{{ fmtDate(fb.created_at) }}</span>
              </div>
              <p class="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{{ fb.description }}</p>
              <p v-if="fb.email" class="text-xs text-indigo-500 mt-1.5">📧 {{ fb.email }}</p>
              <!-- Actions -->
              <div class="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-50 flex-wrap">
                <button v-if="(fb.status||'pending') !== 'pending'" @click.stop="updateFbStatus(fb.id, 'pending')"
                  class="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                  {{ isZh ? '待處理' : 'Pending' }}
                </button>
                <button v-if="(fb.status||'pending') !== 'in_progress'" @click.stop="updateFbStatus(fb.id, 'in_progress')"
                  class="text-xs px-2.5 py-1 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 transition">
                  {{ isZh ? '處理中' : 'In Progress' }}
                </button>
                <button v-if="(fb.status||'pending') !== 'done'" @click.stop="updateFbStatus(fb.id, 'done')"
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

      </div>
    </div>

    <!-- Create / Edit session sheet -->
    <CreateSessionSheet
      v-if="showCreateSheet"
      :editSession="editingSession"
      :preloadData="templatePreload"
      :editTemplate="editingTemplate"
      @close="showCreateSheet = false; editingSession = null; templatePreload = null; editingTemplate = null"
      @created="onSessionCreated"
      @updated="onSessionUpdated"
      @templateUpdated="onTemplateUpdated"
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
import { supabase, ogShareUrl } from '@/lib/supabase.js';
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
const templatePreload = ref(null);
const editingTemplate = ref(null);

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
    id: row.id, title: row.title, date: row.date, time: row.time, endTime: row.end_time || '',
    location: row.location, venue: row.venue, venueCost: row.venue_cost || 0, type: row.type || '',
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
  const myName = user.value.user_metadata?.full_name || user.value.user_metadata?.name || '';
  // Only show sessions I created where creator_name matches mine (or is unset)
  // This excludes sessions created under a different name (e.g. test sessions)
  const { data } = await supabase.from('sessions').select('*')
    .eq('created_by', uid);
  sessions.value = (data || [])
    .filter(s => !myName || !s.creator_name || s.creator_name === myName)
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

function patchLocalSession(sessionId, fields) {
  const patch = s => s.id === sessionId ? { ...s, ...fields } : s;
  sessions.value = sessions.value.map(patch);
  allSessions.value = allSessions.value.map(patch);
}

async function toggleOpen(sessionId, currentIsOpen) {
  const { error } = await supabase.from('sessions').update({ is_open: !currentIsOpen }).eq('id', sessionId);
  if (!error) patchLocalSession(sessionId, { isOpen: !currentIsOpen });
}

async function togglePrivate(sessionId, currentIsPrivate) {
  const { error } = await supabase.from('sessions').update({ is_private: !currentIsPrivate }).eq('id', sessionId);
  if (!error) patchLocalSession(sessionId, { isPrivate: !currentIsPrivate });
}

async function deleteSession(sessionId) {
  const msg = isZh.value ? '確定刪除此場次？此操作無法恢復！' : 'Delete this session? This cannot be undone!';
  if (!confirm(msg)) return;
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
  if (error) {
    alert(isZh.value ? `刪除失敗：${error.message}` : `Delete failed: ${error.message}`);
  } else {
    sessions.value = sessions.value.filter(s => s.id !== sessionId);
    allSessions.value = allSessions.value.filter(s => s.id !== sessionId);
  }
}

function onSessionCreated() {
  showCreateSheet.value = false;
  editingSession.value = null;
}
function onSessionUpdated() {
  showCreateSheet.value = false;
  editingSession.value = null;
  loadSessions();
  allSessions.value = [];
  if (activeTab.value === 'all') setTab('all');
}

const shareUrl = ref('');
const copiedShare = ref(false);
function shareSession(sessionId) {
  shareUrl.value = ogShareUrl(sessionId);
  copiedShare.value = false;
  navigator.clipboard.writeText(shareUrl.value).catch(() => {});
}
async function copyShare() {
  await navigator.clipboard.writeText(shareUrl.value);
  copiedShare.value = true;
  setTimeout(() => { copiedShare.value = false; }, 2000);
}

// ── Tab state ──
const activeTab = ref('my');

async function setTab(tab) {
  activeTab.value = tab;
  if (tab === 'all' && !allSessions.value.length) {
    allSessionsLoading.value = true;
    const { data } = await supabase.from('sessions').select('*').order('date', { ascending: false });
    allSessions.value = (data || []).map(mapSession);
    allSessionsLoading.value = false;
  }
  if (tab === 'feedback' && !feedbackList.value.length) {
    feedbackLoading.value = true;
    const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
    feedbackList.value = data || [];
    feedbackLoading.value = false;
  }
  if (tab === 'templates') await loadTemplates();
}

// ── Admin: 所有開場 ──
const allSessions = ref([]);
const allSessionsLoading = ref(false);
const adminFilter = ref('all');

const adminFilters = computed(() => [
  { key: 'all', label: isZh.value ? '全部' : 'All' },
  { key: 'open', label: isZh.value ? '報名中' : 'Open' },
  { key: 'closed', label: isZh.value ? '已關閉' : 'Closed' },
  { key: 'past', label: isZh.value ? '過去' : 'Past' },
]);

const filteredAllSessions = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();
  return allSessions.value.filter(s => {
    const isPast = (s.date || '') < today;
    const closeAtMs = s.closeAt ? new Date(s.closeAt).getTime() : null;
    const effectivelyClosed = !s.isOpen || (closeAtMs && closeAtMs < now);
    if (adminFilter.value === 'all') return true;
    if (adminFilter.value === 'past') return isPast;
    if (adminFilter.value === 'open') return !isPast && !effectivelyClosed;
    if (adminFilter.value === 'closed') return !isPast && effectivelyClosed;
    return true;
  });
});

// ── Admin: 意見回覆 ──
const feedbackList = ref([]);
const feedbackLoading = ref(false);
const fbFilter = ref('pending');
const fbSort = ref('created_at');
const selectedFbIds = ref(new Set());

const URGENCY_ORDER = { high: 0, medium: 1, low: 2 };
const TYPE_ORDER = { bug: 0, idea: 1, other: 2 };

const pendingFbCount = computed(() => feedbackList.value.filter(f => (f.status || 'pending') === 'pending').length);

const filteredFeedback = computed(() => {
  let list = [...feedbackList.value];
  if (fbFilter.value !== 'all') {
    const key = fbFilter.value;
    list = list.filter(f => (f.status || 'pending') === key);
  }
  if (fbSort.value === 'urgency') list.sort((a, b) => (URGENCY_ORDER[a.urgency] ?? 3) - (URGENCY_ORDER[b.urgency] ?? 3));
  else if (fbSort.value === 'type') list.sort((a, b) => (TYPE_ORDER[a.type] ?? 3) - (TYPE_ORDER[b.type] ?? 3));
  else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list;
});

const fbFilters = computed(() => [
  { key: 'pending',     label: isZh.value ? '尚未處理' : 'Pending' },
  { key: 'in_progress', label: isZh.value ? '處理中' : 'In Progress' },
  { key: 'done',        label: isZh.value ? '已處理' : 'Done' },
  { key: 'all',         label: isZh.value ? '全部' : 'All' },
]);

function fbStatusLabel(status) {
  const s = status || 'pending';
  if (!isZh.value) return s === 'done' ? 'Done' : s === 'in_progress' ? 'In Progress' : 'Pending';
  return s === 'done' ? '✅ 已處理' : s === 'in_progress' ? '⏳ 處理中' : '🔴 待處理';
}
function fbStatusClass(status) {
  const s = status || 'pending';
  return s === 'done' ? 'bg-green-100 text-green-600' : s === 'in_progress' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-500';
}

async function updateFbStatus(id, status) {
  await supabase.from('feedback').update({ status }).eq('id', id);
  const fb = feedbackList.value.find(f => f.id === id);
  if (fb) fb.status = status;
}

async function deleteFb(id) {
  if (!confirm(isZh.value ? '確定刪除此回饋？' : 'Delete this feedback?')) return;
  const { error } = await supabase.from('feedback').delete().eq('id', id);
  if (error) { alert(isZh.value ? `刪除失敗：${error.message}` : `Delete failed: ${error.message}`); return; }
  feedbackList.value = feedbackList.value.filter(f => f.id !== id);
  selectedFbIds.value.delete(id);
}

function toggleFbSelect(id) {
  const s = new Set(selectedFbIds.value);
  s.has(id) ? s.delete(id) : s.add(id);
  selectedFbIds.value = s;
}

async function bulkMoveFb(status) {
  const ids = [...selectedFbIds.value];
  if (!ids.length) return;
  const { error } = await supabase.from('feedback').update({ status }).in('id', ids);
  if (error) { alert(isZh.value ? `更新失敗：${error.message}` : `Update failed: ${error.message}`); return; }
  feedbackList.value.forEach(f => { if (ids.includes(f.id)) f.status = status; });
  selectedFbIds.value = new Set();
}

async function bulkDeleteFb() {
  const ids = [...selectedFbIds.value];
  if (!ids.length) return;
  const msg = isZh.value ? `確定刪除這 ${ids.length} 筆回饋？` : `Delete ${ids.length} feedback items?`;
  if (!confirm(msg)) return;
  const { error } = await supabase.from('feedback').delete().in('id', ids);
  if (error) { alert(isZh.value ? `刪除失敗：${error.message}` : `Delete failed: ${error.message}`); return; }
  feedbackList.value = feedbackList.value.filter(f => !ids.includes(f.id));
  selectedFbIds.value = new Set();
}

// ── 我的範本 ──
const templates = ref([]);
const templatesLoading = ref(false);

async function loadTemplates() {
  if (!user.value) return;
  templatesLoading.value = true;
  const { data } = await supabase.from('templates').select('*')
    .eq('user_id', user.value.id).order('created_at', { ascending: false });
  templates.value = data || [];
  templatesLoading.value = false;
}

function loadTemplateCreate(tpl) {
  editingSession.value = null;
  editingTemplate.value = null;
  templatePreload.value = tpl.data;
  showCreateSheet.value = true;
}

function editTemplate(tpl) {
  editingSession.value = null;
  templatePreload.value = null;
  editingTemplate.value = tpl;
  showCreateSheet.value = true;
}

async function onTemplateUpdated() {
  showCreateSheet.value = false;
  editingTemplate.value = null;
  await loadTemplates();
}

async function deleteTemplate(id) {
  const msg = isZh.value ? '確定刪除此範本？' : 'Delete this template?';
  if (!confirm(msg)) return;
  await supabase.from('templates').delete().eq('id', id);
  templates.value = templates.value.filter(t => t.id !== id);
}

function openEdit(session) {
  editingSession.value = session;
  showCreateSheet.value = true;
}

function fmtDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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
