<template>
  <div
    :class="[
      'flex items-start gap-2 rounded-xl px-3 py-2',
      isWait ? 'opacity-60' : '',
      isOwn ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50',
      genderBorder,
    ]"
  >
    <span :class="['min-w-7 h-7 px-1 flex items-center justify-center rounded-full text-xs font-bold shrink-0 mt-0.5', posColor]">
      {{ displayPos }}
    </span>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-800 truncate">
        {{ signup.name }}
        <span v-if="isOwn" class="text-xs text-indigo-400">({{ isZh ? '我' : 'me' }})</span>
      </p>
      <div v-if="tags.length" class="flex gap-1 flex-wrap mt-0.5">
        <span v-for="tag in tags" :key="tag.text" class="tag" :style="tag.style">{{ tag.text }}</span>
      </div>
    </div>
    <template v-if="isOwn">
      <button @click="$emit('edit', signup)" class="text-xs text-gray-300 hover:text-indigo-400 transition shrink-0" :title="isZh ? '編輯報名' : 'Edit signup'">✏️</button>
      <button @click="$emit('cancel', { sessionId: signup.sessionId, signupId: signup.id })" class="text-xs text-gray-300 hover:text-red-400 transition shrink-0" :title="isZh ? '取消報名' : 'Cancel signup'">✕</button>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  signup: { type: Object, required: true },
  isWait: { type: Boolean, default: false },
  posLabel: { type: String, default: null },
  signups: { type: Array, default: () => [] },
  user: { type: Object, default: null },
  isZh: { type: Boolean, default: true },
  waitPrefix: { type: String, default: '候' },
});

defineEmits(['edit', 'cancel']);

const isOwn = computed(() => !!props.user && props.signup.uid === props.user.id);

const genderBorder = computed(() => {
  if (props.signup.gender === 'male') return 'border-l-4 border-l-blue-400';
  if (props.signup.gender === 'female') return 'border-l-4 border-l-pink-400';
  return '';
});

const displayPos = computed(() => {
  if (props.posLabel) return props.posLabel;
  const p = props.signup.position;
  if (props.isWait) return props.waitPrefix + p;
  return '#' + p;
});

const posColor = computed(() => {
  const p = props.signup.position;
  if (!props.isWait && p === 1) return 'bg-yellow-400 text-white';
  if (!props.isWait && p === 2) return 'bg-gray-300 text-gray-700';
  if (!props.isWait && p === 3) return 'bg-amber-600 text-white';
  if (props.isWait) return 'bg-gray-200 text-gray-400';
  return 'bg-indigo-100 text-indigo-600';
});

const tags = computed(() => {
  const result = [];
  const s = props.signup;
  if (s.isLate) {
    const lateUnit = props.isZh ? '分鐘' : 'mins';
    result.push({ text: (props.isZh ? '晚到' : 'Late') + (s.lateTime ? ' +' + s.lateTime + lateUnit : ''), style: '' });
  }
  if (s.forFriend) result.push({ text: (props.isZh ? '代' : 'For') + ':' + s.forFriend, style: '' });
  if (s.pairWith) {
    const paired = props.signups.find(p => (p.forFriend ? p.forFriend : p.name) === s.pairWith);
    const name = paired ? (paired.forFriend || paired.name) : s.pairWith;
    result.push({ text: (props.isZh ? '搭檔' : 'Pair') + ':' + name, style: '' });
  }
  if (s.bringEquip?.length) {
    s.bringEquip.forEach(e => result.push({ text: '🎒' + e, style: 'background:#d1fae5;color:#065f46' }));
  }
  return result;
});
</script>
