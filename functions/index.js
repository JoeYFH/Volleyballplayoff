const functions = require('firebase-functions');

const SUPABASE_URL = 'https://yjacbolmzmjutwvxowpe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqYWNib2xtem1qdXR3dnhvd3BlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDc4NTQsImV4cCI6MjEwNjM4Mzg1NH0.6iB-dXLssRMT7gxRVpX1GF5IKkKz1xfQiUfO13GH3pA';
const HOST = 'https://volleyballplayoff.web.app';

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  const days = ['日','一','二','三','四','五','六'];
  return `${dt.getFullYear()}/${dt.getMonth()+1}/${dt.getDate()} (週${days[dt.getDay()]})`;
}

async function fetchSession(sessionId) {
  const url = `${SUPABASE_URL}/rest/v1/sessions?id=eq.${encodeURIComponent(sessionId)}&select=title,date,time,location,type,limit_total,creator_name,is_open&limit=1`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  const data = await res.json();
  return Array.isArray(data) && data[0] ? data[0] : null;
}

// ── /og/SESSION_ID → HTML with OG meta tags + redirect ──────────
exports.og = functions.https.onRequest(async (req, res) => {
  const parts = req.path.split('/').filter(Boolean);
  const sessionId = parts[parts.length - 1];
  const mainUrl = `${HOST}/?session=${encodeURIComponent(sessionId)}`;

  if (!sessionId || sessionId === 'og') {
    res.redirect('/');
    return;
  }

  try {
    const s = await fetchSession(sessionId);

    let title = '🏐 排球臨打報名';
    let description = '快來報名這週的排球臨打！';
    const imageUrl = `${HOST}/og-image/${sessionId}`;

    if (s) {
      title = '🏐 ' + (s.title || (s.date + ' 臨打'));
      const infoParts = [];
      if (s.date) infoParts.push('📅 ' + fmtDate(s.date));
      if (s.time) infoParts.push('🕐 ' + s.time);
      if (s.location) infoParts.push('📍 ' + s.location);
      const typeMap = { mixed: '混排', male: '男生', female: '女生' };
      if (typeMap[s.type]) infoParts.push(typeMap[s.type]);
      if (s.limit_total) infoParts.push('上限 ' + s.limit_total + ' 人');
      if (s.creator_name) infoParts.push('👤 ' + s.creator_name);
      description = infoParts.join(' · ');
    }

    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="zh-TW"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <meta property="og:type" content="website">
  <meta property="og:url" content="${esc(mainUrl)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="zh_TW">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(imageUrl)}">
  <meta http-equiv="refresh" content="0;url=${esc(mainUrl)}">
</head>
<body style="font-family:sans-serif;text-align:center;padding:40px;background:#f8f9fa">
  <div style="font-size:48px;margin-bottom:16px">🏐</div>
  <h2 style="color:#4f46e5">${esc(title)}</h2>
  <p style="color:#6b7280">${esc(description)}</p>
  <a href="${esc(mainUrl)}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#4f46e5;color:white;border-radius:12px;text-decoration:none;font-weight:600">前往報名頁面 →</a>
  <script>window.location.replace(${JSON.stringify(mainUrl)});<\/script>
</body></html>`);
  } catch (e) {
    console.error('og error', e);
    res.redirect('/');
  }
});

// ── /og-image/SESSION_ID → SVG preview image ─────────────────────
exports.ogImage = functions.https.onRequest(async (req, res) => {
  const parts = req.path.split('/').filter(Boolean);
  const sessionId = parts[parts.length - 1];

  let sessionTitle = '排球臨打報名';
  let dateStr = '';
  let timeStr = '';
  let locationStr = '';
  let typeStr = '';
  let limitStr = '';
  let creatorStr = '';
  let isOpen = false;

  if (sessionId && sessionId !== 'og-image') {
    try {
      const s = await fetchSession(sessionId);
      if (s) {
        sessionTitle = s.title || (s.date + ' 臨打');
        dateStr = s.date ? fmtDate(s.date) : '';
        timeStr = s.time || '';
        locationStr = s.location || '';
        const typeMap = { mixed: '混排', male: '男生', female: '女生' };
        typeStr = typeMap[s.type] || '';
        limitStr = s.limit_total ? '上限 ' + s.limit_total + ' 人' : '';
        creatorStr = s.creator_name || '';
        isOpen = !!s.is_open;
      }
    } catch (e) {}
  }

  const trunc = (s, n) => s.length > n ? s.slice(0, n) + '…' : s;

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#312e81"/>
      <stop offset="100%" style="stop-color:#1e1b4b"/>
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:0.05"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1100" cy="100" r="200" fill="white" fill-opacity="0.03"/>
  <circle cx="1050" cy="580" r="150" fill="white" fill-opacity="0.03"/>
  <circle cx="50" cy="550" r="120" fill="white" fill-opacity="0.03"/>
  <rect x="80" y="80" width="1040" height="470" rx="24" fill="url(#card)" stroke="white" stroke-opacity="0.1" stroke-width="1"/>
  <rect x="80" y="80" width="200" height="8" rx="4" fill="#818cf8"/>
  <text x="120" y="200" font-size="90" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">🏐</text>
  <text x="240" y="175" font-size="52" font-weight="700" fill="white" font-family="Noto Sans TC,PingFang TC,Microsoft JhengHei,sans-serif">${esc(trunc(sessionTitle, 20))}</text>
  ${isOpen ? `<rect x="240" y="190" width="100" height="30" rx="15" fill="#10b981"/>
  <text x="291" y="210" font-size="16" fill="white" font-weight="600" text-anchor="middle" font-family="Noto Sans TC,sans-serif">報名中</text>` : ''}
  <line x1="120" y1="250" x2="1080" y2="250" stroke="white" stroke-opacity="0.1" stroke-width="1"/>
  ${dateStr ? `<text x="120" y="310" font-size="32" fill="rgba(255,255,255,0.9)" font-family="Noto Sans TC,PingFang TC,Microsoft JhengHei,sans-serif">📅  ${esc(dateStr)}${timeStr ? '  🕐  ' + esc(timeStr) : ''}</text>` : ''}
  ${locationStr ? `<text x="120" y="365" font-size="32" fill="rgba(255,255,255,0.9)" font-family="Noto Sans TC,PingFang TC,Microsoft JhengHei,sans-serif">📍  ${esc(trunc(locationStr, 28))}</text>` : ''}
  <text x="120" y="420" font-size="28" fill="rgba(255,255,255,0.6)" font-family="Noto Sans TC,PingFang TC,Microsoft JhengHei,sans-serif">${esc([typeStr, limitStr].filter(Boolean).join('  ·  '))}</text>
  ${creatorStr ? `<text x="120" y="470" font-size="26" fill="rgba(255,255,255,0.5)" font-family="Noto Sans TC,PingFang TC,Microsoft JhengHei,sans-serif">👤  ${esc(trunc(creatorStr, 20))}</text>` : ''}
  <text x="1080" y="510" font-size="22" fill="rgba(255,255,255,0.3)" text-anchor="end" font-family="Noto Sans TC,sans-serif">volleyballplayoff.web.app</text>
</svg>`;

  res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.set('Content-Type', 'image/svg+xml; charset=utf-8');
  res.send(svg);
});
