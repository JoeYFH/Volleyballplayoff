<template>
  <div class="fixed inset-0 z-40">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>
    <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl flex flex-col" style="max-height: min(85vh, 85dvh)">
      <!-- Header -->
      <div class="flex-none px-5 py-4 flex items-center justify-between border-b border-gray-100 bg-white rounded-t-2xl">
        <h2 class="font-bold text-gray-800">{{ isEdit ? (isZh ? '✏️ 編輯報名' : '✏️ Edit Signup') : t('formTitle') }}</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
      </div>

      <!-- Scrollable body -->
      <div class="flex-1 min-h-0 overflow-y-auto" style="overscroll-behavior-y: contain">
        <div class="px-5 py-4 space-y-3">

          <!-- Profile preview (logged in, not signing up for a friend) -->
          <div v-if="user && !forFriend" class="flex items-center gap-3 bg-indigo-50 rounded-xl px-4 py-3">
            <img v-if="photoURL" :src="photoURL" referrerpolicy="no-referrer" class="w-10 h-10 rounded-full border-2 border-white shadow-sm shrink-0" alt="" onerror="this.style.display='none'" />
            <div>
              <p class="text-sm font-medium text-indigo-800">{{ displayName }}</p>
              <p class="text-xs text-indigo-400">{{ t('googleProfile') }}</p>
            </div>
          </div>

          <!-- Google login row (not logged in) -->
          <div v-if="!user">
            <button type="button" @click="signInWithGoogle"
              class="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition shadow-sm">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-4 h-4" />
              {{ t('modalGoogleLogin') }}
            </button>
            <p class="text-xs text-gray-400 text-center mt-1.5">{{ t('modalGoogleHint') }}</p>
            <div class="flex items-center gap-3 my-2">
              <div class="flex-1 h-px bg-gray-200"></div>
              <span class="text-xs text-gray-400">{{ t('modalOr') }}</span>
              <div class="flex-1 h-px bg-gray-200"></div>
            </div>
          </div>

          <!-- Name input (only when not logged in) -->
          <div v-if="!user">
            <label class="block text-sm font-medium text-gray-600 mb-1">
              {{ t('nameLabel') }} <span class="text-red-400">*</span>
            </label>
            <input v-model="nameInput" type="text" maxlength="100" :placeholder="t('namePh')"
              :class="['w-full border rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300', nameError ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200']"
              @input="nameError = ''" />
            <p v-if="nameError" class="mt-1 text-xs text-red-500">{{ nameError }}</p>
          </div>

          <!-- Self gender (mixed, not for friend) -->
          <div v-if="isMixed && !forFriend">
            <label class="block text-sm font-medium text-gray-600 mb-2">
              {{ isZh ? '性別' : 'Gender' }} <span class="text-red-400">*</span>
            </label>
            <div class="flex gap-2">
              <button type="button" @click="selfGender = 'male'; genderError = ''" :class="genderBtnClass('male', selfGender)">♂ {{ isZh ? '男生' : 'Male' }}</button>
              <button type="button" @click="selfGender = 'female'; genderError = ''" :class="genderBtnClass('female', selfGender)">♀ {{ isZh ? '女生' : 'Female' }}</button>
            </div>
            <p v-if="genderError" class="mt-1 text-xs text-red-500">{{ genderError }}</p>
          </div>

          <!-- For friend checkbox (logged-in only) -->
          <div v-if="user" class="flex items-center gap-2">
            <input type="checkbox" id="modalFriendChk" v-model="forFriend" :disabled="isEdit && !!editSignup?.forFriend" class="w-4 h-4" />
            <label for="modalFriendChk" class="text-sm text-gray-600">{{ t('forFriend') }}</label>
          </div>
          <div v-if="forFriend" class="ml-6 space-y-2">
            <input v-model="friendName" type="text" maxlength="100" :placeholder="t('friendPh')"
              :class="['w-full border rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300', friendNameError ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200']"
              @input="friendNameError = ''" />
            <p v-if="friendNameError" class="mt-1 text-xs text-red-500">{{ friendNameError }}</p>
            <!-- Friend gender (mixed sessions only) -->
            <div v-if="isMixed">
              <div class="flex gap-2">
                <button type="button" @click="friendGender = 'male'; friendGenderError = ''" :class="genderBtnClass('male', friendGender)">♂ {{ isZh ? '男生' : 'Male' }}</button>
                <button type="button" @click="friendGender = 'female'; friendGenderError = ''" :class="genderBtnClass('female', friendGender)">♀ {{ isZh ? '女生' : 'Female' }}</button>
              </div>
              <p v-if="friendGenderError" class="mt-1 text-xs text-red-500">{{ friendGenderError }}</p>
            </div>
          </div>

          <!-- Late arrival checkbox -->
          <div class="flex items-center gap-2">
            <input type="checkbox" id="modalLateChk" v-model="isLate" class="w-4 h-4" />
            <label for="modalLateChk" class="text-sm text-gray-600">
              {{ forFriend ? (isZh ? '晚到' : 'Late arrival') : t('willBeLate') }}
            </label>
          </div>
          <div v-if="isLate" class="ml-6">
            <div class="flex items-center gap-2">
              <input v-model="lateTime" type="text" inputmode="numeric" pattern="[0-9]*"
                class="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-300"
                @input="lateTimeError = ''" />
              <span class="text-sm text-gray-500">{{ isZh ? '分鐘' : 'min' }}</span>
            </div>
            <p v-if="lateTimeError" class="mt-1 text-xs text-red-500">{{ lateTimeError }}</p>
          </div>

          <!-- Pair with dropdown -->
          <div>
            <label class="block text-sm text-gray-600 mb-1">{{ t('pairLabel') }}</label>
            <select v-model="pairWith"
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="">{{ isZh ? '— 不指定 —' : '— No preference —' }}</option>
              <option v-for="s in pairOptions" :key="s.id" :value="s.forFriend || s.name">
                {{ s.forFriend || s.name }}
              </option>
            </select>
          </div>

          <!-- Bring equipment chips -->
          <div v-if="equipChips.length">
            <label class="block text-sm font-medium text-gray-600 mb-2">🎒 {{ isZh ? '我可以幫忙帶' : 'I can bring' }}</label>
            <div class="flex flex-wrap gap-2">
              <button v-for="item in equipChips" :key="item.name" type="button"
                :disabled="item.claimed"
                @click="toggleEquip(item.name)"
                :class="equipChipClass(item)"
                :title="item.claimed ? (isZh ? '已有人幫忙帶' : 'Already claimed') : ''">
                {{ item.name }}{{ item.claimed ? ' ✓' : '' }}
              </button>
            </div>
          </div>

          <!-- Submit button -->
          <button @click="submit" :disabled="submitting"
            class="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60">
            {{ submitLabel }}
          </button>
          <p v-if="successMsg" class="text-center text-sm text-green-600">{{ successMsg }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from '@/lib/i18n.js';
import { useAuth } from '@/composables/useAuth.js';
import { supabase } from '@/lib/supabase.js';
import { signupToRow } from '@/composables/useSessions.js';

const props = defineProps({
  session: { type: Object, required: true },
  signups: { type: Array, default: () => [] },
  editSignup: { type: Object, default: null },
});

const emit = defineEmits(['close', 'submitted']);

const { lang, t } = useI18n();
const { user, signInWithGoogle } = useAuth();

const isZh = computed(() => lang.value === 'zh');
const isEdit = computed(() => !!props.editSignup);
const isMixed = computed(() => props.session.type === 'mixed');

const photoURL = computed(() =>
  user.value?.user_metadata?.avatar_url
  || user.value?.identities?.[0]?.identity_data?.avatar_url
  || null
);
const displayName = computed(() =>
  user.value?.user_metadata?.full_name
  || user.value?.user_metadata?.name
  || user.value?.identities?.[0]?.identity_data?.full_name
  || user.value?.email || ''
);

// Form state
const nameInput = ref('');
const selfGender = ref('');
const friendGender = ref('');
const forFriend = ref(false);
const friendName = ref('');
const isLate = ref(false);
const lateTime = ref('');
const pairWith = ref('');
const bringEquip = ref(new Set());
const submitting = ref(false);
const successMsg = ref('');

// Validation errors
const nameError = ref('');
const genderError = ref('');
const friendNameError = ref('');
const friendGenderError = ref('');
const lateTimeError = ref('');

// Populate form when editing
if (props.editSignup) {
  forFriend.value = !!props.editSignup.forFriend;
  friendName.value = props.editSignup.forFriend || '';
  isLate.value = !!props.editSignup.isLate;
  lateTime.value = props.editSignup.lateTime || '';
  pairWith.value = props.editSignup.pairWith || '';
  bringEquip.value = new Set(props.editSignup.bringEquip || []);
  if (isMixed.value && props.editSignup.gender) {
    if (props.editSignup.forFriend) friendGender.value = props.editSignup.gender;
    else selfGender.value = props.editSignup.gender;
  }
}

const isSessionFull = computed(() => {
  const { limit, maleLimit, femaleLimit } = props.session;
  if (!limit) return false;
  const hasMixedLimits = (maleLimit || 0) > 0 || (femaleLimit || 0) > 0;
  const confirmedCount = props.signups.filter(s => {
    if (hasMixedLimits) return !s.genderWait;
    return s.forceConfirmed || (!s.forceWaitlisted && limit > 0 && s.position <= limit);
  }).length;
  return confirmedCount >= limit;
});

const submitLabel = computed(() => {
  if (submitting.value) return t('signingUp');
  if (isEdit.value) return isZh.value ? '💾 更新報名' : '💾 Update';
  if (isSessionFull.value) return isZh.value ? '⏳ 加入候補名單' : '⏳ Join Waitlist';
  return t('confirmBtn');
});

const pairOptions = computed(() =>
  props.signups.filter(s => {
    if (isEdit.value && s.id === props.editSignup.id) return false;
    if (!isEdit.value && user.value && s.uid === user.value.id && !s.forFriend) return false;
    return true;
  })
);

const equipChips = computed(() => {
  const { limit, maleLimit, femaleLimit } = props.session;
  const hasMixedLimits = (maleLimit || 0) > 0 || (femaleLimit || 0) > 0;
  const claimedByOthers = new Set();
  props.signups.forEach(s => {
    if (isEdit.value && s.id === props.editSignup.id) return;
    const isWait = hasMixedLimits
      ? !!s.genderWait
      : !s.forceConfirmed && (s.forceWaitlisted || (limit > 0 && s.position > limit));
    if (isWait) return;
    (s.bringEquip || []).forEach(e => claimedByOthers.add(e));
  });
  return (props.session.equipment || []).map(name => ({
    name,
    claimed: claimedByOthers.has(name),
    selected: bringEquip.value.has(name),
  }));
});

function toggleEquip(name) {
  const s = new Set(bringEquip.value);
  if (s.has(name)) s.delete(name); else s.add(name);
  bringEquip.value = s;
}

function genderBtnClass(gender, selected) {
  if (selected === gender) {
    return gender === 'male'
      ? 'flex-1 text-xs py-2 rounded-xl border border-blue-500 bg-blue-500 text-white transition'
      : 'flex-1 text-xs py-2 rounded-xl border border-pink-500 bg-pink-500 text-white transition';
  }
  return gender === 'male'
    ? 'flex-1 text-xs py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition'
    : 'flex-1 text-xs py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:border-pink-300 hover:text-pink-600 transition';
}

function equipChipClass(item) {
  if (item.claimed) return 'text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60';
  if (item.selected) return 'text-xs px-3 py-1.5 rounded-full border border-indigo-500 bg-indigo-500 text-white transition';
  return 'text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition';
}

async function submit() {
  nameError.value = '';
  genderError.value = '';
  friendNameError.value = '';
  friendGenderError.value = '';
  lateTimeError.value = '';
  successMsg.value = '';

  // Duplicate check (new self-signup only)
  if (!isEdit.value && user.value && !forFriend.value) {
    const existing = props.signups.find(s => s.uid === user.value.id && !s.forFriend);
    if (existing) {
      alert(isZh.value ? '⚠️ 您已經報名過這個活動了！' : '⚠️ You have already signed up for this session!');
      return;
    }
  }

  const name = user.value
    ? (user.value.user_metadata?.full_name || user.value.user_metadata?.name || user.value.email)
    : nameInput.value.trim();
  if (!name) {
    nameError.value = t('enterName');
    return;
  }

  if (forFriend.value && !friendName.value.trim()) {
    friendNameError.value = isZh.value ? '請輸入朋友的名字' : "Please enter your friend's name";
    return;
  }

  if (isLate.value && lateTime.value.trim()) {
    const v = lateTime.value.trim();
    if (!/^\d+$/.test(v) || parseInt(v, 10) < 1) {
      lateTimeError.value = isZh.value ? '請輸入正整數（分鐘）' : 'Please enter a positive number (minutes)';
      return;
    }
  }

  if (isMixed.value) {
    if (!forFriend.value && !selfGender.value) {
      genderError.value = isZh.value ? '請選擇性別' : 'Please select gender';
      return;
    }
    if (forFriend.value && !friendGender.value) {
      friendGenderError.value = isZh.value ? '請選擇性別' : 'Please select gender';
      return;
    }
  }

  let signupGender = '';
  if (props.session.type === 'male') signupGender = 'male';
  else if (props.session.type === 'female') signupGender = 'female';
  else if (props.session.type === 'mixed') {
    signupGender = forFriend.value ? friendGender.value : selfGender.value;
  }

  const payload = {
    sessionId: props.session.id,
    uid: user.value?.id || null,
    name,
    isLate: isLate.value,
    lateTime: lateTime.value.trim(),
    forFriend: forFriend.value ? friendName.value.trim() : '',
    pairWith: pairWith.value,
    bringEquip: [...bringEquip.value],
    gender: signupGender,
    friendGender: forFriend.value ? friendGender.value : '',
  };

  submitting.value = true;
  try {
    if (isEdit.value) {
      const { error } = await supabase.from('signups').update(signupToRow(payload)).eq('id', props.editSignup.id);
      if (error) throw error;
      successMsg.value = isZh.value ? '✅ 已更新！' : '✅ Updated!';
    } else {
      const { error } = await supabase.from('signups').insert(signupToRow(payload));
      if (error) throw error;
      successMsg.value = t('successMsg');
    }
    emit('submitted');
    setTimeout(() => emit('close'), 1200);
  } catch (e) {
    alert(t('failMsg') + (e.message ? ` (${e.message})` : ''));
  } finally {
    submitting.value = false;
  }
}
</script>
