/**
 * session-form.js
 * Shared form fields template for "Create / Edit Session" sheet.
 * Both index.html and my-sessions.html import and inject this HTML so that
 * future field additions only need to happen in one place.
 *
 * Usage:
 *   import { sessionFormHTML } from './session-form.js';
 *   document.getElementById('formFieldsEl').innerHTML = sessionFormHTML(IDS, FNS);
 *
 * Then call initSessionFormEvents(IDS, FNS) after injection to wire up listeners.
 */

/**
 * Build form-fields HTML.
 * @param {Object} ids       - map of logical name → actual element id
 * @param {Object} fns       - map of event name → JS expression string (called inline)
 * @param {string} inputLang - lang attribute for date/time inputs (e.g. 'en-GB' or 'zh-TW')
 *                             Setting this at HTML-build time ensures Chrome uses the right locale.
 */
export function sessionFormHTML(ids, fns, inputLang = 'zh-TW') {
  const I = ids; // shorthand
  const dl = inputLang; // date lang
  const tl = inputLang; // time lang
  const F = fns;
  const zh = inputLang === 'zh-TW'; // for initial language of hardcoded strings
  return `
    <!-- Title -->
    <div>
      <label id="${I.lTitle}" class="block text-sm font-medium text-gray-600 mb-1">場次名稱 <span class="text-red-400">*</span></label>
      <input id="${I.title}" type="text" maxlength="30"
        class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      <p id="${I.titleErr}" class="hidden text-xs text-red-500 mt-1"></p>
    </div>

    <!-- Date + Time -->
    <div class="flex flex-col gap-3">
      <div>
        <label id="${I.lDate}" class="block text-sm font-medium text-gray-600 mb-1">日期 <span class="text-red-400">*</span></label>
        <input id="${I.date}" type="text" readonly
          class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <p id="${I.dateErr}" class="hidden text-xs text-red-500 mt-1"></p>
      </div>
      <div>
        <label id="${I.lTime}" class="block text-sm font-medium text-gray-600 mb-1">時間 <span class="text-red-400">*</span></label>
        <div class="flex items-center gap-1">
          <select id="${I.time}_h"
            onchange="document.getElementById('${I.time}').value=this.value+':'+document.getElementById('${I.time}_m').value"
            class="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-2 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
            ${Array.from({length:24},(_,i)=>`<option value="${String(i).padStart(2,'0')}">${String(i).padStart(2,'0')}</option>`).join('')}
          </select>
          <span class="text-gray-400 font-medium select-none">:</span>
          <select id="${I.time}_m"
            onchange="document.getElementById('${I.time}').value=document.getElementById('${I.time}_h').value+':'+this.value"
            class="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-2 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
            ${Array.from({length:12},(_,i)=>`<option value="${String(i*5).padStart(2,'0')}">${String(i*5).padStart(2,'0')}</option>`).join('')}
          </select>
        </div>
        <input type="hidden" id="${I.time}" value="00:00">
        <p id="${I.timeErr}" class="hidden text-xs text-red-500 mt-1"></p>
      </div>
    </div>

    <!-- Location with map search -->
    <div>
      <label id="${I.lLocation}" class="block text-sm font-medium text-gray-600 mb-1">地點 <span class="text-red-400">*</span></label>
      <div class="relative">
        <input id="${I.location}" type="text" autocomplete="off"
          class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <ul id="${I.mapSug}" class="hidden form-map-sug"></ul>
      </div>
      <p id="${I.locationHint}" class="text-xs text-gray-400 mt-1">${zh ? '請輸入完整地址或場館名稱，以取得最佳搜尋結果' : 'Enter a full address or venue name for best search results'}</p>
      <p id="${I.locationErr}" class="hidden text-xs text-red-500 mt-1"></p>
    </div>

    <!-- Venue -->
    <div>
      <label id="${I.lVenue}" class="block text-sm font-medium text-gray-600 mb-1">場地詳細（選填）</label>
      <input id="${I.venue}" type="text" maxlength="50"
        class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
    </div>

    <!-- Limit + Type -->
    <div class="grid grid-cols-2 gap-x-3 gap-y-1">
      <label id="${I.lLimit}" class="block text-sm font-medium text-gray-600 self-end">人數上限（0=不限）</label>
      <label id="${I.lType}" class="block text-sm font-medium text-gray-600 self-end">性別分類</label>
      <input id="${I.limit}" type="number" min="0" max="100" value="12"
        class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      <select id="${I.type}" onchange="${F.typeChange}"
        class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
        <option id="${I.oMixed}" value="mixed">混排</option>
        <option id="${I.oMale}" value="male">男生</option>
        <option id="${I.oFemale}" value="female">女生</option>
      </select>
    </div>

    <!-- Mixed session gender sub-limits -->
    <div id="${I.mixedLimitsRow}" class="hidden grid grid-cols-2 gap-x-3 gap-y-1">
      <label id="${I.lMaleLimit}" class="block text-sm font-medium text-gray-600 self-end">男生名額（0=不限）</label>
      <label id="${I.lFemaleLimit}" class="block text-sm font-medium text-gray-600 self-end">女生名額（0=不限）</label>
      <input id="${I.maleLimit}" type="number" min="0" max="100" value="0"
        class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      <input id="${I.femaleLimit}" type="number" min="0" max="100" value="0"
        class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
    </div>
    <p id="${I.maleLimitErr}" class="hidden text-xs text-red-500 -mt-2"></p>

    <!-- Equipment -->
    <div>
      <label id="${I.lEquip}" class="block text-sm font-medium text-gray-600 mb-2">需要攜帶的用具</label>
      <div class="flex flex-wrap gap-2 mb-2" id="${I.equipChips}">
        <button type="button" data-equip="標竿" class="${I.chipClass} text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition">🏁 標竿</button>
        <button type="button" data-equip="音響" class="${I.chipClass} text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition">🔊 音響</button>
        <button type="button" data-equip="球" class="${I.chipClass} text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition">🏐 球</button>
      </div>
      <div id="${I.customTagsList}" class="flex flex-wrap gap-1.5 mb-2 hidden"></div>
      <div class="flex gap-2">
        <input id="${I.equipCustom}" type="text" placeholder="${zh ? '新增用具名稱...' : 'Add item...'}"
          class="flex-1 min-w-0 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <button type="button" id="${I.addEquipBtn}" onclick="${F.addEquip}"
          class="shrink-0 px-3 py-2 bg-indigo-50 text-indigo-600 text-sm font-bold rounded-xl hover:bg-indigo-100 transition">＋</button>
      </div>
    </div>

    <!-- Open Time -->
    <div>
      <label id="${I.lOpenWhen}" class="block text-sm font-medium text-gray-600 mb-1">開放報名時間</label>
      <select id="${I.openWhen}" onchange="${F.openWhenChange}"
        class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-2">
        <option id="${I.oOpenNow}" value="now">立即開放</option>
        <option id="${I.oOpenHours}" value="hours">開賽前 N 小時</option>
        <option id="${I.oOpenDays}" value="days">開賽前 N 天</option>
        <option id="${I.oOpenCustom}" value="custom">指定時間</option>
      </select>
      <div id="${I.openOffsetRow}" class="hidden flex items-center gap-2">
        <input id="${I.openOffset}" type="number" min="1" max="999" value="1"
          class="w-24 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <span id="${I.openOffsetUnit}" class="text-sm text-gray-500">小時前</span>
      </div>
      <div id="${I.openAtRow}" class="hidden">
        <input id="${I.openAt}" type="text" readonly
          class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <p id="${I.openAtHint}" class="text-xs text-gray-400 mt-1">設定後報名頁面會顯示倒數計時</p>
      </div>
    </div>

    <!-- Close Time -->
    <div>
      <label id="${I.lCloseAt}" class="block text-sm font-medium text-gray-600 mb-1">結束報名時間（選填，預設為活動開始時間）</label>
      <select id="${I.closeWhen}" onchange="${F.closeWhenChange}"
        class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
        <option id="${I.oCloseGameStart}" value="game_start">直到活動開始</option>
        <option id="${I.oCloseHours}" value="hours">開賽前 N 小時</option>
        <option id="${I.oCloseDays}" value="days">開賽前 N 天</option>
        <option id="${I.oCloseCustom}" value="custom">指定時間</option>
      </select>
      <div id="${I.closeOffsetRow}" class="hidden mt-2 flex items-center gap-2">
        <input id="${I.closeOffset}" type="number" min="1" max="999" value="1"
          class="w-24 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <span id="${I.closeOffsetUnit}" class="text-sm text-gray-500">小時前</span>
      </div>
      <div id="${I.closeAtRow}" class="hidden mt-2">
        <input id="${I.closeAt}" type="text" readonly
          class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <p id="${I.closeAtHint}" class="text-xs text-gray-400 mt-1">到時自動關閉報名</p>
      </div>
    </div>

    <!-- Note -->
    <div>
      <label id="${I.lNote}" class="block text-sm font-medium text-gray-600 mb-1">備註（選填）</label>
      <p id="${I.noteHint}" class="text-xs text-amber-500 mb-1">⚠️ 此備註只有開場者能看到，不會顯示在公開報名頁面上</p>
      <textarea id="${I.note}" rows="2"
        class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"></textarea>
    </div>
  `;
}

/**
 * ID maps for each page. Import these along with sessionFormHTML.
 */
export const FORM_IDS_INDEX = {
  // labels
  lTitle: 'lTitle', lDate: 'lDate', lTime: 'lTime', lLocation: 'lLocation',
  lVenue: 'lVenue', lLimit: 'lLimit', lType: 'lType',
  lMaleLimit: 'lMaleLimit', lFemaleLimit: 'lFemaleLimit',
  lEquip: 'lEquip', lOpenWhen: 'lOpenWhen', lCloseAt: 'lCloseAt',
  lNote: 'lNote', noteHint: 'lNoteHint',
  // inputs
  title: 'fTitle', titleErr: 'fTitleErr',
  date: 'fDate', dateErr: 'fDateErr',
  time: 'fTime', timeErr: 'fTimeErr',
  location: 'fLocation', locationErr: 'fLocationErr', locationHint: 'fLocationHint', mapSug: 'mapSuggestions',
  venue: 'fVenue',
  limit: 'fLimit', type: 'fType',
  oMixed: 'oMixed', oMale: 'oMale', oFemale: 'oFemale',
  mixedLimitsRow: 'mixedLimitsRow', maleLimit: 'fMaleLimit', femaleLimit: 'fFemaleLimit',
  maleLimitErr: 'fMaleLimitErr',
  equipChips: 'equipChips', chipClass: 'equip-chip chip-idle',
  customTagsList: 'equipCustomList', equipCustom: 'fEquipCustom', addEquipBtn: 'addEquipBtn',
  openWhen: 'fOpenWhen', oOpenNow: 'oOpenNow', oOpenHours: 'oOpenHours',
  oOpenDays: 'oOpenDays', oOpenCustom: 'oOpenCustom',
  openOffsetRow: 'fOpenOffsetRow', openOffset: 'fOpenOffset', openOffsetUnit: 'fOpenOffsetUnit',
  openAtRow: 'fOpenAtRow', openAt: 'fOpenAt', openAtHint: 'hOpenAtHint',
  closeWhen: 'fCloseWhen', oCloseGameStart: 'oCloseGameStart', oCloseHours: 'oCloseHours',
  oCloseDays: 'oCloseDays', oCloseCustom: 'oCloseCustom',
  closeOffsetRow: 'fCloseOffsetRow', closeOffset: 'fCloseOffset', closeOffsetUnit: 'fCloseOffsetUnit',
  closeAtRow: 'fCloseAtRow', closeAt: 'fCloseAt', closeAtHint: 'hCloseAtHint',
  note: 'fNote',
};

export const FORM_IDS_MYSESSIONS = {
  // labels
  lTitle: 'sl0', lDate: 'sl1', lTime: 'sl2', lLocation: 'sl3',
  lVenue: 'sl4', lLimit: 'sl5', lType: 'sl6',
  lMaleLimit: 'sf_lMaleLimit', lFemaleLimit: 'sf_lFemaleLimit',
  lEquip: 'sl7', lOpenWhen: 'sl8', lCloseAt: 'sf_lCloseAt',
  lNote: 'sl9', noteHint: 'sf_noteHint',
  // inputs
  title: 'sf_title', titleErr: 'sf_titleErr',
  date: 'sf_date', dateErr: 'sf_dateErr',
  time: 'sf_time', timeErr: 'sf_timeErr',
  location: 'sf_location', locationErr: 'sf_locationErr', locationHint: 'sf_locationHint', mapSug: 'mapSuggestions2',
  venue: 'sf_venue',
  limit: 'sf_limit', type: 'sf_type',
  oMixed: 'sf_oMixed', oMale: 'sf_oMale', oFemale: 'sf_oFemale',
  mixedLimitsRow: 'sf_mixedLimitsRow', maleLimit: 'sf_maleLimit', femaleLimit: 'sf_femaleLimit',
  maleLimitErr: 'sf_mixedLimitErr',
  equipChips: 'sf_equipChips', chipClass: 'sf-chip',
  customTagsList: 'sf_customTagsList', equipCustom: 'sf_equipCustom', addEquipBtn: 'sfAddEquipBtn',
  openWhen: 'sf_openWhen', oOpenNow: 'sfOpenNow', oOpenHours: 'sfOpenHours',
  oOpenDays: 'sfOpenDays', oOpenCustom: 'sfOpenCustom',
  openOffsetRow: 'sf_offsetRow', openOffset: 'sf_offset', openOffsetUnit: 'sf_offsetUnit',
  openAtRow: 'sf_atRow', openAt: 'sf_openAt', openAtHint: 'sf_openAtHint',
  closeWhen: 'sf_closeWhen', oCloseGameStart: 'sfCloseGameStart', oCloseHours: 'sfCloseHours',
  oCloseDays: 'sfCloseDays', oCloseCustom: 'sfCloseCustom',
  closeOffsetRow: 'sf_closeOffsetRow', closeOffset: 'sf_closeOffset', closeOffsetUnit: 'sf_closeOffsetUnit',
  closeAtRow: 'sf_closeAtRow', closeAt: 'sf_closeAt', closeAtHint: 'sf_closeAtHint',
  note: 'sf_note',
};

export const FORM_FNS_INDEX = {
  typeChange: 'onTypeChange()',
  openWhenChange: 'onOpenWhenChange()',
  closeWhenChange: 'onCloseWhenChange()',
  addEquip: 'addCustomEquipItem()',
};

export const FORM_FNS_MYSESSIONS = {
  typeChange: 'sfOnTypeChange()',
  openWhenChange: 'onSfOpenWhenChange()',
  closeWhenChange: 'onSfCloseWhenChange()',
  addEquip: 'sfAddCustomEquip()',
};

/**
 * Initialize or update flatpickr on a form's date/time inputs.
 * Must be called after the form is injected into the DOM.
 * Requires flatpickr + flatpickr zh_tw locale to be loaded globally.
 *
 * @param {Object} ids   - FORM_IDS map
 * @param {string} lang  - 'zh' or 'en'
 */
export function initFormPickers(ids, lang) {
  if (!window.flatpickr) return;

  const isZh = lang === 'zh';
  // Use numeric-only formats — avoids any dependency on flatpickr locale's month names.
  // zh-tw.js loaded globally can override l10ns.default, so 'M j, Y' would still show
  // Chinese month names in English mode. Pure numbers are always locale-neutral.
  const dateFmt = isZh ? 'Y年n月j日' : 'n/j/Y';
  const dtFmt   = isZh ? 'Y年n月j日 H:i' : 'n/j/Y H:i';
  // Use zh_tw locale for calendar UI in Chinese mode; English mode uses flatpickr default.
  const locale  = isZh ? (window.flatpickr?.l10ns?.zh_tw || 'zh_tw') : undefined;
  // altInputClass: give the generated altInput the same look as our inputs
  const altCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300';

  const _init = (id, opts) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el._flatpickr) {
      if (opts.altFormat) el._flatpickr.set('altFormat', opts.altFormat);
      if (opts.locale !== undefined) el._flatpickr.set('locale', opts.locale);
    } else {
      flatpickr(el, opts);
    }
  };

  const dateOpts = { altInput: true, altInputClass: altCls, altFormat: dateFmt, dateFormat: 'Y-m-d', minDate: 'today' };
  const dtOpts   = { enableTime: true, time_24hr: true, altInput: true, altInputClass: altCls, altFormat: dtFmt, dateFormat: 'Y-m-d\\TH:i' };
  if (locale) { dateOpts.locale = locale; dtOpts.locale = locale; }

  _init(ids.date,    dateOpts);

  // ids.time is now a hidden input backed by two <select> dropdowns — no flatpickr needed

  _init(ids.openAt,  dtOpts);
  _init(ids.closeAt, { ...dtOpts });
}

/**
 * Set a flatpickr-managed (or plain) input value.
 * Use this instead of el.value = ... for date/time inputs that use flatpickr.
 *
 * @param {string} id     - element ID
 * @param {string} value  - value in the input's dateFormat (e.g. 'Y-m-d' or 'H:i')
 */
export function fpSet(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  // Hidden time input backed by _h / _m selects
  const hourEl = document.getElementById(id + '_h');
  const minEl  = document.getElementById(id + '_m');
  if (hourEl && minEl) {
    const [h = '00', rawM = '00'] = (value || '00:00').split(':');
    const mRounded = String(Math.round(parseInt(rawM, 10) / 5) * 5 % 60).padStart(2, '0');
    hourEl.value = h.padStart(2, '0');
    minEl.value  = mRounded;
    el.value = hourEl.value + ':' + mRounded;
    return;
  }
  if (el._flatpickr) {
    el._flatpickr.setDate(value || '', false);
  } else {
    el.value = value || '';
  }
}
