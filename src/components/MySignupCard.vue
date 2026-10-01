<template>
  <div :class="['bg-white rounded-2xl shadow-sm border p-4 fade-in', isProxy ? 'border-purple-100' : 'border-gray-100']">
    <!-- Title + badges row -->
    <div class="flex items-start justify-between gap-2 mb-1">
      <div>
        <p class="font-bold text-gray-800">{{ title }}</p>
        <div v-if="sess?.creatorName" class="flex items-center gap-1.5 mt-0.5">
          <img v-if="sess.creatorPhoto" :src="sess.creatorPhoto" class="w-4 h-4 rounded-full border border-gray-200 shrink-0" alt="" onerror="this.style.display='none'" />
          <p class="text-xs text-gray-400">{{ isZh ? '舉辦人' : 'By' }}: {{ sess.creatorName }}</p>
        </div>
      </div>
      <div class="flex flex-col items-end gap-1 shrink-0">
        <!-- Session status badge -->
        <span v-if="isPast" class="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">{{ isZh ? '已結束' : 'Ended' }}</span>
        <span v-else-if="sess?.isOpen" class="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700">{{ isZh ? '報名中' : 'Open' }}</span>
        <span v-else class="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">{{ isZh ? '已截止' : 'Closed' }}</span>
        <!-- Waitlist badge -->
        <span v-if="item.isWaitlisted" class="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-500 font-medium">⏳ {{ waitlistLabel }}</span>
        <!-- Private badge -->
        <span v-if="sess?.isPrivate" class="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">🔒 {{ isZh ? '私人' : 'Private' }}</span>
        <span v-else-if="sess" class="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-400">🌐 {{ isZh ? '公開' : 'Public' }}</span>
      </div>
    </div>

    <!-- Registrant type -->
    <div v-if="isProxy" class="flex items-start gap-1.5 mt-1 mb-2">
      <span class="shrink-0 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">👥 {{ isZh ? '代報' : 'Proxy' }}</span>
      <span class="text-sm font-semibold text-purple-800">{{ item.forFriend }}</span>
      <span v-if="item.name" class="text-xs text-gray-400">({{ isZh ? '由' : 'by' }} {{ item.name }})</span>
    </div>
    <div v-else class="flex items-center gap-1.5 mt-1 mb-2">
      <span class="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">🙋 {{ isZh ? '本人' : 'Self' }}</span>
      <span class="text-sm font-semibold text-gray-800">{{ item.name }}</span>
    </div>

    <!-- Tags -->
    <div v-if="tags.length" class="flex flex-wrap gap-1.5 mb-3">
      <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
    </div>

    <!-- Session info -->
    <div class="space-y-1.5 text-sm text-gray-600 mb-4">
      <div v-if="sess?.date" class="flex items-center gap-2"><span>📅</span><span>{{ formatDate(sess.date) }}</span></div>
      <div v-if="sess?.time" class="flex items-center gap-2"><span>🕐</span><span>{{ sess.time }}</span></div>
      <div v-if="sess?.location" class="flex items-center gap-2">
        <span>📍</span>
        <a :href="`https://maps.google.com/?q=${encodeURIComponent(sess.location)}`" target="_blank" class="text-indigo-500 hover:underline">{{ sess.location }}</a>
      </div>
      <div v-if="sess?.venue" class="flex items-center gap-2"><span>🏟️</span><span>{{ sess.venue }}</span></div>
      <div v-if="signedAtStr" class="flex items-center gap-2"><span>⏱️</span><span class="text-xs text-gray-400">{{ signedAtStr }}</span></div>
    </div>

    <!-- Calendar links (upcoming only) -->
    <div v-if="!isPast && sess?.date" class="flex flex-wrap gap-2 mb-3">
      <a :href="googleCalUrl" :target="calTarget"
        class="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-medium">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
        Google {{ isZh ? '日曆' : 'Calendar' }}
      </a>
      <a :href="appleCalUrl" download="event.ics"
        class="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition font-medium">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        Apple {{ isZh ? '日曆' : 'Calendar' }}
      </a>
    </div>

    <!-- Share button (upcoming open sessions) -->
    <button v-if="!isPast && sess?.isOpen" @click="$emit('share', { sessionId: item.sessionId })"
      class="flex items-center justify-center gap-1.5 w-full mt-2 text-xs text-gray-500 border border-gray-200 rounded-xl py-2 hover:bg-gray-50 hover:text-indigo-600 transition">
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
      {{ isZh ? '分享活動連結' : 'Share Link' }}
    </button>

    <!-- Cancel button (upcoming) / past notice -->
    <button v-if="!isPast" @click="$emit('cancel', { signupId: item.id })"
      class="w-full text-xs text-red-400 border border-red-100 rounded-xl py-2 hover:bg-red-50 transition mt-2">
      ✕ {{ isZh ? '取消報名' : 'Cancel Sign-up' }}
    </button>
    <p v-else class="text-center text-xs text-gray-300 mt-2">{{ isZh ? '已結束場次' : 'Past session' }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  item: { type: Object, required: true },
  isZh: { type: Boolean, default: true },
});

defineEmits(['cancel', 'share']);

const sess = computed(() => props.item.session);
const isProxy = computed(() => !!props.item.forFriend);
const isPast = computed(() => {
  const d = sess.value?.date || '';
  return d && d < new Date().toISOString().split('T')[0];
});

const title = computed(() => {
  if (sess.value?.title) return sess.value.title;
  if (sess.value?.date) return sess.value.date + (props.isZh ? ' 臨打' : ' Pickup');
  return '—';
});

const waitlistLabel = computed(() => {
  const { waitlistPosition: pos, waitlistGender: g } = props.item;
  if (pos > 0) {
    if (g === 'male') return props.isZh ? `男生備取第 ${pos} 個` : `Male Waitlist #${pos}`;
    if (g === 'female') return props.isZh ? `女生備取第 ${pos} 個` : `Female Waitlist #${pos}`;
    return props.isZh ? `備取第 ${pos} 個` : `Waitlist #${pos}`;
  }
  if (g === 'male') return props.isZh ? '男生候補中' : 'Male Waitlisted';
  if (g === 'female') return props.isZh ? '女生候補中' : 'Female Waitlisted';
  return props.isZh ? '候補中' : 'Waitlisted';
});

const tags = computed(() => {
  const result = [];
  if (props.item.isLate) {
    const unit = props.isZh ? '分鐘' : 'mins';
    result.push(props.isZh ? `晚到${props.item.lateTime ? ' +' + props.item.lateTime + unit : ''}` : `Late${props.item.lateTime ? ' +' + props.item.lateTime + unit : ''}`);
  }
  if (props.item.pairWith) result.push(`${props.isZh ? '搭檔' : 'Pair'}:${props.item.pairWith}`);
  (props.item.bringEquip || []).forEach(e => result.push(`🎒 ${e}`));
  return result;
});

const signedAtStr = computed(() => {
  if (!props.item.signedAt) return '';
  try {
    const dt = new Date(props.item.signedAt);
    const pad = n => String(n).padStart(2, '0');
    return props.isZh
      ? `${dt.getMonth() + 1}/${dt.getDate()} ${pad(dt.getHours())}:${pad(dt.getMinutes())} 報名`
      : `Signed ${dt.getMonth() + 1}/${dt.getDate()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  } catch { return ''; }
});

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  if (!props.isZh) return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short', year: 'numeric' });
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()} (週${days[dt.getDay()]})`;
}

// Calendar links
const calTarget = computed(() => /Android/i.test(navigator.userAgent) ? '_self' : '_blank');

const googleCalUrl = computed(() => {
  const s = sess.value;
  if (!s?.date) return '#';
  const [year, month, day] = s.date.split('-');
  const [hh, mm] = (s.time || '00:00').split(':');
  const start = new Date(year, month - 1, day, hh, mm);
  const end = new Date(start.getTime() + 2 * 3600000);
  const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const t = encodeURIComponent('🏐 ' + title.value);
  const dates = `${fmt(start)}/${fmt(end)}`;
  const loc = encodeURIComponent(s.location || '');
  const desc = encodeURIComponent((props.isZh ? '排球臨打 - ' : 'Volleyball Pickup - ') + title.value);
  const base = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${t}&dates=${dates}&details=${desc}&location=${loc}`;
  if (/Android/i.test(navigator.userAgent)) {
    return `intent://calendar.google.com/calendar/r/eventedit?text=${t}&dates=${dates}&details=${desc}&location=${loc}#Intent;scheme=https;package=com.google.android.calendar;S.browser_fallback_url=${encodeURIComponent(base)};end`;
  }
  return base;
});

const appleCalUrl = computed(() => {
  const s = sess.value;
  if (!s?.date) return '#';
  const [year, month, day] = s.date.split('-');
  const [hh, mm] = (s.time || '00:00').split(':');
  const start = new Date(year, month - 1, day, hh, mm);
  const end = new Date(start.getTime() + 2 * 3600000);
  const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const desc = (props.isZh ? '排球臨打 - ' : 'Volleyball Pickup - ') + title.value;
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:🏐 ${title.value}`,
    `LOCATION:${s.location || ''}`,
    `DESCRIPTION:${desc.replace(/\n/g, '\\n')}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\n');
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
});
</script>
