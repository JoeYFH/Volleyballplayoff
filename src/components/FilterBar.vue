<template>
  <div>
    <div class="flex gap-1.5 mt-3 overflow-x-auto pb-0.5">
      <button
        v-for="s in statusOptions"
        :key="s.value"
        @click="emit('update:statusFilter', s.value)"
        :class="statusFilter === s.value ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'"
        class="text-xs font-semibold px-3 py-1.5 rounded-xl transition shrink-0"
      >{{ s.label }}</button>
    </div>

    <div class="flex gap-1.5 mt-2 overflow-x-auto pb-0.5">
      <button
        v-for="g in genderOptions"
        :key="g.value"
        @click="emit('update:genderFilter', g.value)"
        :class="genderFilter === g.value ? 'bg-indigo-600 text-white font-semibold' : 'bg-white border border-gray-200 text-gray-500 hover:border-indigo-300'"
        class="text-xs px-3 py-1 rounded-lg transition shrink-0"
      >{{ g.label }}</button>

      <select
        :value="sortType"
        @change="emit('update:sortType', $event.target.value)"
        class="ml-auto text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-300 shrink-0"
      >
        <option value="date">{{ isZh ? '📅 日期' : '📅 Date' }}</option>
        <option value="closeAt">{{ isZh ? '⏰ 截止' : '⏰ Close' }}</option>
      </select>

      <select
        :value="sortDir"
        @change="emit('update:sortDir', $event.target.value)"
        class="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-300 shrink-0"
      >
        <option value="asc">{{ isZh ? '近→遠' : 'Near→Far' }}</option>
        <option value="desc">{{ isZh ? '遠→近' : 'Far→Near' }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '@/lib/i18n.js';

const { lang } = useI18n();
const isZh = computed(() => lang.value === 'zh');

defineProps({
  statusFilter: { type: String, default: 'open' },
  genderFilter: { type: String, default: 'all' },
  sortType: { type: String, default: 'date' },
  sortDir: { type: String, default: 'asc' },
});

const emit = defineEmits(['update:statusFilter', 'update:genderFilter', 'update:sortType', 'update:sortDir']);

const statusOptions = computed(() => [
  { value: 'all',  label: isZh.value ? '所有' : 'All' },
  { value: 'open', label: isZh.value ? '報名中' : 'Open' },
  { value: 'past', label: isZh.value ? '過去' : 'Past' },
]);

const genderOptions = computed(() => [
  { value: 'all',    label: isZh.value ? '全部'   : 'All' },
  { value: 'male',   label: isZh.value ? '♂ 男生' : '♂ Male' },
  { value: 'female', label: isZh.value ? '♀ 女生' : '♀ Female' },
  { value: 'mixed',  label: isZh.value ? '⚥ 混排' : '⚥ Mixed' },
]);
</script>
