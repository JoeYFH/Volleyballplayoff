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
      <SessionCard
        v-for="session in filteredSessions"
        :id="`card-${session.id}`"
        :key="session.id"
        :session="session"
        :user="user"
        :is-admin="isAdmin()"
        :is-zh="isZh"
        @signup="openSignupModal"
        @share="shareSession"
        @edit-signup="openEditSignupModal"
      />
    </div>

    <FabMenu :user="user" :is-zh="isZh" @create="showCreateSheet = true" @feedback="showFeedback = true" />

    <!-- Create session sheet -->
    <CreateSessionSheet
      v-if="showCreateSheet"
      @close="showCreateSheet = false"
      @created="showCreateSheet = false"
    />

    <!-- Share modal -->
    <div v-if="shareUrl" class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center px-4" @click.self="shareUrl = ''">
      <div class="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <h3 class="font-bold text-gray-800 mb-4">{{ isZh ? '分享活動連結' : 'Share Link' }}</h3>
        <input :value="shareUrl" readonly class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 mb-3" />
        <button @click="copyShareUrl" class="w-full bg-indigo-600 text-white rounded-xl py-2.5 font-semibold text-sm mb-2">
          {{ copiedShare ? (isZh ? '✅ 已複製！' : '✅ Copied!') : (isZh ? '📋 複製連結' : '📋 Copy Link') }}
        </button>
        <button @click="shareUrl = ''" class="w-full text-gray-400 text-sm py-1">{{ isZh ? '關閉' : 'Close' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import AppHeader from '@/components/AppHeader.vue';
import FilterBar from '@/components/FilterBar.vue';
import SessionCard from '@/components/SessionCard.vue';
import FabMenu from '@/components/FabMenu.vue';
import CreateSessionSheet from '@/components/CreateSessionSheet.vue';
import { useAuth } from '@/composables/useAuth.js';
import { useSessions } from '@/composables/useSessions.js';
import { useI18n } from '@/lib/i18n.js';

const { user, isAdmin } = useAuth();
const { sessions, loading } = useSessions();
const { lang } = useI18n();
const isZh = computed(() => lang.value === 'zh');

// Filters
const statusFilter = ref('open');
const genderFilter = ref('all');
const sortType = ref('date');
const sortDir  = ref('asc');

const filteredSessions = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();
  const urlSessionId = new URLSearchParams(window.location.search).get('session');

  let list = sessions.value.filter(s => {
    if (s.cancelled) return false;
    if (s.isPrivate && s.id !== urlSessionId) return false;
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
const shareUrl = ref('');
const copiedShare = ref(false);
function shareSession(session) {
  shareUrl.value = `${location.origin}/?session=${session.id}`;
  copiedShare.value = false;
  navigator.clipboard.writeText(shareUrl.value).catch(() => {});
}
async function copyShareUrl() {
  await navigator.clipboard.writeText(shareUrl.value);
  copiedShare.value = true;
  setTimeout(() => { copiedShare.value = false; }, 2000);
}
</script>
