// Vercel Serverless Function: Dynamic OG tags for shared drink links
// Intercepts /drink requests, fetches drink data from Supabase, and returns
// HTML with drink-specific Open Graph meta tags for rich link previews.

const SUPABASE_URL = 'https://oyerthppmxvcgtldljwi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZXJ0aHBwbXh2Y2d0bGRsandpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NjkxMTcsImV4cCI6MjA1MzI0NTExN30.P_NMCpiGrNBPBMud9mh9GjfKJOIyhtNRV_2qJA_Mmz0';

export default async function handler(req, res) {
  const { id } = req.query;

  // If no ID, redirect to app page
  if (!id) {
    return res.redirect(302, '/app.html');
  }

  // Fetch drink data from Supabase
  let drink = null;
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/shared_drinks?id=eq.${id}&select=drink_name,category,drink_style,brewery,winery,distillery,cocktail_recipe,encoded_payload`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      drink = data[0];
    }
  } catch (e) {
    // Fall through to default OG tags
  }

  // Build OG metadata
  const drinkName = drink?.drink_name || 'A Drink';
  const category = drink?.category || '';
  const style = drink?.drink_style || '';
  const producer = drink?.brewery || drink?.winery || drink?.distillery || '';

  // Build description
  let descParts = [];
  if (category) descParts.push(category);
  if (producer) descParts.push(producer);
  if (style) descParts.push(style);
  const ogDescription = descParts.length > 0
    ? `${descParts.join(' \u00B7 ')} \u2014 shared via Libations`
    : 'Shared via Libations \u2014 Every Sip, Curated';

  const ogTitle = drinkName;
  const ogUrl = `https://www.therainyday.co/drink?id=${id}`;
  const ogImage = 'https://www.therainyday.co/libations-icon.png';

  // Build the encoded payload for the client-side JS
  const encodedPayload = drink?.encoded_payload || '';

  // Return HTML with dynamic OG tags
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(ogTitle)} \u2014 Libations</title>

  <!-- Dynamic Open Graph tags -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="${escapeHtml(ogUrl)}">
  <meta property="og:site_name" content="Libations">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  <meta name="twitter:image" content="${ogImage}">

  <!-- App deep link -->
  <meta name="apple-itunes-app" content="app-id=6740515498">

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: #0d1117;
      color: #e8e0d4;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .card {
      max-width: 420px;
      width: 90%;
      background: #161e28;
      border-radius: 16px;
      border: 1px solid rgba(200, 145, 58, 0.15);
      padding: 32px 28px;
      text-align: center;
    }
    .brand {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 18px;
      color: rgba(200, 145, 58, 0.8);
      margin-bottom: 12px;
    }
    .divider {
      width: 60%;
      height: 1px;
      background: rgba(200, 145, 58, 0.2);
      margin: 0 auto 20px;
    }
    .drink-name {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 28px;
      font-weight: 300;
      color: #e8e0d4;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    .detail {
      font-size: 13px;
      color: rgba(232, 224, 212, 0.5);
      margin-bottom: 24px;
      letter-spacing: 0.5px;
    }
    .message {
      font-size: 14px;
      color: rgba(232, 224, 212, 0.7);
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .cta {
      display: inline-block;
      background: #c8913a;
      color: #0d1117;
      font-weight: 600;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 10px;
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .cta:hover { opacity: 0.9; }
    .footer {
      margin-top: 20px;
      font-size: 11px;
      color: rgba(232, 224, 212, 0.3);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Libations</div>
    <div class="divider"></div>
    <div class="drink-name">${escapeHtml(drinkName)}</div>
    <div class="detail">${escapeHtml(descParts.join(' \u00B7 '))}</div>
    <p class="message">Someone shared this drink with you.<br>Open it in Libations to save it to your library.</p>
    <a class="cta" id="openApp" href="https://apps.apple.com/app/libations/id6740515498">Open in Libations</a>
    <div class="footer">therainyday.co</div>
  </div>

  <script>
    var drinkPayload = '${encodedPayload}';
    if (drinkPayload) {
      var deepLink = 'libations://drink?d=' + drinkPayload;
      var appStoreLink = 'https://apps.apple.com/app/libations/id6740515498';
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        document.getElementById('openApp').href = deepLink;
        document.getElementById('openApp').addEventListener('click', function() {
          setTimeout(function() {
            window.location.href = appStoreLink;
          }, 1500);
        });
      }
    }
  </script>
</body>
</html>`);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
