import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const HOST = 'https://volleyballplayoff.web.app';

function esc(s: string) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(d: string) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  const days = ['日','一','二','三','四','五','六'];
  return `${dt.getFullYear()}/${dt.getMonth()+1}/${dt.getDate()} (週${days[dt.getDay()]})`;
}

function isBrowser(req: Request): boolean {
  const ua = req.headers.get('user-agent') || '';
  // 一般瀏覽器的 UA 以 Mozilla/ 開頭，且不含爬蟲關鍵字
  return /^Mozilla\//i.test(ua) &&
    !/bot|crawl|spider|facebookexternalhit|slack|discord|telegram|whatsapp|linkedin|preview|fetch|curl/i.test(ua);
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('id') || url.pathname.split('/').pop();

  if (!sessionId || sessionId === 'og') {
    return Response.redirect(HOST, 302);
  }

  const mainUrl = `${HOST}/?session=${encodeURIComponent(sessionId)}`;

  // 一般瀏覽器直接 302 跳轉，不回傳 HTML（避免 Supabase 用 text/plain 回傳導致顯示原始碼）
  if (isBrowser(req)) {
    return Response.redirect(mainUrl, 302);
  }
  const ogUrl = `https://yjacbolmzmjutwvxowpe.supabase.co/functions/v1/og?id=${encodeURIComponent(sessionId)}&apikey=${SUPABASE_ANON_KEY}`;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data } = await supabase
      .from('sessions')
      .select('title,date,time,location,type,limit_total,creator_name')
      .eq('id', sessionId)
      .single();

    let title = '🏐 排球臨打報名';
    let description = '快來報名這週的排球臨打！';
    const imageUrl = `${HOST}/og-image.png`;

    if (data) {
      title = '🏐 ' + (data.title || (data.date + ' 臨打'));
      const parts: string[] = [];
      if (data.date) parts.push('📅 ' + fmtDate(data.date));
      if (data.time) parts.push('🕐 ' + data.time);
      if (data.location) parts.push('📍 ' + data.location);
      const typeMap: Record<string, string> = { mixed: '混排', male: '男生', female: '女生' };
      if (typeMap[data.type]) parts.push(typeMap[data.type]);
      if (data.limit_total) parts.push('上限 ' + data.limit_total + ' 人');
      if (data.creator_name) parts.push('👤 ' + data.creator_name);
      description = parts.join(' · ');
    }

    const html = `<!DOCTYPE html>
<html lang="zh-TW"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
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
  <meta name="twitter:image" content="${esc(imageUrl)}">
  <meta http-equiv="refresh" content="0;url=${esc(mainUrl)}">
</head>
<body>
  <a href="${esc(mainUrl)}">前往報名頁面</a>
</body></html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-cache',
      },
    });
  } catch (e) {
    console.error('og error', e);
    return Response.redirect(mainUrl, 302);
  }
});
