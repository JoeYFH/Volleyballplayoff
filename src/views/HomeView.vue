<template>
  <div class="min-h-screen bg-gray-50 pb-24">
    <AppHeader />

    <div class="max-w-2xl mx-auto px-4 pt-0">
      <FilterBar
        v-model:statusFilter="statusFilter"
        v-model:genderFilter="genderFilter"
        v-model:sortType="sortType"
        v-model:sortDir="sortDir"
      />
    </div>

    <!-- Loading spinner -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="text-4xl animate-bounce">🏐</div>
    </div>

    <!-- Sessions list -->
    <div v-else class="max-w-2xl mx-auto px-4 pt-4 space-y-4">
      <div v-if="!filteredSessions.length" class="text-center py-10 text-gray-400">
        <div class="text-4xl mb-3">📭</div>
        <p>{{ isZh ? '目前沒有即將舉行的場次' : 'No upcoming sessions' }}</p>
      </div>
      <div v-for="session in filteredSessions" :id="`card-${session.id}`" :key="session.id">
      <SessionCard
        :session="session"
        :user="user"
        :is-admin="isAdmin()"
        :is-zh="isZh"
        :auto-open-signup="session.id === urlSessionId"
        @signup="openSignupModal"
        @share="shareSession"
        @edit-signup="openEditSignupModal"
      />
      </div>
    </div>

    <FabMenu :user="user" :is-zh="isZh" @create="showCreateSheet = true" @feedback="showFeedback = true" />

    <!-- Create session sheet -->
    <CreateSessionSheet
      v-if="showCreateSheet"
      @close="showCreateSheet = false"
      @created="showCreateSheet = false"
    />

    <!-- Feedback modal -->
    <FeedbackModal v-if="showFeedback" :is-zh="isZh" @close="showFeedback = false" />

    <!-- Copy toast -->
    <Transition enter-from-class="opacity-0 translate-y-2" enter-active-class="transition duration-200" leave-to-class="opacity-0 translate-y-2" leave-active-class="transition duration-200">
      <div v-if="copiedShare" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg">
        ✅ {{ isZh ? '已複製連結！' : 'Link copied!' }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import FilterBar from '@/components/FilterBar.vue';
import SessionCard from '@/components/SessionCard.vue';
import FabMenu from '@/components/FabMenu.vue';
import CreateSessionSheet from '@/components/CreateSessionSheet.vue';
import FeedbackModal from '@/components/FeedbackModal.vue';
import { useAuth } from '@/composables/useAuth.js';
import { useSessions } from '@/composables/useSessions.js';
import { useI18n } from '@/lib/i18n.js';
import { ogShareUrl } from '@/lib/supabase.js';

const { user, isAdmin } = useAuth();
const { sessions, loading } = useSessions();
const { lang } = useI18n();
const isZh = computed(() => lang.value === 'zh');

// 從 URL 讀取 session 參數（讀完後會替換地址欄為 /og/SESSION_ID）
const urlSessionId = ref(new URLSearchParams(window.location.search).get('session'));

onMounted(() => {
  if (urlSessionId.value) {
    const tryScroll = () => {
      const el = document.getElementById(`card-${urlSessionId.value}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    tryScroll();
    // sessions 可能還沒載入，等載入後再 scroll
    const stop = watch(loading, (v) => {
      if (!v) { tryScroll(); stop(); }
    });
  }
});

// Filters
const statusFilter = ref('open');
const genderFilter = ref('all');
const sortType = ref('date');
const sortDir  = ref('asc');

const filteredSessions = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();

  let list = sessions.value.filter(s => {
    if (s.cancelled) return false;
    if (s.isPrivate && s.id !== urlSessionId.value) return false;
    // 分享連結指定的活動一律顯示，不受篩選器影響
    if (urlSessionId.value && s.id === urlSessionId.value) return true;
    const isPast = (s.date || '') < today;
    const closeAtMs = s.closeAt ? new Date(s.closeAt).getTime() : null;
    const effectivelyClosed = !s.isOpen || (closeAtMs && closeAtMs < now);
    if (statusFilter.value === 'past') return isPast;
    if (statusFilter.value === 'open') return !isPast && !effectivelyClosed;
    return true;
  });

  if (genderFilter.value !== 'all') {
    list = list.filter(s => s.type === genderFilter.value);
  }

  const desc = sortDir.value === 'desc';
  if (sortType.value === 'closeAt') {
    list.sort((a, b) => {
      const aMs = a.closeAt ? new Date(a.closeAt).getTime() : Infinity;
      const bMs = b.closeAt ? new Date(b.closeAt).getTime() : Infinity;
      return desc ? bMs - aMs : aMs - bMs;
    });
  } else {
    list.sort((a, b) => desc
      ? (b.date || '').localeCompare(a.date || '')
      : (a.date || '').localeCompare(b.date || ''));
  }
  return list;
});

function openSignupModal() {}
function openEditSignupModal() {}

// Create session
const showCreateSheet = ref(false);

// Feedback
const showFeedback = ref(false);

// Share
const copiedShare = ref(false);
async function shareSession(session) {
  const url = ogShareUrl(session.id);
  try {
    await navigator.clipboard.writeText(url);
    copiedShare.value = true;
    setTimeout(() => { copiedShare.value = false; }, 2000);
  } catch {
    // Fallback: prompt to copy manually
    window.prompt(isZh.value ? '複製以下連結：' : 'Copy the link:', url);
  }
}
</script>
