const t = {
  zh: {
    appTitle: '排球零打報名',
    liveUpdate: '即時更新',
    googleLogin: 'Google 登入',
    logout: '登出',
    createSession: '+ 建立場次',
    mySessions: '我的開場',
    adminPortal: '我的開場',
    noSessions: '目前沒有即將舉行的場次',
    // status
    open: '報名中', closed: '已截止', notYet: '尚未開放',
    // session info labels
    limitLabel: '名額', typeLabel: '分類', equipLabel: '需自備',
    noteLabel: '備註', venueLabel: '場地',
    needsBring: '需自備：', people: '人',
    // types
    mixed: '混排', male: '男生', female: '女生', noType: '不限',
    // countdown
    countdownTpl: (h, m, s) => `⏳ 報名將於 ${h ? h + '小時' : ''}${m}分${s}秒後開放`,
    countdownDone: '報名已開放！請重新整理頁面',
    // signup form
    formTitle: '✍️ 填寫報名資料',
    nameLabel: '姓名 / 暱稱', namePh: '輸入你的名字',
    googleProfile: '以 Google 帳號報名',
    willBeLate: '我會晚到', lateTimePh: '大約幾點到？（例：19:30）',
    forFriend: '幫朋友報名', friendPh: '朋友的名字',
    pairLabel: '希望跟誰搭檔？（選填）', pairPh: '填入對方名字',
    confirmBtn: '🙋 確認報名', signingUp: '報名中...',
    successMsg: '✅ 報名成功！', failMsg: '❌ 報名失敗，請再試一次',
    enterName: '請輸入名字',
    // list
    listTitle: '📋 報名名單', noSignups: '還沒有人報名，快搶第一！',
    fullNotice: '🎉 正取名額已滿！以下為候補名單',
    waitPrefix: '候',
    lateTag: '晚到', proxyTag: '代', pairTag: '搭檔',
    signedAtFmt: (m, d, hh, mm) => `${m}/${d} ${hh}:${mm} 報名`,
    // create form
    createTitle: '建立新場次',
    fTitle: '場次名稱', fTitlePh: '例：第15週零打',
    fDate: '日期', fTime: '時間',
    fLocation: '地點', fLocationPh: '請輸入完整地址或場館名稱',
    fLocationHint: '請輸入完整地址或場館名稱，以取得最佳搜尋結果',
    fVenue: '活動詳細說明（選填）', fVenuePh: '例：B1 室內球場4號場',
    fLimit: '人數上限（0 = 不限）', fType: '性別分類',
    fEquip: '需要攜帶的用具', fEquipPh: '新增用具名稱',
    fOpenAt: '預定開放報名時間（選填）', fOpenAtHint: '設定後顯示倒數計時，到時自動開放',
    fOpenNow: '立即開放報名',
    fNote: '備註（選填）', fNotePh: '其他說明...',
    createBtn: '🚀 建立場次', saveTemplate: '💾 存為範本',
    creating: '建立中...',
    // equip chips
    ball: '🏐 球', wristband: '🤸 護腕', kneePad: '🦵 護膝',
    shoes: '👟 球鞋', net: '🕸️ 球網',
    // my sessions
    mySessionsTitle: '我的開場',
    allSessionsTitle: '所有場次（管理員）',
    editBtn: '編輯', closeBtn: '結束場次',
    pauseBtn: '⏸ 暫停報名', openBtn: '▶ 開放報名',
    removeSignup: '移除',
    exportBtn: '匯出名單', copyBtn: '📋 複製到剪貼簿', copied: '✅ 已複製！',
    exportTitle: '📤 匯出名單',
    templates: '我的範本', noTemplates: '還沒有儲存任何範本',
    applyTemplate: '套用', deleteTemplate: '刪除',
    templateApplied: '✅ 已套用範本，請確認並調整日期',
    templateSaved: '✅ 已儲存為範本！',
    signupCount: (n) => `${n} 人`,
    removeConfirm: '確定移除此報名？',
    closeConfirm: '確定要結束此場次嗎？',
    deleteConfirm: '確定刪除此範本？',
    templateNamePrompt: '範本名稱：',
    mapSearch: '地圖搜尋',
    searching: '搜尋中...',
    noResults: '找不到結果',
    // admin
    adminBadge: '管理員',
    signedIn: '已登入',
  },
  en: {
    appTitle: 'Volleyball Pickup',
    liveUpdate: 'Live',
    googleLogin: 'Sign in with Google',
    logout: 'Logout',
    createSession: '+ Create Session',
    mySessions: 'My Sessions',
    adminPortal: 'My Sessions',
    noSessions: 'No upcoming sessions',
    open: 'Open', closed: 'Closed', notYet: 'Not Open Yet',
    limitLabel: 'Limit', typeLabel: 'Type', equipLabel: 'Bring',
    noteLabel: 'Note', venueLabel: 'Venue',
    needsBring: 'Bring: ', people: ' players',
    mixed: 'Mixed', male: 'Male', female: 'Female', noType: 'All',
    countdownTpl: (h, m, s) => `⏳ Opens in ${h ? h + 'h ' : ''}${m}m ${s}s`,
    countdownDone: 'Signup is open! Please refresh.',
    formTitle: '✍️ Sign Up',
    nameLabel: 'Name / Nickname', namePh: 'Enter your name',
    googleProfile: 'Signing up with Google account',
    willBeLate: "I'll be late", lateTimePh: 'Arrival time (e.g. 7:30 PM)',
    forFriend: 'Sign up for a friend', friendPh: "Friend's name",
    pairLabel: 'Want to pair with? (optional)', pairPh: "Partner's name",
    confirmBtn: '🙋 Confirm Sign Up', signingUp: 'Signing up...',
    successMsg: '✅ Signed up!', failMsg: '❌ Failed, please try again',
    enterName: 'Please enter your name',
    listTitle: '📋 Sign-up List', noSignups: 'No one yet — be the first!',
    fullNotice: '🎉 Full! Waitlist below',
    waitPrefix: 'W',
    lateTag: 'Late', proxyTag: 'For', pairTag: 'Pair',
    signedAtFmt: (m, d, hh, mm) => `Signed ${m}/${d} ${hh}:${mm}`,
    createTitle: 'Create New Session',
    fTitle: 'Session Title', fTitlePh: 'e.g. Week 15 Pickup',
    fDate: 'Date', fTime: 'Time',
    fLocation: 'Location', fLocationPh: 'Enter full address or venue name',
    fLocationHint: 'Enter a full address or venue name for best search results',
    fVenue: 'Activity Details (optional)', fVenuePh: 'e.g. Court B1, Indoor Hall',
    fLimit: 'Player Limit (0 = unlimited)', fType: 'Category',
    fEquip: 'Required Equipment', fEquipPh: 'Add item',
    fOpenAt: 'Scheduled Open Time (optional)', fOpenAtHint: 'A countdown will show until signup opens',
    fOpenNow: 'Open for signup now',
    fNote: 'Notes (optional)', fNotePh: 'Other info...',
    createBtn: '🚀 Create Session', saveTemplate: '💾 Save as Template',
    creating: 'Creating...',
    ball: '🏐 Ball', wristband: '🤸 Wristband', kneePad: '🦵 Knee Pad',
    shoes: '👟 Shoes', net: '🕸️ Net',
    mySessionsTitle: 'My Sessions',
    allSessionsTitle: 'All Sessions (Admin)',
    editBtn: 'Edit', closeBtn: 'Close Session',
    pauseBtn: '⏸ Pause', openBtn: '▶ Open',
    removeSignup: 'Remove',
    exportBtn: 'Export List', copyBtn: '📋 Copy to Clipboard', copied: '✅ Copied!',
    exportTitle: '📤 Export List',
    templates: 'My Templates', noTemplates: 'No templates saved yet',
    applyTemplate: 'Apply', deleteTemplate: 'Delete',
    templateApplied: '✅ Template applied — please confirm and adjust the date',
    templateSaved: '✅ Saved as template!',
    signupCount: (n) => `${n} player${n !== 1 ? 's' : ''}`,
    removeConfirm: 'Remove this signup?',
    closeConfirm: 'Close this session?',
    deleteConfirm: 'Delete this template?',
    templateNamePrompt: 'Template name:',
    mapSearch: 'Map Search',
    searching: 'Searching...',
    noResults: 'No results found',
    adminBadge: 'Admin',
    signedIn: 'Signed in',
  }
};

const browserLang = (navigator.language || 'zh').toLowerCase();
const deviceDefault = browserLang.startsWith('zh') ? 'zh' : 'en';
let currentLang = localStorage.getItem('lang') || deviceDefault;

function getLang() { return currentLang; }

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
}

function tr(key, ...args) {
  const val = t[currentLang][key];
  if (typeof val === 'function') return val(...args);
  return val ?? key;
}

export { t, getLang, setLang, tr };
