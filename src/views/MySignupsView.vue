<template>
  <div class="min-h-screen bg-gray-50 pb-24">
    <!-- Loading -->
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
        <h1 class="text-xl font-bold text-gray-800 mb-1">{{ isZh ? '我的報名' : 'My Sign-ups' }}</h1>
        <p class="text-sm text-gray-400 mb-6">{{ isZh ? '請先登入' : 'Please sign in' }}</p>
        <button @click="signInWithGoogle"
          class="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition">
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
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <RouterLink to="/" class="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition shadow-sm shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </RouterLink>
            <h1 class="text-xl font-bold text-gray-800">✅ {{ isZh ? '我的報名' : 'My Sign-ups' }}</h1>
          </div>
          <div class="flex items-center gap-2">
            <button @click="toggleLang" class="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition shadow-sm">
              {{ lang === 'zh' ? 'EN' : '中' }}
            </button>
            <div class="flex items-center gap-2">
              <img v-if="photoURL" :src="photoURL" referrerpolicy="no-referrer" class="w-8 h-8 rounded-full border border-gray-200 shrink-0" alt="" onerror="this.style.display='none'" />
              <div class="flex flex-col items-start gap-0.5">
                <p class="text-xs font-medium text-gray-700 max-w-[80px] truncate leading-none">{{ displayName }}</p>
                <button @click="signOut" class="text-[11px] text-gray-400 hover:text-red-400 transition leading-none">{{ isZh ? '登出' : 'Logout' }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sub tabs: waitlist / confirmed / past -->
        <div class="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button v-for="tab in subTabs" :key="tab.key" @click="subTab = tab.key"
            :class="subTab === tab.key ? tab.activeClass : 'flex-1 text-xs font-medium py-1.5 rounded-lg transition text-gray-500 hover:text-gray-700'">
            {{ tab.label }}
          </button>
        </div>

        <!-- Sort -->
        <div class="flex justify-end gap-1.5 mt-2">
          <select v-model="sortType" class="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-300">
            <option value="date">{{ isZh ? '📅 日期' : '📅 Date' }}</option>
            <option value="signedAt">{{ isZh ? '⏱️ 報名時間' : '⏱️ Signed At' }}</option>
          </select>
          <select v-model="sortDir" class="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-300">
            <option value="asc">{{ isZh ? '近→遠' : 'Near→Far' }}</option>
            <option value="desc">{{ isZh ? '遠→近' : 'Far→Near' }}</option>
          </select>
        </div>
      </div>

      <!-- Content -->
      <div class="px-4 pt-4">
        <!-- Skeleton -->
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 2" :key="i" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div class="skeleton h-5 w-2/3 rounded-lg mb-2"></div>
            <div class="skeleton h-3 w-1/3 rounded mb-4"></div>
            <div class="skeleton h-3 w-1/2 rounded mb-2"></div>
            <div class="skeleton h-9 w-full rounded-xl"></div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!filteredItems.length" class="text-center py-12 text-gray-400">
          <div class="text-5xl mb-3">📋</div>
          <p class="text-sm font-medium">{{ isZh ? '這裡沒有報名記錄' : 'No sign-ups here' }}</p>
          <RouterLink to="/" class="mt-4 inline-block text-sm text-indigo-500 hover:underline">
            {{ isZh ? '去報名 →' : 'Browse sessions →' }}
          </RouterLink>
        </div>

        <!-- Cards -->
        <div v-else class="space-y-4">
          <MySignupCard
            v-for="group in filteredItems"
            :key="group.sessionId"
            :item="group"
            :is-zh="isZh"
            @cancel="cancelSignup"
            @share="shareSession"
            @edit="openEditSignup"
          />
        </div>
      </div>
    </div>

    <!-- Edit signup modal -->
    <Teleport to="body">
      <SignupModal
        v-if="showEditModal && editSession"
        :session="editSession"
        :signups="[]"
        :edit-signup="editSignupData"
        @close="closeEditModal"
        @submitted="closeEditModal"
      />
    </Teleport>

    <!-- Share modal -->
    <div v-if="shareUrl" class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center px-4" @click.self="shareUrl = ''">
      <div class="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div class="text-center mb-4">
          <div class="text-4xl mb-2">🔗</div>
          <h3 class="text-lg font-bold text-gray-800 mb-1">{{ isZh ? '分享活動連結' : 'Share Link' }}</h3>
          <p class="text-sm text-gray-500">{{ copiedShare ? (isZh ? '✅ 連結已複製！' : '✅ Copied!') : (isZh ? '複製以下連結讓大家報名' : 'Copy the link below') }}</p>
        </div>
        <div class="bg-gray-50 rounded-xl px-4 py-3 mb-4 overflow-x-auto">
          <p class="text-xs text-indigo-600 break-all font-mono select-all">{{ shareUrl }}</p>
        </div>
        <button @click="copyShare" class="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition mb-2">
          {{ copiedShare ? (isZh ? '✅ 已複製！' : '✅ Copied!') : (isZh ? '📋 複製連結' : '📋 Copy Link') }}
        </button>
        <button @click="shareUrl = ''" class="w-full bg-gray-100 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-200 transition">
          {{ isZh ? '關閉' : 'Close' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useI18n } from '@/lib/i18n.js';
import { useAuth } from '@/composables/useAuth.js';
import { supabase } from '@/lib/supabase.js';
import MySignupCard from '@/components/MySignupCard.vue';
import SignupModal from '@/components/SignupModal.vue';

const { lang, setLang } = useI18n();
const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();

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

// Tabs
const subTab = ref('confirmed');
const sortType = ref('date');
const sortDir = ref('asc');

const subTabs = computed(() => [
  { key: 'waitlist', label: isZh.value ? '⏳ 候補' : '⏳ Waitlist', activeClass: 'flex-1 text-xs font-medium py-1.5 rounded-lg transition bg-orange-100 text-orange-600 shadow-sm font-semibold' },
  { key: 'confirmed', label: isZh.value ? '✅ 確認' : '✅ Confirmed', activeClass: 'flex-1 text-xs font-medium py-1.5 rounded-lg transition bg-indigo-100 text-indigo-700 shadow-sm font-semibold' },
  { key: 'past', label: isZh.value ? '📅 過去' : '📅 Past', activeClass: 'flex-1 text-xs font-medium py-1.5 rounded-lg transition bg-gray-200 text-gray-700 shadow-sm font-semibold' },
]);

// Data
const loading = ref(true);
const mySignups = ref([]);
let signupsChannel = null;

async function mapSession(row) {
  return {
    id: row.id, title: row.title, date: row.date, time: row.time,
    location: row.location, venue: row.venue, type: row.type || '',
    limit: row.limit_total || 0, maleLimit: row.male_limit || 0, femaleLimit: row.female_limit || 0,
    isOpen: row.is_open, isPrivate: row.is_private, cancelled: row.cancelled,
    openAt: row.open_at, closeAt: row.close_at,
    createdBy: row.created_by, creatorName: row.creator_name, creatorPhoto: row.creator_photo,
    equipment: row.equipment || [],
  };
}

async function fetchMySignups() {
  if (!user.value) return;
  try {
    const { data: raw } = await supabase
      .from('signups').select('*').eq('uid', user.value.id).order('signed_at', { ascending: false });
    if (!raw?.length) { mySignups.value = []; loading.value = false; return; }

    const sessionIds = [...new Set(raw.map(s => s.session_id))];
    const { data: sessionsRaw } = await supabase.from('sessions').select('*').in('id', sessionIds);
    const sessionsMap = Object.fromEntries(
      await Promise.all((sessionsRaw || []).map(async s => [s.id, await mapSession(s)]))
    );

    // For sessions with limits, fetch all signups to compute position
    const limitedSessionIds = (sessionsRaw || [])
      .filter(s => s.limit_total > 0 || s.male_limit > 0 || s.female_limit > 0)
      .map(s => s.id);
    const allSignupsMap = {};
    await Promise.all(limitedSessionIds.map(async (sid) => {
      const { data } = await supabase.from('signups').select('id,gender,force_confirmed,force_waitlisted,signed_at')
        .eq('session_id', sid).order('signed_at', { ascending: true });
      allSignupsMap[sid] = data || [];
    }));

    mySignups.value = raw.map(row => {
      const sess = sessionsMap[row.session_id] || null;
      let isWaitlisted = !row.force_confirmed && !!row.force_waitlisted;
      let waitlistPosition = 0;
      let waitlistGender = null;

      if (!row.force_confirmed && !row.force_waitlisted && sess) {
        const { limit: totalLimit, maleLimit, femaleLimit } = sess;
        const hasMixedLimits = maleLimit > 0 || femaleLimit > 0;
        const allSigs = allSignupsMap[row.session_id];
        if (allSigs) {
          if (hasMixedLimits) {
            const g = row.gender;
            if (g === 'male' || g === 'female') {
              const gLimit = g === 'male' ? maleLimit : femaleLimit;
              if (gLimit > 0) {
                const gSigs = allSigs.filter(s => s.gender === g);
                const gPos = gSigs.findIndex(s => s.id === row.id) + 1;
                if (gPos > 0 && gPos > gLimit) {
                  isWaitlisted = true; waitlistPosition = gPos - gLimit; waitlistGender = g;
                }
              }
            }
          }
          if (!isWaitlisted && totalLimit > 0) {
            const pos = allSigs.findIndex(s => s.id === row.id) + 1;
            if (pos > 0 && pos > totalLimit) { isWaitlisted = true; waitlistPosition = pos - totalLimit; }
          }
        }
      }

      return {
        id: row.id, sessionId: row.session_id, uid: row.uid, name: row.name,
        isLate: row.is_late, lateTime: row.late_minutes,
        forFriend: row.friend_name || '', pairWith: row.pair, bringEquip: row.bring_equip || [],
        gender: row.gender || '', signedAt: row.signed_at,
        session: sess, isWaitlisted, waitlistPosition, waitlistGender,
      };
    });
  } finally {
    loading.value = false;
  }
}

// Watch auth and (re)load
import { watch } from 'vue';
watch(user, (u) => {
  if (u) {
    loading.value = true;
    fetchMySignups();
    if (signupsChannel) supabase.removeChannel(signupsChannel);
    signupsChannel = supabase.channel('user-signups-' + u.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signups', filter: `uid=eq.${u.id}` }, fetchMySignups)
      .subscribe();
  } else {
    mySignups.value = [];
    if (signupsChannel) { supabase.removeChannel(signupsChannel); signupsChannel = null; }
  }
}, { immediate: true });

onUnmounted(() => { if (signupsChannel) supabase.removeChannel(signupsChannel); });

// Group signups by session
const groupedSignups = computed(() => {
  const map = new Map();
  for (const s of mySignups.value) {
    if (!map.has(s.sessionId)) {
      map.set(s.sessionId, { sessionId: s.sessionId, session: s.session, signups: [] });
    }
    map.get(s.sessionId).signups.push(s);
  }
  return [...map.values()];
});

// Filtered & sorted
const filteredItems = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  let groups = groupedSignups.value;

  if (subTab.value === 'waitlist') {
    // Sessions where at least one signup is waitlisted (and not yet past)
    groups = groups.filter(g =>
      (g.session?.date || '') >= today && g.signups.some(s => s.isWaitlisted)
    );
  } else if (subTab.value === 'confirmed') {
    // Sessions where at least one signup is confirmed (and not yet past)
    groups = groups.filter(g =>
      (g.session?.date || '') >= today && g.signups.some(s => !s.isWaitlisted)
    );
  } else {
    groups = groups.filter(g => (g.session?.date || '') < today);
  }

  const desc = sortDir.value === 'desc';
  if (sortType.value === 'signedAt') {
    groups = [...groups].sort((a, b) => {
      const aMs = Math.max(...a.signups.map(s => s.signedAt ? new Date(s.signedAt).getTime() : 0));
      const bMs = Math.max(...b.signups.map(s => s.signedAt ? new Date(s.signedAt).getTime() : 0));
      return desc ? bMs - aMs : aMs - bMs;
    });
  } else {
    groups = [...groups].sort((a, b) => {
      const ad = a.session?.date || '';
      const bd = b.session?.date || '';
      return desc ? bd.localeCompare(ad) : ad.localeCompare(bd);
    });
  }
  return groups;
});

// Edit signup
const showEditModal = ref(false);
const editSignupData = ref(null);
const editSession = ref(null);

function openEditSignup(signup) {
  editSignupData.value = signup;
  editSession.value = signup.session;
  showEditModal.value = true;
}
function closeEditModal() {
  showEditModal.value = false;
  editSignupData.value = null;
  editSession.value = null;
}

// Cancel
async function cancelSignup({ signupId }) {
  const msg = isZh.value ? '確定要取消報名？' : 'Cancel your signup?';
  if (!confirm(msg)) return;
  const { error } = await supabase.from('signups').delete().eq('id', signupId);
  if (error) alert((isZh.value ? '取消失敗：' : 'Failed: ') + error.message);
}

// Share
const shareUrl = ref('');
const copiedShare = ref(false);
function shareSession({ sessionId }) {
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
