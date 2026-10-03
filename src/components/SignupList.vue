<template>
  <div class="border-t border-gray-50 px-5 py-3">
    <div class="flex items-center justify-between mb-2">
      <p class="text-xs font-semibold text-gray-500">{{ isZh ? '📋 報名名單' : '📋 Sign-up List' }}</p>
      <span class="text-xs bg-indigo-100 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
        {{ isZh ? signups.length + ' 人' : signups.length + (signups.length !== 1 ? ' players' : ' player') }}
      </span>
    </div>

    <div v-if="!signups.length" class="text-center py-3 text-gray-400 text-xs">
      {{ isZh ? '還沒有人報名，快搶第一！' : 'No one yet — be the first!' }}
    </div>

    <template v-else>
      <!-- Own waitlist notice -->
      <div v-if="ownIsWaitlisted" class="text-xs text-center text-amber-700 bg-amber-50 rounded-xl px-3 py-2 mb-1">
        {{ isZh ? '⏳ 你目前在候補名單，有人取消時會自動候補' : '⏳ You are on the waitlist — you will be promoted if a spot opens' }}
      </div>

      <!-- Mixed: gender sections -->
      <template v-if="isMixed">
        <div v-if="males.length" class="mb-2">
          <div class="text-xs font-semibold text-blue-500 px-1 mt-2 mb-1">
            ♂ {{ isZh ? '男生' : 'Male' }}{{ maleLimit > 0 ? ` (${confirmedMales.length}/${maleLimit})` : ` (${males.length})` }}
          </div>
          <div class="space-y-1">
            <SignupItem v-for="(s, i) in confirmedMales" :key="s.id" :signup="{ ...s, position: i + 1 }" :is-wait="false" :signups="signups" :user="user" :is-zh="isZh" :wait-prefix="waitPrefix" :is-manager="isManager" @edit="$emit('edit', $event)" @cancel="$emit('cancel', $event)" @mgmt-waitlist="$emit('mgmt-waitlist', $event)" @mgmt-confirm="$emit('mgmt-confirm', $event)" @mgmt-remove="$emit('mgmt-remove', $event)" />
          </div>
          <template v-if="waitingMales.length">
            <div class="flex items-center gap-2 my-1.5">
              <div class="flex-1 h-px bg-gray-200"></div>
              <span class="text-xs text-gray-400 shrink-0">{{ isZh ? '候補' : 'Waitlist' }}</span>
              <div class="flex-1 h-px bg-gray-200"></div>
            </div>
            <div class="space-y-1">
              <SignupItem v-for="(s, i) in waitingMales" :key="s.id" :signup="s" :is-wait="true" :pos-label="waitPrefix + (i + 1)" :signups="signups" :user="user" :is-zh="isZh" :wait-prefix="waitPrefix" :is-manager="isManager" @edit="$emit('edit', $event)" @cancel="$emit('cancel', $event)" @mgmt-waitlist="$emit('mgmt-waitlist', $event)" @mgmt-confirm="$emit('mgmt-confirm', $event)" @mgmt-remove="$emit('mgmt-remove', $event)" />
            </div>
          </template>
        </div>
        <div v-if="females.length" class="mb-2">
          <div class="text-xs font-semibold text-pink-500 px-1 mt-2 mb-1">
            ♀ {{ isZh ? '女生' : 'Female' }}{{ femaleLimit > 0 ? ` (${confirmedFemales.length}/${femaleLimit})` : ` (${females.length})` }}
          </div>
          <div class="space-y-1">
            <SignupItem v-for="(s, i) in confirmedFemales" :key="s.id" :signup="{ ...s, position: i + 1 }" :is-wait="false" :signups="signups" :user="user" :is-zh="isZh" :wait-prefix="waitPrefix" :is-manager="isManager" @edit="$emit('edit', $event)" @cancel="$emit('cancel', $event)" @mgmt-waitlist="$emit('mgmt-waitlist', $event)" @mgmt-confirm="$emit('mgmt-confirm', $event)" @mgmt-remove="$emit('mgmt-remove', $event)" />
          </div>
          <template v-if="waitingFemales.length">
            <div class="flex items-center gap-2 my-1.5">
              <div class="flex-1 h-px bg-gray-200"></div>
              <span class="text-xs text-gray-400 shrink-0">{{ isZh ? '候補' : 'Waitlist' }}</span>
              <div class="flex-1 h-px bg-gray-200"></div>
            </div>
            <div class="space-y-1">
              <SignupItem v-for="(s, i) in waitingFemales" :key="s.id" :signup="s" :is-wait="true" :pos-label="waitPrefix + (i + 1)" :signups="signups" :user="user" :is-zh="isZh" :wait-prefix="waitPrefix" :is-manager="isManager" @edit="$emit('edit', $event)" @cancel="$emit('cancel', $event)" @mgmt-waitlist="$emit('mgmt-waitlist', $event)" @mgmt-confirm="$emit('mgmt-confirm', $event)" @mgmt-remove="$emit('mgmt-remove', $event)" />
            </div>
          </template>
        </div>
        <div v-if="others.length" class="mb-2">
          <div class="text-xs font-semibold text-gray-400 px-1 mt-2 mb-1">{{ isZh ? '不限' : 'Other' }}</div>
          <div class="space-y-1">
            <SignupItem v-for="s in others" :key="s.id" :signup="s" :is-wait="limit > 0 && s.position > limit" :signups="signups" :user="user" :is-zh="isZh" :wait-prefix="waitPrefix" :is-manager="isManager" @edit="$emit('edit', $event)" @cancel="$emit('cancel', $event)" @mgmt-waitlist="$emit('mgmt-waitlist', $event)" @mgmt-confirm="$emit('mgmt-confirm', $event)" @mgmt-remove="$emit('mgmt-remove', $event)" />
          </div>
        </div>
      </template>

      <!-- Non-mixed: flat confirmed + waitlist -->
      <template v-else>
        <div class="space-y-1">
          <SignupItem v-for="(s, i) in confirmed" :key="s.id" :signup="{ ...s, position: i + 1 }" :is-wait="false" :signups="signups" :user="user" :is-zh="isZh" :wait-prefix="waitPrefix" :is-manager="isManager" @edit="$emit('edit', $event)" @cancel="$emit('cancel', $event)" @mgmt-waitlist="$emit('mgmt-waitlist', $event)" @mgmt-confirm="$emit('mgmt-confirm', $event)" @mgmt-remove="$emit('mgmt-remove', $event)" />
        </div>
        <template v-if="waitlist.length">
          <div class="flex items-center gap-2 my-1.5">
            <div class="flex-1 h-px bg-gray-200"></div>
            <span class="text-xs text-gray-400 shrink-0">{{ isZh ? '候補' : 'Waitlist' }}</span>
            <div class="flex-1 h-px bg-gray-200"></div>
          </div>
          <div class="space-y-1">
            <SignupItem v-for="(s, i) in waitlist" :key="s.id" :signup="s" :is-wait="true" :pos-label="waitPrefix + (i + 1)" :signups="signups" :user="user" :is-zh="isZh" :wait-prefix="waitPrefix" :is-manager="isManager" @edit="$emit('edit', $event)" @cancel="$emit('cancel', $event)" @mgmt-waitlist="$emit('mgmt-waitlist', $event)" @mgmt-confirm="$emit('mgmt-confirm', $event)" @mgmt-remove="$emit('mgmt-remove', $event)" />
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import SignupItem from './SignupItem.vue';

const props = defineProps({
  signups: { type: Array, default: () => [] },
  limit: { type: Number, default: 0 },
  maleLimit: { type: Number, default: 0 },
  femaleLimit: { type: Number, default: 0 },
  type: { type: String, default: '' },
  user: { type: Object, default: null },
  isZh: { type: Boolean, default: true },
  isManager: { type: Boolean, default: false },
});

defineEmits(['edit', 'cancel', 'mgmt-waitlist', 'mgmt-confirm', 'mgmt-remove']);

const waitPrefix = computed(() => props.isZh ? '候' : 'W');
const isMixed = computed(() => props.type === 'mixed');

const isWaitlisted = (s) =>
  !s.forceConfirmed && (s.forceWaitlisted || (props.limit > 0 && s.position > props.limit)) || !!s.genderWait;

const confirmed = computed(() => props.signups.filter(s => !isWaitlisted(s)));
const waitlist  = computed(() => props.signups.filter(s =>  isWaitlisted(s)));

const males   = computed(() => props.signups.filter(s => s.gender === 'male'));
const females = computed(() => props.signups.filter(s => s.gender === 'female'));
const others  = computed(() => props.signups.filter(s => s.gender !== 'male' && s.gender !== 'female'));

const confirmedMales  = computed(() => males.value.filter(s => !s.genderWait));
const waitingMales    = computed(() => males.value.filter(s =>  s.genderWait));
const confirmedFemales = computed(() => females.value.filter(s => !s.genderWait));
const waitingFemales   = computed(() => females.value.filter(s =>  s.genderWait));

const ownIsWaitlisted = computed(() =>
  !!props.user && props.signups.some(s => s.uid === props.user.id && isWaitlisted(s))
);
</script>
