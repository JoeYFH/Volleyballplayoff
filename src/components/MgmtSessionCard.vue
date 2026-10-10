<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden fade-in">
    <div class="p-4">
      <!-- Title + status -->
      <div class="flex items-start justify-between gap-2 mb-2">
        <div>
          <div class="flex items-center gap-1.5">
            <p class="font-bold text-gray-800">{{ title }}</p>
            <a :href="`/?session=${session.id}`" target="_blank"
              class="text-gray-300 hover:text-indigo-500 transition shrink-0" :title="isZh ? '查看報名頁面' : 'View signup page'">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
            </a>
          </div>
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
        <!-- Row 1: 日期 + 時間 -->
        <div class="flex flex-wrap gap-x-4 gap-y-0.5">
          <div v-if="session.date" class="flex items-center gap-1"><span>📅</span><span>{{ formatDate(session.date) }}</span></div>
          <div v-if="session.time" class="flex items-center gap-1">
            <span>🕐</span>
            <span>{{ session.time }}{{ session.endTime ? ' – ' + session.endTime : '' }}</span>
            <span v-if="sessionDuration" class="ml-1 text-xs font-semibold text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded-full">⏱ {{ sessionDuration }}</span>
          </div>
        </div>
        <!-- Row 2: 地點 · 場館 同行 -->
        <div v-if="session.location" class="flex items-start gap-1 flex-wrap">
          <span>📍</span>
          <a :href="`https://maps.google.com/?q=${encodeURIComponent(session.location)}`" target="_blank" class="text-indigo-500 hover:underline">{{ session.location }}</a>
          <span v-if="session.venue" class="text-gray-400 text-xs self-center">·</span>
          <span v-if="session.venue" class="text-xs text-gray-500 self-center">{{ session.venue }}</span>
        </div>
        <!-- Row 3: 名額 + 類型 同行 -->
        <div class="flex flex-wrap gap-x-4 gap-y-0.5">
          <div v-if="session.limit" class="flex items-center gap-1">
            <span>👥</span><span>{{ isZh ? '名額' : 'Limit' }} {{ session.limit }}{{ isZh ? '人' : '' }}</span>
            <span v-if="session.type === 'mixed' && (session.maleLimit || session.femaleLimit)" class="text-xs text-gray-400">(♂{{ session.maleLimit || 0 }} ♀{{ session.femaleLimit || 0 }})</span>
          </div>
          <div v-if="session.type" class="flex items-center gap-1"><span>🏷️</span><span>{{ typeLabel }}</span></div>
        </div>
        <!-- 報名時間 -->
        <div v-if="signupTimeHtml" class="text-xs text-gray-500" v-html="signupTimeHtml"></div>
        <!-- 備註 -->
        <div v-if="session.note" class="mt-1 px-2 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs">📝 {{ isZh ? '備註' : 'Note' }}: {{ session.note }}</div>
      </div>

      <!-- Progress bar -->
      <div v-if="hasMixedLimits" class="mb-3 space-y-1.5">
        <div class="flex justify-between text-xs text-gray-400 mb-0.5">
          <span>{{ isZh ? '報名進度' : 'Progress' }}</span>
          <span>{{ signups.length }} / {{ effectiveLimit }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-blue-400 w-5 shrink-0">♂</span>
          <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div class="h-2 rounded-full transition-all duration-500 bg-blue-400" :style="{ width: Math.min(malePct, 100) + '%' }"></div>
          </div>
          <span class="text-xs text-gray-400 w-10 text-right shrink-0">{{ maleCount }}/{{ session.maleLimit || '?' }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-pink-400 w-5 shrink-0">♀</span>
          <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div class="h-2 rounded-full transition-all duration-500 bg-pink-400" :style="{ width: Math.min(femalePct, 100) + '%' }"></div>
          </div>
          <span class="text-xs text-gray-400 w-10 text-right shrink-0">{{ femaleCount }}/{{ session.femaleLimit || '?' }}</span>
        </div>
      </div>
      <div v-else-if="session.limit" class="mb-3">
        <div class="flex justify-between text-xs text-gray-400 mb-1">
          <span>{{ isZh ? '報名進度' : 'Progress' }}</span>
          <span>{{ signups.length }} / {{ session.limit }}</span>
        </div>
        <div class="bg-gray-100 rounded-full h-2 overflow-hidden">
          <div :class="['h-2 rounded-full transition-all duration-500', totalPct >= 75 ? 'bg-amber-400' : 'bg-indigo-400']" :style="{ width: Math.min(totalPct, 100) + '%' }"></div>
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
        <button @click="$emit('edit', session)"
          class="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition">
          ✏️ {{ isZh ? '編輯' : 'Edit' }}
        </button>
        <button @click="$emit('delete', session.id)"
          class="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition">
          🗑️ {{ isZh ? '刪除' : 'Delete' }}
        </button>
      </div>
    </div>

    <!-- Signup list -->
    <div class="max-h-96 overflow-y-auto">
      <SignupList
        :signups="signups"
        :limit="session.limit"
        :male-limit="session.maleLimit"
        :female-limit="session.femaleLimit"
        :type="session.type"
        :user="user"
        :is-zh="isZh"
        :is-manager="true"
        @mgmt-waitlist="forceWaitlistSignup"
        @mgmt-confirm="forceConfirmSignup"
        @mgmt-remove="s => removeSignup(s.id)"
        @edit="openEditModal"
      />
    </div>
  </div>

  <!-- Edit signup modal -->
  <Teleport to="body">
    <SignupModal
      v-if="showEditModal"
      :session="session"
      :signups="signups"
      :edit-signup="editSignupData"
      @close="closeEditModal"
      @submitted="closeEditModal"
    />
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useSignups } from '@/composables/useSignups.js';
import { supabase } from '@/lib/supabase.js';
import SignupList from '@/components/SignupList.vue';
import SignupModal from '@/components/SignupModal.vue';

const props = defineProps({
  session: { type: Object, required: true },
  user: { type: Object, default: null },
  isZh: { type: Boolean, default: true },
});

defineEmits(['toggle-open', 'toggle-private', 'delete', 'share', 'edit']);

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

const showEditModal = ref(false);
const editSignupData = ref(null);

function openEditModal(signup) {
  editSignupData.value = signup;
  showEditModal.value = true;
}
function closeEditModal() {
  showEditModal.value = false;
  editSignupData.value = null;
}

async function removeSignup(id) {
  const msg = props.isZh ? '確定移除此報名？' : 'Remove this signup?';
  if (!confirm(msg)) return;
  await supabase.from('signups').delete().eq('id', id);
  // Real-time subscription in useSignups refreshes the list automatically
}

async function forceWaitlistSignup(s) {
  await supabase.from('signups').update({ force_waitlisted: true, force_confirmed: false }).eq('id', s.id);
}

async function forceConfirmSignup(s) {
  // Warn if confirming would exceed the limit
  if (hasMixedLimits.value && (s.gender === 'male' || s.gender === 'female')) {
    const gLimit = s.gender === 'male' ? props.session.maleLimit : props.session.femaleLimit;
    if (gLimit > 0) {
      const currentConfirmed = signups.value.filter(x => x.gender === s.gender && !x.genderWait && !x.forceWaitlisted).length;
      if (currentConfirmed >= gLimit) {
        const gLabel = props.isZh ? (s.gender === 'male' ? '男生' : '女生') : (s.gender === 'male' ? 'Male' : 'Female');
        const msg = props.isZh
          ? `⚠️ ${gLabel}名額已達上限（${currentConfirmed}/${gLimit}），確定要強制移到正取？`
          : `⚠️ ${gLabel} limit reached (${currentConfirmed}/${gLimit}). Force confirm anyway?`;
        if (!confirm(msg)) return;
      }
    }
  } else if (props.session.limit > 0) {
    const currentConfirmed = signups.value.filter(x => !x.forceWaitlisted && (x.forceConfirmed || x.position <= props.session.limit)).length;
    if (currentConfirmed >= props.session.limit) {
      const msg = props.isZh
        ? `⚠️ 名額已達上限（${currentConfirmed}/${props.session.limit}），確定要強制移到正取？`
        : `⚠️ Limit reached (${currentConfirmed}/${props.session.limit}). Force confirm anyway?`;
      if (!confirm(msg)) return;
    }
  }
  await supabase.from('signups').update({ force_confirmed: true, force_waitlisted: false }).eq('id', s.id);
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

const sessionDuration = computed(() => {
  if (!props.session.time || !props.session.endTime) return null;
  const [sh, sm] = props.session.time.split(':').map(Number);
  const [eh, em] = props.session.endTime.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return null;
  const hrs = mins / 60;
  return (hrs % 1 === 0 ? hrs.toString() : hrs.toFixed(1)) + (props.isZh ? ' 小時' : 'h');
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
