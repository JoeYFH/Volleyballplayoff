const functions = require('firebase-functions');
const fs = require('fs');
const path = require('path');

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
  return `${dt.getFullYear()}/${dt.getMonth()+1}/${dt.getDate()}（週${days[dt.getDay()]}）`;
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

exports.og = functions.https.onRequest(async (req, res) => {
  const parts = req.path.split('/').filter(Boolean);
  const sessionId = parts[parts.length - 1];

  if (!sessionId || sessionId === 'og') {
    res.redirect(302, HOST);
    return;
  }

  const ogUrl = `${HOST}/og/${encodeURIComponent(sessionId)}`;

  let data = null;
  try {
    data = await fetchSession(sessionId);
  } catch (e) {
    console.error('Supabase fetch error:', e);
  }

  let title = '🏐 排球臨打報名';
  let description = '快來報名這週的排球臨打！';
  const imageUrl = `${HOST}/og-image.png`;

  if (data) {
    title = '🏐 ' + (data.title || (data.date + ' 臨打'));
    const infoParts = [];
    if (data.date) infoParts.push('📅 ' + fmtDate(data.date));
    if (data.time) infoParts.push('🕐 ' + data.time);
    if (data.location) infoParts.push('📍 ' + data.location);
    const typeMap = { mixed: '混排', male: '男生', female: '女生' };
    if (typeMap[data.type]) infoParts.push(typeMap[data.type]);
    if (data.limit_total) infoParts.push('上限 ' + data.limit_total + ' 人');
    if (data.creator_name) infoParts.push('👤 ' + data.creator_name);
    description = infoParts.join(' · ');
  }

  // Read the Vue app template (copied from dist/index.html during CI build)
  const templatePath = path.join(__dirname, 'template.html');
  let html;
  try {
    html = fs.readFileSync(templatePath, 'utf8');
  } catch (e) {
    console.error('template.html not found, falling back to minimal page', e);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'no-cache');
    res.status(503).send(`<!DOCTYPE html><html><head><title>${esc(title)}</title></head><body><p>Server error, please try again.</p></body></html>`);
    return;
  }

  // Remove static OG/meta tags from template so dynamic ones are the only ones
  html = html
    .replace(/<title>[^<]*<\/title>/i, '')
    .replace(/<meta\s[^>]*property="og:[^"]*"[^>]*\/?>/gi, '')
    .replace(/<meta\s[^>]*name="twitter:[^"]*"[^>]*\/?>/gi, '')
    .replace(/<meta\s[^>]*name="description"[^>]*\/?>/gi, '');

  const sessionScript = data
    ? `<script>window.__SESSION__=${JSON.stringify(data).replace(/</g, '\\u003c')};</script>`
    : '';

  const injected = `
  ${sessionScript}
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${esc(ogUrl)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="zh_TW">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(imageUrl)}">`;

  // Inject before </head> so dynamic tags are the last (and only) OG tags
  html = html.replace('</head>', injected + '\n</head>');

  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-cache');
  res.status(200).send(html);
});
