<template>
  <div class="fixed inset-0 z-40">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50" @click="$emit('close')"></div>

    <!-- Bottom Sheet -->
    <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl flex flex-col"
         style="max-height: min(92vh, 92dvh)">

      <!-- Header -->
      <div class="flex-none px-5 py-4 flex items-center justify-between border-b border-gray-100 bg-white rounded-t-2xl">
        <h2 class="font-bold text-gray-800">
          {{ isEdit ? (isZh ? '✏️ 編輯場次' : '✏️ Edit Session') : (isZh ? '🏐 建立新場次' : '🏐 Create Session') }}
        </h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
      </div>

      <!-- Scrollable Body -->
      <div class="flex-1 min-h-0 overflow-y-auto" style="overscroll-behavior-y: contain">
        <div class="px-5 py-4 space-y-4">

          <!-- 0. Templates -->
          <div v-if="!isEdit && templates.length" class="bg-indigo-50 rounded-xl p-3">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-semibold text-indigo-700">📑 {{ isZh ? '我的範本' : 'My Templates' }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button v-for="tpl in templates" :key="tpl.id"
                @click="loadTemplate(tpl)"
                class="flex items-center gap-1 text-xs bg-white border border-indigo-200 text-indigo-700 rounded-lg px-2.5 py-1.5 hover:bg-indigo-100 transition">
                {{ tpl.name }}
                <span @click.stop="deleteTemplate(tpl.id)" class="text-indigo-300 hover:text-red-400 ml-1">✕</span>
              </button>
            </div>
          </div>

          <!-- 1. Session Title -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">
              {{ isZh ? '場次名稱' : 'Session Title' }} <span class="text-red-400">*</span>
            </label>
            <input v-model="title" type="text" maxlength="200"
              :placeholder="isZh ? '例：第15週臨打' : 'e.g. Week 15 Pickup'"
              :class="inputClass(!!titleError)"
              @input="titleError = ''" />
            <p v-if="titleError" class="mt-1 text-xs text-red-500">{{ titleError }}</p>
          </div>

          <!-- 2 & 3. Date + Time -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                {{ isZh ? '日期' : 'Date' }} <span class="text-red-400">*</span>
              </label>
              <input v-model="date" type="date"
                :class="inputClass(!!dateError)"
                @change="dateError = ''" />
              <p v-if="dateError" class="mt-1 text-xs text-red-500">{{ dateError }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                {{ isZh ? '時間' : 'Time' }} <span class="text-red-400">*</span>
              </label>
              <input v-model="time" type="time"
                :class="inputClass(!!timeError)"
                @change="timeError = ''" />
              <p v-if="timeError" class="mt-1 text-xs text-red-500">{{ timeError }}</p>
            </div>
          </div>

          <!-- 4. Location -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">
              {{ isZh ? '地點' : 'Location' }} <span class="text-red-400">*</span>
            </label>
            <input v-model="location" type="text" maxlength="300"
              :placeholder="isZh ? '輸入完整地址或場館名稱' : 'Enter full address or venue name'"
              :class="inputClass(!!locationError)"
              @input="locationError = ''" />
            <p v-if="locationError" class="mt-1 text-xs text-red-500">{{ locationError }}</p>
          </div>

          <!-- 5. Venue Details -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">
              {{ isZh ? '場地說明（選填）' : 'Venue Details (optional)' }}
            </label>
            <input v-model="venue" type="text" maxlength="300"
              :placeholder="isZh ? '例：B1 室內球場4號場' : 'e.g. Court B1, Indoor Hall'"
              :class="inputClass(false)" />
          </div>

          <!-- 6. Player Limit -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">
              {{ isZh ? '人數上限（0 = 不限）' : 'Player Limit (0 = unlimited)' }}
            </label>
            <input v-model.number="limit" type="number" min="0" max="999"
              :class="inputClass(false)" />
          </div>

          <!-- 7. Session Type -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">
              {{ isZh ? '性別分類' : 'Category' }}
            </label>
            <select v-model="type" :class="inputClass(false)">
              <option value="mixed">{{ isZh ? '混排' : 'Mixed' }}</option>
              <option value="male">{{ isZh ? '男生' : 'Male' }}</option>
              <option value="female">{{ isZh ? '女生' : 'Female' }}</option>
            </select>
          </div>

          <!-- 8. Male / Female Limits (mixed only) -->
          <div v-if="type === 'mixed'" class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                {{ isZh ? '男生名額' : 'Male Slots' }}
              </label>
              <input v-model.number="maleLimit" type="number" min="0" max="999"
                :class="inputClass(!!genderLimitError)"
                @input="genderLimitError = ''" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                {{ isZh ? '女生名額' : 'Female Slots' }}
              </label>
              <input v-model.number="femaleLimit" type="number" min="0" max="999"
                :class="inputClass(!!genderLimitError)"
                @input="genderLimitError = ''" />
            </div>
            <p v-if="genderLimitError" class="col-span-2 text-xs text-red-500">{{ genderLimitError }}</p>
          </div>

          <!-- 9. Equipment Chips -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-2">
              {{ isZh ? '需攜帶裝備' : 'Required Equipment' }}
            </label>
            <div class="flex flex-wrap gap-2 mb-2">
              <button v-for="item in allEquipItems" :key="item" type="button"
                @click="toggleEquip(item)"
                :class="equipment.includes(item)
                  ? 'text-xs px-3 py-1.5 rounded-full border border-indigo-500 bg-indigo-500 text-white transition'
                  : 'text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition'">
                {{ equipLabel(item) }}
              </button>
            </div>
            <!-- Custom equipment input -->
            <div class="flex gap-2">
              <input v-model="customEquipInput" type="text" maxlength="50"
                :placeholder="isZh ? '新增自訂裝備' : 'Add custom item'"
                class="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                @keydown.enter.prevent="addCustomEquip" />
              <button type="button" @click="addCustomEquip"
                class="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-xl transition">
                {{ isZh ? '新增' : 'Add' }}
              </button>
            </div>
          </div>

          <!-- 10. Open Signup Time -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">
              {{ isZh ? '開放報名時間' : 'Open Signup Time' }}
            </label>
            <select v-model="openWhen" :class="inputClass(false)">
              <option value="now">{{ isZh ? '立即開放' : 'Open Immediately' }}</option>
              <option value="hours">{{ isZh ? '開賽前 N 小時' : 'N Hours Before' }}</option>
              <option value="days">{{ isZh ? '開賽前 N 天' : 'N Days Before' }}</option>
              <option value="custom">{{ isZh ? '指定時間' : 'Custom Time' }}</option>
            </select>
            <div v-if="openWhen === 'hours'" class="mt-2 flex items-center gap-2">
              <input v-model.number="openOffset" type="number" min="1" max="999"
                class="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              <span class="text-sm text-gray-500">{{ isZh ? '小時前' : 'hours before' }}</span>
            </div>
            <div v-if="openWhen === 'days'" class="mt-2 flex items-center gap-2">
              <input v-model.number="openOffset" type="number" min="1" max="365"
                class="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              <span class="text-sm text-gray-500">{{ isZh ? '天前' : 'days before' }}</span>
            </div>
            <div v-if="openWhen === 'custom'" class="mt-2">
              <input v-model="openAtCustom" type="datetime-local"
                :class="inputClass(false)" />
            </div>
          </div>

          <!-- 11. Close Signup Time -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">
              {{ isZh ? '結束報名時間' : 'Close Signup Time' }}
            </label>
            <select v-model="closeWhen" :class="inputClass(false)">
              <option value="gameStart">{{ isZh ? '活動開始時間（預設）' : 'Game Start (default)' }}</option>
              <option value="hours">{{ isZh ? '開賽前 N 小時' : 'N Hours Before' }}</option>
              <option value="days">{{ isZh ? '開賽前 N 天' : 'N Days Before' }}</option>
              <option value="custom">{{ isZh ? '指定時間' : 'Custom Time' }}</option>
            </select>
            <div v-if="closeWhen === 'hours'" class="mt-2 flex items-center gap-2">
              <input v-model.number="closeOffset" type="number" min="1" max="999"
                class="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              <span class="text-sm text-gray-500">{{ isZh ? '小時前' : 'hours before' }}</span>
            </div>
            <div v-if="closeWhen === 'days'" class="mt-2 flex items-center gap-2">
              <input v-model.number="closeOffset" type="number" min="1" max="365"
                class="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              <span class="text-sm text-gray-500">{{ isZh ? '天前' : 'days before' }}</span>
            </div>
            <div v-if="closeWhen === 'custom'" class="mt-2">
              <input v-model="closeAtCustom" type="datetime-local"
                :class="inputClass(false)" />
            </div>
          </div>

          <!-- 12. Private Session -->
          <div class="flex items-center gap-2">
            <input type="checkbox" id="privateChk" v-model="isPrivate"
              class="w-4 h-4 accent-indigo-600" />
            <label for="privateChk" class="text-sm text-gray-600">
              {{ isZh ? '🔒 私人場次（不公開顯示）' : '🔒 Private Session (hidden)' }}
            </label>
          </div>

          <!-- 13. Note -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">
              {{ isZh ? '備註（選填）' : 'Notes (optional)' }}
            </label>
            <div class="mb-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              ⚠️ {{ isZh ? '只有開場者能看到備註內容' : 'Only the session creator can see notes' }}
            </div>
            <textarea v-model="note" rows="3" maxlength="1000"
              :placeholder="isZh ? '其他說明...' : 'Other info...'"
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"></textarea>
          </div>

          <!-- Save as template -->
          <button v-if="!isEdit" @click="saveTemplate"
            class="w-full border border-indigo-200 text-indigo-600 rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-50 transition">
            📑 {{ isZh ? '儲存為範本' : 'Save as Template' }}
          </button>

          <!-- Submit Button -->
          <button @click="submit" :disabled="submitting"
            class="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60">
            {{ submitting
              ? (isZh ? '儲存中...' : 'Saving...')
              : isEdit
                ? (isZh ? '💾 儲存變更' : '💾 Save Changes')
                : (isZh ? '🚀 建立場次' : '🚀 Create Session') }}
          </button>

          <!-- Bottom padding -->
          <div class="h-2"></div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '@/lib/i18n.js';
import { useAuth } from '@/composables/useAuth.js';
import { supabase } from '@/lib/supabase.js';
import { sessionToRow } from '@/composables/useSessions.js';

// ── Props & Emits ──────────────────────────────────────────────────────────────
const props = defineProps({
  editSession: { type: Object, default: null },
});
const emit = defineEmits(['close', 'created', 'updated']);

// ── i18n / auth ────────────────────────────────────────────────────────────────
const { lang } = useI18n();
const { user } = useAuth();
const isZh = computed(() => lang.value === 'zh');
const isEdit = computed(() => !!props.editSession);

// ── Default equipment chips ────────────────────────────────────────────────────
const DEFAULT_EQUIP = ['標竿', '音響', '球'];
const EQUIP_EN = { '標竿': 'Poles', '音響': 'Speaker', '球': 'Ball' };
function equipLabel(item) { return isZh.value ? item : (EQUIP_EN[item] || item); }

// ── Form state ─────────────────────────────────────────────────────────────────
const title        = ref('');
const date         = ref('');
const time         = ref('');
const location     = ref('');
const venue        = ref('');
const limit        = ref(0);
const type         = ref('mixed');
const maleLimit    = ref(0);
const femaleLimit  = ref(0);
const equipment    = ref([]);
const customEquipItems = ref([]); // extra chips beyond defaults
const customEquipInput = ref('');
const note         = ref('');
const isPrivate    = ref(false);

// Open/close timing
const openWhen     = ref('now');      // 'now' | 'hours' | 'days' | 'custom'
const openOffset   = ref(24);
const openAtCustom = ref('');
const closeWhen    = ref('gameStart'); // 'gameStart' | 'hours' | 'days' | 'custom'
const closeOffset  = ref(1);
const closeAtCustom = ref('');

// Validation errors
const titleError       = ref('');
const dateError        = ref('');
const timeError        = ref('');
const locationError    = ref('');
const genderLimitError = ref('');

const submitting = ref(false);

// ── All equipment chips (defaults + custom) ────────────────────────────────────
const allEquipItems = computed(() => [...DEFAULT_EQUIP, ...customEquipItems.value]);

function toggleEquip(item) {
  const idx = equipment.value.indexOf(item);
  if (idx === -1) equipment.value = [...equipment.value, item];
  else equipment.value = equipment.value.filter(e => e !== item);
}

function addCustomEquip() {
  const val = customEquipInput.value.trim();
  if (!val) return;
  if (!allEquipItems.value.includes(val)) {
    customEquipItems.value = [...customEquipItems.value, val];
  }
  if (!equipment.value.includes(val)) {
    equipment.value = [...equipment.value, val];
  }
  customEquipInput.value = '';
}

// ── Edit mode: initialise fields from editSession ─────────────────────────────
if (props.editSession) {
  const s = props.editSession;
  title.value      = s.title       || '';
  date.value       = s.date        || '';
  time.value       = s.time        || '';
  location.value   = s.location    || '';
  venue.value      = s.venue       || '';
  limit.value      = s.limit       ?? 0;
  type.value       = s.type        || 'mixed';
  maleLimit.value  = s.maleLimit   ?? 0;
  femaleLimit.value = s.femaleLimit ?? 0;
  equipment.value  = [...(s.equipment || [])];
  note.value       = s.note        || '';
  isPrivate.value  = !!s.isPrivate;

  // Chips outside the defaults
  customEquipItems.value = (s.equipment || []).filter(e => !DEFAULT_EQUIP.includes(e));

  // Reverse-engineer openWhen
  if (s.isOpen && !s.openAt) {
    openWhen.value = 'now';
  } else if (s.openAt) {
    openWhen.value = 'custom';
    // Convert ISO string to datetime-local format
    const d = new Date(s.openAt);
    openAtCustom.value = toDatetimeLocal(d);
  }

  // Reverse-engineer closeWhen
  if (s.closeAt) {
    const gameMs = s.date && s.time
      ? new Date(`${s.date}T${s.time}:00`).getTime()
      : null;
    const closeMs = new Date(s.closeAt).getTime();
    if (gameMs && Math.abs(closeMs - gameMs) < 60000) {
      closeWhen.value = 'gameStart';
    } else {
      closeWhen.value = 'custom';
      closeAtCustom.value = toDatetimeLocal(new Date(s.closeAt));
    }
  } else {
    closeWhen.value = 'gameStart';
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function toDatetimeLocal(d) {
  // Returns "YYYY-MM-DDTHH:MM" for a datetime-local input
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function gameDateMs() {
  if (!date.value || !time.value) return null;
  return new Date(`${date.value}T${time.value}:00`).getTime();
}

function computedOpenAt() {
  const now = new Date();
  let openAt = null;
  let isOpen = false;

  if (openWhen.value === 'now') {
    isOpen = true;
    openAt = null;
  } else if (openWhen.value === 'hours') {
    const gameMs = gameDateMs();
    if (gameMs) {
      openAt = new Date(gameMs - openOffset.value * 3600000).toISOString();
      isOpen = new Date(openAt) <= now;
    }
  } else if (openWhen.value === 'days') {
    const gameMs = gameDateMs();
    if (gameMs) {
      openAt = new Date(gameMs - openOffset.value * 86400000).toISOString();
      isOpen = new Date(openAt) <= now;
    }
  } else if (openWhen.value === 'custom') {
    if (openAtCustom.value) {
      openAt = new Date(openAtCustom.value).toISOString();
      isOpen = new Date(openAt) <= now;
    }
  }

  return { openAt, isOpen };
}

function computedCloseAt() {
  if (closeWhen.value === 'gameStart') {
    if (date.value && time.value) {
      return new Date(`${date.value}T${time.value}:00`).toISOString();
    }
    return null;
  }
  const gameMs = gameDateMs();
  if (closeWhen.value === 'hours') {
    if (gameMs) return new Date(gameMs - closeOffset.value * 3600000).toISOString();
  } else if (closeWhen.value === 'days') {
    if (gameMs) return new Date(gameMs - closeOffset.value * 86400000).toISOString();
  } else if (closeWhen.value === 'custom') {
    if (closeAtCustom.value) return new Date(closeAtCustom.value).toISOString();
  }
  return null;
}

// ── Validation ─────────────────────────────────────────────────────────────────
function validate() {
  let ok = true;
  titleError.value    = '';
  dateError.value     = '';
  timeError.value     = '';
  locationError.value = '';
  genderLimitError.value = '';

  if (!title.value.trim()) {
    titleError.value = isZh.value ? '請填入場次名稱' : 'Title is required';
    ok = false;
  }
  if (!date.value) {
    dateError.value = isZh.value ? '請選擇日期' : 'Date is required';
    ok = false;
  }
  if (!time.value) {
    timeError.value = isZh.value ? '請選擇時間' : 'Time is required';
    ok = false;
  }
  if (!location.value.trim()) {
    locationError.value = isZh.value ? '請填入地點' : 'Location is required';
    ok = false;
  }
  if (type.value === 'mixed' && limit.value > 0) {
    const ml = maleLimit.value || 0;
    const fl = femaleLimit.value || 0;
    if ((ml > 0 || fl > 0) && ml + fl !== limit.value) {
      genderLimitError.value = isZh.value
        ? `男生(${ml}) + 女生(${fl}) = ${ml + fl}，必須等於總人數上限(${limit.value})`
        : `Male(${ml}) + Female(${fl}) = ${ml + fl}, must equal total limit(${limit.value})`;
      ok = false;
    }
  }
  return ok;
}

// ── Input class helper ─────────────────────────────────────────────────────────
function inputClass(hasError) {
  return [
    'w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2',
    hasError
      ? 'border-red-400 ring-2 ring-red-200 focus:ring-red-300'
      : 'border-gray-200 focus:ring-indigo-300',
  ].join(' ');
}

// ── Templates ─────────────────────────────────────────────────────────────────
const templates = ref([]);

onMounted(async () => {
  if (!user.value) return;
  const { data } = await supabase.from('templates').select('*')
    .eq('user_id', user.value.id).order('created_at', { ascending: false });
  templates.value = data || [];
});

function currentFormData() {
  return {
    title: title.value, location: location.value, venue: venue.value,
    limit: limit.value, type: type.value,
    maleLimit: maleLimit.value, femaleLimit: femaleLimit.value,
    equipment: [...equipment.value], customEquipItems: [...customEquipItems.value],
    note: note.value, isPrivate: isPrivate.value, time: time.value,
    openWhen: openWhen.value, openOffset: openOffset.value,
    closeWhen: closeWhen.value, closeOffset: closeOffset.value,
  };
}

async function saveTemplate() {
  if (!user.value) return;
  const name = prompt(isZh.value ? '範本名稱：' : 'Template name:');
  if (!name?.trim()) return;
  const { data, error } = await supabase.from('templates').insert({
    user_id: user.value.id,
    name: name.trim(),
    data: currentFormData(),
  }).select().single();
  if (error) { alert('Error: ' + error.message); return; }
  templates.value = [data, ...templates.value];
}

function loadTemplate(tpl) {
  const d = tpl.data;
  title.value        = d.title || '';
  location.value     = d.location || '';
  venue.value        = d.venue || '';
  limit.value        = d.limit ?? 0;
  type.value         = d.type || 'mixed';
  maleLimit.value    = d.maleLimit ?? 0;
  femaleLimit.value  = d.femaleLimit ?? 0;
  equipment.value    = [...(d.equipment || [])];
  customEquipItems.value = [...(d.customEquipItems || [])];
  note.value         = d.note || '';
  isPrivate.value    = !!d.isPrivate;
  if (d.time) time.value = d.time;
  if (d.openWhen) openWhen.value = d.openWhen;
  if (d.openOffset) openOffset.value = d.openOffset;
  if (d.closeWhen) closeWhen.value = d.closeWhen;
  if (d.closeOffset) closeOffset.value = d.closeOffset;
}

async function deleteTemplate(id) {
  await supabase.from('templates').delete().eq('id', id);
  templates.value = templates.value.filter(t => t.id !== id);
}

// ── Submit ─────────────────────────────────────────────────────────────────────
async function submit() {
  if (!validate()) return;

  const { openAt, isOpen } = computedOpenAt();
  const closeAt = computedCloseAt();

  const payload = {
    title:    title.value.trim(),
    date:     date.value,
    time:     time.value,
    location: location.value.trim(),
    venue:    venue.value.trim() || null,
    limit:    limit.value || 0,
    type:     type.value,
    maleLimit:   type.value === 'mixed' ? (maleLimit.value || 0) : 0,
    femaleLimit: type.value === 'mixed' ? (femaleLimit.value || 0) : 0,
    equipment: equipment.value,
    note:     note.value.trim() || null,
    isOpen,
    isPrivate: isPrivate.value,
    openAt,
    closeAt,
  };

  submitting.value = true;
  try {
    if (isEdit.value) {
      // Edit mode
      const { error } = await supabase
        .from('sessions')
        .update(sessionToRow(payload))
        .eq('id', props.editSession.id);
      if (error) throw error;
      emit('updated');
      emit('close');
    } else {
      // Create mode
      const { data: row, error } = await supabase
        .from('sessions')
        .insert(sessionToRow({
          ...payload,
          createdBy:    user.value.id,
          creatorName:  user.value.user_metadata?.full_name
                        || user.value.user_metadata?.name
                        || user.value.email,
          creatorPhoto: user.value.user_metadata?.avatar_url || null,
        }))
        .select()
        .single();
      if (error) throw error;
      emit('created', row);
      emit('close');
    }
  } catch (e) {
    alert(
      (isZh.value ? '❌ 儲存失敗' : '❌ Save failed')
      + (e.message ? `\n${e.message}` : '')
    );
  } finally {
    submitting.value = false;
  }
}
</script>
