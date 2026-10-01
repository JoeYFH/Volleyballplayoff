<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden fade-in">
    <div class="p-4">
      <!-- Title + status -->
      <div class="flex items-start justify-between gap-2 mb-2">
        <div>
          <p class="font-bold text-gray-800">{{ title }}</p>
          <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <img v-if="session.creatorPhoto" :src="session.creatorPhoto" class="w-4 h-4 rounded-full border border-gray-200 shrink-0" alt="" onerror="this.style.display='none'" />
            <p v-if="session.creatorName" class="text-xs text-gray-400">{{ isZh ? '舉辦人' : 'By' }}: {{ session.creatorName }}</p>
            <p v-if="session.createdAt" class="text-xs text-gray-300">· {{ fmtTs(session.createdAt) }}</p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-1 shrink-0">
          <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full', statusBadgeCls]">{{ statusBadgeText }}</span>
          <span v-if="session.isPrivate" class="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">🔒 {{ isZh ? '私人' : 'Private' }}</span>
        </div>
      </div>

      <!-- Session info -->
      <div class="text-sm text-gray-800 space-y-1 mb-3">
        <div class="flex flex-wrap gap-x-4 gap-y-0.5">
          <span v-if="session.date">📅 {{ formatDate(session.date) }}</span>
          <span v-if="session.time">🕐 {{ session.time }}</span>
        </div>
        <div v-if="session.location">
          📍 <a :href="`https://maps.google.com/?q=${encodeURIComponent(session.location)}`" target="_blank" class="text-indigo-500 hover:underline">{{ session.location }}</a>
        </div>
        <div v-if="session.limit">
          👥 {{ isZh ? '名額' : 'Limit' }} {{ session.limit }}
          <span v-if="session.type === 'mixed' && (session.maleLimit || session.femaleLimit)"> (♂{{ session.maleLimit || 0 }} ♀{{ session.femaleLimit || 0 }})</span>
        </div>
        <div v-if="session.type">🏷️ {{ typeLabel }}</div>
        <div v-if="signupTimeHtml" class="text-xs text-gray-500" v-html="signupTimeHtml"></div>
        <div v-if="session.venue" class="text-xs text-gray-500">🏟️ {{ session.venue }}</div>
        <div v-if="session.note" class="mt-1 px-2 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs">📝 {{ isZh ? '備註' : 'Note' }}: {{ session.note }}</div>
      </div>

      <!-- Progress bar -->
      <div v-if="hasMixedLimits" class="mb-3 space-y-1.5">
        <div class="flex justify-between text-xs text-gray-400 mb-0.5">
          <span>{{ isZh ? '報名進度' : 'Progress' }}</span>
          <span>{{ Math.min(signups.length, effectiveLimit) }} / {{ effectiveLimit }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-blue-400 w-5 shrink-0">♂</span>
          <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div :class="['h-2 rounded-full transition-all duration-500', malePct >= 100 ? 'bg-red-400' : 'bg-blue-400']" :style="{ width: Math.min(malePct, 100) + '%' }"></div>
          </div>
          <span class="text-xs text-gray-400 w-10 text-right shrink-0">{{ maleCount }}/{{ session.maleLimit || '?' }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-pink-400 w-5 shrink-0">♀</span>
          <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div :class="['h-2 rounded-full transition-all duration-500', femalePct >= 100 ? 'bg-red-400' : 'bg-pink-400']" :style="{ width: Math.min(femalePct, 100) + '%' }"></div>
          </div>
          <span class="text-xs text-gray-400 w-10 text-right shrink-0">{{ femaleCount }}/{{ session.femaleLimit || '?' }}</span>
        </div>
      </div>
      <div v-else-if="session.limit" class="mb-3">
        <div class="flex justify-between text-xs text-gray-400 mb-1">
          <span>{{ isZh ? '報名進度' : 'Progress' }}</span>
          <span>{{ Math.min(signups.length, session.limit) }} / {{ session.limit }}</span>
        </div>
        <div class="bg-gray-100 rounded-full h-2 overflow-hidden">
          <div :class="['h-2 rounded-full transition-all duration-500', totalPct >= 100 ? 'bg-red-400' : totalPct >= 75 ? 'bg-amber-400' : 'bg-indigo-400']" :style="{ width: Math.min(totalPct, 100) + '%' }"></div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex flex-wrap gap-2">
        <button @click="$emit('toggle-open', session.id, session.isOpen)"
          :class="['text-xs px-3 py-1.5 rounded-lg font-medium transition', session.isOpen ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100']">
          {{ session.isOpen ? (isZh ? '⏸ 暫停報名' : '⏸ Pause') : (isZh ? '▶ 開放報名' : '▶ Open') }}
        </button>
        <button @click="$emit('toggle-private', session.id, session.isPrivate)"
          :class="['text-xs px-3 py-1.5 rounded-lg font-medium transition', session.isPrivate ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100']">
          {{ session.isPrivate ? (isZh ? '🌐 設為公開' : '🌐 Make Public') : (isZh ? '🔒 設為私人' : '🔒 Make Private') }}
        </button>
        <button @click="$emit('share', session.id)"
          class="text-xs px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition">
          🔗 {{ isZh ? '分享連結' : 'Share' }}
        </button>
        <button @click="$emit('delete', session.id)"
          class="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition">
          🗑️ {{ isZh ? '刪除' : 'Delete' }}
        </button>
      </div>
    </div>

    <!-- Signup list -->
    <div class="border-t border-gray-50 px-4 py-3">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs font-semibold text-gray-500">{{ isZh ? '報名名單' : 'Sign-ups' }}</p>
        <span class="text-xs bg-indigo-100 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">{{ signups.length }}</span>
      </div>
      <div v-if="!signups.length" class="text-center py-3 text-gray-400 text-xs">
        {{ isZh ? '還沒有報名' : 'No signups yet' }}
      </div>
      <div v-else class="space-y-1 max-h-48 overflow-y-auto">
        <div v-for="s in signups" :key="s.id"
          :class="['flex items-center gap-2 py-1 px-2 rounded-lg text-xs', s.genderWait || isWaitlisted(s) ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-700']">
          <span class="font-medium shrink-0 w-5 text-center">
            <span v-if="s.genderWait || isWaitlisted(s)" class="text-amber-500">候</span>
            <span v-else>{{ s.position }}</span>
          </span>
          <span class="flex-1 min-w-0 truncate font-medium">{{ s.forFriend || s.name }}</span>
          <span v-if="s.forFriend" class="text-purple-500 shrink-0">代</span>
          <span v-if="s.isLate" class="text-orange-400 shrink-0">晚</span>
          <span v-if="s.gender === 'male'" class="text-blue-400 shrink-0">♂</span>
          <span v-if="s.gender === 'female'" class="text-pink-400 shrink-0">♀</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSignups } from '@/composables/useSignups.js';

const props = defineProps({
  session: { type: Object, required: true },
  user: { type: Object, default: null },
  isZh: { type: Boolean, default: true },
});

defineEmits(['toggle-open', 'toggle-private', 'delete', 'share']);

const { signups } = useSignups(props.session.id, {
  limit: props.session.limit,
  maleLimit: props.session.maleLimit,
  femaleLimit: props.session.femaleLimit,
});

const title = computed(() =>
  props.session.title || (props.session.date + (props.isZh ? ' 臨打' : ' Pickup'))
);

const isPast = computed(() => (props.session.date || '') < new Date().toISOString().split('T')[0]);

const statusBadgeCls = computed(() => {
  if (isPast.value) return 'bg-gray-100 text-gray-400';
  if (props.session.isOpen) return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-500';
});
const statusBadgeText = computed(() => {
  if (isPast.value) return props.isZh ? '已結束' : 'Past';
  if (props.session.isOpen) return props.isZh ? '報名中' : 'Open';
  return props.isZh ? '已關閉' : 'Closed';
});

const typeLabel = computed(() => {
  const map = { mixed: props.isZh ? '混排' : 'Mixed', male: props.isZh ? '男生' : 'Male', female: props.isZh ? '女生' : 'Female' };
  return map[props.session.type] || '';
});

const hasMixedLimits = computed(() =>
  props.session.type === 'mixed' && (props.session.maleLimit > 0 || props.session.femaleLimit > 0)
);
const effectiveLimit = computed(() =>
  props.session.limit || (hasMixedLimits.value ? (props.session.maleLimit || 0) + (props.session.femaleLimit || 0) : 0)
);
const maleCount = computed(() => signups.value.filter(s => s.gender === 'male').length);
const femaleCount = computed(() => signups.value.filter(s => s.gender === 'female').length);
const malePct = computed(() => props.session.maleLimit > 0 ? Math.round(Math.min(maleCount.value, props.session.maleLimit) / props.session.maleLimit * 100) : 0);
const femalePct = computed(() => props.session.femaleLimit > 0 ? Math.round(Math.min(femaleCount.value, props.session.femaleLimit) / props.session.femaleLimit * 100) : 0);
const totalPct = computed(() => props.session.limit > 0 ? Math.round(Math.min(signups.value.length, props.session.limit) / props.session.limit * 100) : 0);

function isWaitlisted(s) {
  return !s.forceConfirmed && (s.forceWaitlisted || (props.session.limit > 0 && s.position > props.session.limit));
}

const signupTimeHtml = computed(() => {
  const { openAt, closeAt } = props.session;
  const fmtTs = ms => {
    const d = new Date(ms);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const openMs = openAt ? new Date(openAt).getTime() : null;
  const closeMs = closeAt ? new Date(closeAt).getTime() : null;
  if (openMs && closeMs) return `📋 ${props.isZh ? '報名時間' : 'Signup'}: ${fmtTs(openMs)} ~ ${fmtTs(closeMs)}`;
  if (closeMs) return `📋 ${props.isZh ? '報名截止' : 'Closes'}: ${fmtTs(closeMs)}`;
  if (openMs) return `📋 ${props.isZh ? '報名開始' : 'Opens'}: ${fmtTs(openMs)}`;
  return '';
});

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  if (!props.isZh) return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()} (週${days[dt.getDay()]})`;
}

function fmtTs(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (!props.isZh) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + hhmm;
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${hhmm}`;
}
</script>
