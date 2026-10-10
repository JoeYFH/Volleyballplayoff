<template>
  <div class="bg-white rounded-2xl shadow-sm border border-indigo-50 overflow-hidden fade-in">
    <!-- Card body -->
    <div class="p-5">
      <div class="flex items-start justify-between gap-2 mb-1">
        <div>
          <h3 class="font-bold text-gray-800">{{ session.title || session.date + (isZh ? ' 臨打' : ' Pickup') }}</h3>
          <div v-if="session.creatorName" class="flex items-center gap-1.5 mt-1">
            <img v-if="session.creatorPhoto" :src="session.creatorPhoto" class="w-5 h-5 rounded-full border border-gray-200 shrink-0" alt="" />
            <p class="text-xs text-gray-400">{{ isZh ? '舉辦人' : 'By' }}: {{ session.creatorName }}</p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-1 shrink-0">
          <!-- Status badge -->
          <span v-if="effectivelyOpen" class="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">{{ isZh ? '報名中' : 'Open' }}</span>
          <span v-else-if="isNotYet" class="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-600">{{ isZh ? '尚未開放' : 'Not Open Yet' }}</span>
          <span v-else class="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-500">{{ isZh ? '已截止' : 'Closed' }}</span>
          <span v-if="session.isPrivate" class="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 ml-1">🔒 {{ isZh ? '私人' : 'Private' }}</span>
          <!-- Signed badge -->
          <span v-if="ownSignup && !ownIsWaitlisted" class="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full shrink-0">✅ {{ isZh ? '已報名' : 'Signed up' }}</span>
          <span v-if="ownSignup && ownIsWaitlisted" class="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full shrink-0">⏳ {{ isZh ? '候補中' : 'Waitlisted' }}</span>
        </div>
      </div>

      <!-- Info grid -->
      <div class="text-sm text-gray-800 mt-3 space-y-1">
        <!-- Row 1: date + time -->
        <div class="flex flex-wrap gap-x-4 gap-y-1">
          <div class="flex items-center gap-1"><span>📅</span><span>{{ formatDate(session.date) }}</span></div>
          <div class="flex items-center gap-1">
            <span>🕐</span>
            <span>{{ session.time || '—' }}{{ session.endTime ? ' – ' + session.endTime : '' }}</span>
          </div>
        </div>
        <!-- Row 2: location + venue on same line -->
        <div class="flex items-center gap-1 flex-wrap">
          <span>📍</span>
          <a :href="`https://maps.google.com/?q=${encodeURIComponent(session.location || '')}`" target="_blank" class="text-indigo-500 hover:underline">{{ session.location || '—' }}</a>
          <span v-if="session.venue" class="text-gray-400 text-xs">·</span>
          <span v-if="session.venue" class="text-xs text-gray-500">{{ session.venue }}</span>
        </div>
        <!-- Row 3: limit, type, equipment -->
        <div class="flex flex-wrap gap-x-4 gap-y-1">
          <div v-if="session.limit" class="flex items-center gap-1"><span>👥</span><span>{{ isZh ? '名額' : 'Limit' }} {{ session.limit }}{{ isZh ? '人' : '' }}</span></div>
          <div v-if="session.type" class="flex items-center gap-1"><span>🏷️</span><span>{{ typeLabel }}</span></div>
          <div v-if="session.venueCost" class="flex items-center gap-1"><span>💰</span><span>{{ isZh ? '租場' : 'Venue' }} ${{ session.venueCost }}</span></div>
          <div v-if="neededEquip.length" class="flex items-center gap-1 text-xs text-gray-500">
            <span>🎒</span><span>{{ isZh ? '還需帶：' : 'Still need: ' }}{{ neededEquip.join(isZh ? '、' : ', ') }}</span>
          </div>
          <div v-else-if="session.equipment?.length" class="flex items-center gap-1 text-xs text-green-500">
            <span>✅</span><span>{{ isZh ? '裝備已全部到位' : 'All equipment covered' }}</span>
          </div>
        </div>
        <!-- Note (organizer only) -->
        <div v-if="isOrganizer && session.note" class="flex items-center gap-1 text-xs text-gray-400"><span>📝</span><span>{{ session.note }}</span></div>
      </div>

      <!-- Progress bar(s) -->
      <div v-if="hasMixedLimits" class="mt-3 space-y-1.5">
        <div class="flex justify-between text-xs text-gray-400 mb-0.5">
          <span>{{ isZh ? '報名進度' : 'Progress' }}</span>
          <span>{{ confirmedCount }} / {{ effectiveTotalLimit }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-blue-400 w-6 shrink-0">♂</span>
          <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div class="h-2 rounded-full transition-all duration-500 bg-blue-400" :style="{ width: malePct + '%' }"></div>
          </div>
          <span class="text-xs text-gray-400 w-10 text-right shrink-0">{{ maleCount }}/{{ session.maleLimit || '?' }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-pink-400 w-6 shrink-0">♀</span>
          <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div class="h-2 rounded-full transition-all duration-500 bg-pink-400" :style="{ width: femalePct + '%' }"></div>
          </div>
          <span class="text-xs text-gray-400 w-10 text-right shrink-0">{{ femaleCount }}/{{ session.femaleLimit || '?' }}</span>
        </div>
      </div>
      <div v-else-if="session.limit" class="mt-3">
        <div class="flex justify-between text-xs text-gray-400 mb-1">
          <span>{{ isZh ? '報名進度' : 'Progress' }}</span>
          <span>{{ confirmedCount }} / {{ session.limit }}</span>
        </div>
        <div class="bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div :class="['h-2.5 rounded-full transition-all duration-500', totalPct >= 75 ? 'bg-amber-400' : 'bg-indigo-400']" :style="{ width: totalPct + '%' }"></div>
        </div>
      </div>

      <!-- Countdown -->
      <div v-if="countdownText" class="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-3 text-sm text-amber-700 text-center font-medium">{{ countdownText }}</div>

      <!-- Signup time info -->
      <div v-if="signupTimeHtml" class="text-xs text-gray-400 mt-1" v-html="signupTimeHtml"></div>

      <!-- Signup button -->
      <button v-if="effectivelyOpen" @click="openSignup" class="w-full mt-4 bg-indigo-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition">
        🙋 {{ isZh ? '我要報名' : 'Sign Up' }}
      </button>

      <!-- Manage button (organizer / admin) -->
      <a v-if="isOrganizer" :href="`/my-sessions?edit=${session.id}`" class="block w-full mt-2 text-center bg-amber-50 text-amber-700 border border-amber-200 rounded-xl py-2 font-semibold text-xs hover:bg-amber-100 transition">
        ⚙️ {{ isZh ? '編輯場次' : 'Edit Session' }}
      </a>

      <!-- Share button -->
      <button @click="$emit('share', session)" class="flex items-center justify-center gap-1.5 w-full mt-2 text-xs text-gray-500 border border-gray-200 rounded-xl py-2 hover:bg-gray-50 hover:text-indigo-600 transition">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
        {{ isZh ? '分享活動連結' : 'Share Link' }}
      </button>
    </div>

    <!-- Signup list -->
    <SignupList
      :id="`list-${session.id}`"
      :signups="signups"
      :limit="session.limit"
      :male-limit="session.maleLimit"
      :female-limit="session.femaleLimit"
      :type="session.type"
      :user="user"
      :is-zh="isZh"
      @edit="openEditSignup"
      @cancel="onCancelSignup"
    />
  </div>

  <!-- Signup modal (teleported to body to avoid stacking context issues) -->
  <Teleport to="body">
    <SignupModal
      v-if="showSignupModal"
      :session="session"
      :signups="signups"
      :edit-signup="editSignupData"
      @close="closeSignupModal"
      @submitted="closeSignupModal"
    />
  </Teleport>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import SignupList from './SignupList.vue';
import SignupModal from './SignupModal.vue';
import { useSignups } from '@/composables/useSignups.js';
import { supabase } from '@/lib/supabase.js';

const props = defineProps({
  session: { type: Object, required: true },
  user: { type: Object, default: null },
  isAdmin: { type: Boolean, default: false },
  isZh: { type: Boolean, default: true },
  autoOpenSignup: { type: Boolean, default: false },
});

const emit = defineEmits(['signup', 'share', 'edit-signup']);

// Signup modal state
const showSignupModal = ref(false);
const editSignupData = ref(null);

function openSignup() {
  editSignupData.value = null;
  showSignupModal.value = true;
}
function openEditSignup(signup) {
  editSignupData.value = signup;
  showSignupModal.value = true;
}
function closeSignupModal() {
  showSignupModal.value = false;
  editSignupData.value = null;
}

const { signups } = useSignups(props.session.id, {
  limit: props.session.limit,
  maleLimit: props.session.maleLimit,
  femaleLimit: props.session.femaleLimit,
});

// Time calculations
const now = ref(Date.now());
let timer = null;
onMounted(() => {
  timer = setInterval(() => { now.value = Date.now(); }, 1000);
  if (props.autoOpenSignup && effectivelyOpen.value) openSignup();
});
onUnmounted(() => clearInterval(timer));

const openAtMs  = computed(() => props.session.openAt  ? new Date(props.session.openAt).getTime()  : null);
const closeAtMs = computed(() => props.session.closeAt ? new Date(props.session.closeAt).getTime() : null);
const isPastClose  = computed(() => !!closeAtMs.value && closeAtMs.value < now.value);
const effectivelyOpen = computed(() => props.session.isOpen && !isPastClose.value);
const isNotYet = computed(() => !!openAtMs.value && openAtMs.value > now.value);

const isOrganizer = computed(() =>
  (props.user && props.session.createdBy === props.user.id) || props.isAdmin
);

const typeLabel = computed(() => {
  const map = { mixed: props.isZh ? '混排' : 'Mixed', male: props.isZh ? '男生' : 'Male', female: props.isZh ? '女生' : 'Female' };
  return map[props.session.type] || '';
});

const EQUIP_EN = { '標竿': 'Poles', '音響': 'Speaker', '球': 'Ball' };
const equipLabel = (item) => props.isZh ? item : (EQUIP_EN[item] || item);

const neededEquip = computed(() => {
  const all = props.session.equipment || [];
  if (!all.length) return [];
  const covered = new Set(signups.value.filter(s => !isWaitlisted(s)).flatMap(s => s.bringEquip || []));
  return all.filter(item => !covered.has(item)).map(equipLabel);
});

// Progress bar computations
const hasMixedLimits = computed(() => props.session.type === 'mixed' && (props.session.maleLimit > 0 || props.session.femaleLimit > 0));
const effectiveTotalLimit = computed(() => props.session.limit || (hasMixedLimits.value ? props.session.maleLimit + props.session.femaleLimit : 0));
const maleCount      = computed(() => signups.value.filter(s => !isWaitlisted(s) && s.gender === 'male').length);
const femaleCount    = computed(() => signups.value.filter(s => !isWaitlisted(s) && s.gender === 'female').length);
const confirmedCount = computed(() => signups.value.filter(s => !isWaitlisted(s)).length);
const malePct   = computed(() => props.session.maleLimit   > 0 ? Math.round(Math.min(maleCount.value,      props.session.maleLimit)   / props.session.maleLimit   * 100) : 0);
const femalePct = computed(() => props.session.femaleLimit > 0 ? Math.round(Math.min(femaleCount.value,    props.session.femaleLimit) / props.session.femaleLimit * 100) : 0);
const totalPct  = computed(() => props.session.limit       > 0 ? Math.round(Math.min(confirmedCount.value, props.session.limit)       / props.session.limit       * 100) : 0);

// Own signup state
const isWaitlisted = (s) =>
  !s.forceConfirmed && (s.forceWaitlisted || (props.session.limit > 0 && s.position > props.session.limit) || !!s.genderWait);

const ownSignup = computed(() => props.user ? signups.value.find(s => s.uid === props.user.id) : null);
const ownIsWaitlisted = computed(() => ownSignup.value ? isWaitlisted(ownSignup.value) : false);

// Countdown
const countdownText = computed(() => {
  if (!openAtMs.value || openAtMs.value <= now.value) return '';
  const diff = openAtMs.value - now.value;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return props.isZh
    ? `⏳ 報名將於 ${h ? h + '小時' : ''}${m}分${s}秒後開放`
    : `⏳ Opens in ${h ? h + 'h ' : ''}${m}m ${s}s`;
});

// Signup time display
const fmtTs = (ms) => {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const signupTimeHtml = computed(() => {
  const zh = props.isZh;
  if (openAtMs.value && closeAtMs.value) return `📋 ${zh ? '報名時間' : 'Signup'}: ${fmtTs(openAtMs.value)} ~ ${fmtTs(closeAtMs.value)}`;
  if (closeAtMs.value) return `📋 ${zh ? '報名截止' : 'Closes'}: ${fmtTs(closeAtMs.value)}`;
  if (openAtMs.value) return `📋 ${zh ? '報名開始' : 'Opens'}: ${fmtTs(openAtMs.value)}`;
  return '';
});

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return props.isZh
    ? `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function onCancelSignup({ signupId }) {
  const msg = props.isZh ? '確定取消報名？' : 'Cancel your signup?';
  if (!confirm(msg)) return;
  await supabase.from('signups').delete().eq('id', signupId);
}
</script>
