<template>
  <div class="flex gap-1.5">
    <!-- AM / PM -->
    <select v-model="period" :class="selectClass" style="flex:0 0 auto;width:5rem">
      <option value="AM">{{ isZh ? '上午' : 'AM' }}</option>
      <option value="PM">{{ isZh ? '下午' : 'PM' }}</option>
    </select>
    <!-- Hour -->
    <select v-model="hour12" :class="selectClass" style="flex:0 0 auto;width:4.5rem">
      <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
    </select>
    <!-- Minute -->
    <select v-model="minute" :class="selectClass" style="flex:0 0 auto;width:4.5rem">
      <option v-for="m in minutes" :key="m" :value="m">:{{ m }}</option>
    </select>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' }, // HH:MM 24h format
  isZh: { type: Boolean, default: true },
  selectClass: { type: [String, Array, Object], default: 'border border-gray-200 rounded-xl px-2 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300' },
});
const emit = defineEmits(['update:modelValue']);

const hours   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function parse(val) {
  if (!val) return { period: 'AM', hour12: '06', minute: '00' };
  const [hStr, mStr] = val.split(':');
  const h = parseInt(hStr, 10);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { period, hour12: String(h12).padStart(2, '0'), minute: mStr || '00' };
}

const parsed = parse(props.modelValue);
const period  = ref(parsed.period);
const hour12  = ref(parsed.hour12);
const minute  = ref(parsed.minute);

function to24h() {
  let h = parseInt(hour12.value, 10);
  if (period.value === 'AM') { if (h === 12) h = 0; }
  else { if (h !== 12) h += 12; }
  return `${String(h).padStart(2, '0')}:${minute.value}`;
}

watch([period, hour12, minute], () => emit('update:modelValue', to24h()));

watch(() => props.modelValue, (val) => {
  if (!val) return;
  const p = parse(val);
  period.value  = p.period;
  hour12.value  = p.hour12;
  minute.value  = p.minute;
});
</script>
