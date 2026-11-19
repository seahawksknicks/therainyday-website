// Vercel Serverless Function: password-protected Product Board.
// /dashboard is rewritten here (see vercel.json). The board is only returned
// after server-side Basic Auth succeeds. The username and password come from
// Vercel environment variables, never from the repo. If they are not set, the
// page stays locked (503) instead of opening up.

import { readFileSync } from 'fs';
import { join } from 'path';
import { timingSafeEqual } from 'crypto';

const DATA_PATH = join(process.cwd(), 'api', '_dashboard', 'data.json');

export default async function handler(req, res) {
  const username = process.env.DASHBOARD_USERNAME;
  const password = process.env.DASHBOARD_PASSWORD;

  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  if (!username || !password) {
    return res.status(503).send('Dashboard sign-in is not set up yet.');
  }

  if (!isAuthorized(req.headers.authorization, username, password)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Rainy Day Product Board", charset="UTF-8"');
    return res.status(401).send('Sign-in required.');
  }

  let data;
  try {
    data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  } catch (_) {
    return res.status(500).send('The board data could not be read.');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(render(data));
}

function isAuthorized(header, expectedUser, expectedPassword) {
  if (!header || !header.startsWith('Basic ')) return false;
  let decoded;
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  } catch (_) {
    return false;
  }
  const i = decoded.indexOf(':');
  if (i < 0) return false;
  // Check both, so the time taken doesn't show which one was wrong.
  const userOk = safeEqual(decoded.slice(0, i), expectedUser);
  const passOk = safeEqual(decoded.slice(i + 1), expectedPassword);
  return userOk && passOk;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const TONES = new Set(['danger', 'warning', 'success']);

function row(item) {
  const tone = TONES.has(item.tone) ? item.tone : 'plain';
  return `<li class="row">
      ${item.lead ? `<span class="lead">${esc(item.lead)}</span>` : ''}
      <span class="main"><span class="title">${esc(item.title)}</span>${item.meta ? `<span class="meta">${esc(item.meta)}</span>` : ''}</span>
      ${item.status ? `<span class="pill ${tone}">${esc(item.status)}</span>` : ''}
    </li>`;
}

function section(heading, items, emptyText) {
  const list = Array.isArray(items) ? items : [];
  return `<section>
    <h2>${esc(heading)}</h2>
    ${list.length ? `<ul class="rows">${list.map(row).join('')}</ul>` : `<p class="empty">${esc(emptyText)}</p>`}
  </section>`;
}

function render(d) {
  const count = (k) => (Array.isArray(d[k]) ? d[k].length : 0);
  const metrics = [
    ['Waiting on Greg', count('waitingOnGreg'), count('waitingOnGreg') ? 'warning' : ''],
    ['Waiting on Rachael', count('waitingOnRachael'), ''],
    ['In progress', count('inProgress'), ''],
    ['Done this week', count('doneThisWeek'), 'success'],
  ];
  const approvals = Array.isArray(d.howApprovalsWork) ? d.howApprovalsWork : [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(d.title || 'Product Board')} — The Rainy Day Company</title>
  <meta name="robots" content="noindex, nofollow, noarchive">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0d1117; --surface: #161e28; --border: rgba(255,255,255,0.07);
      --amber: #c8913a; --gold: #e8c470; --text: #e8e0d4; --muted: #8a8078;
      --green: #4ade80; --red: #f87171; --yellow: #fbbf24;
    }
    body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; font-weight: 300; line-height: 1.55; -webkit-font-smoothing: antialiased; }
    .wrap { max-width: 720px; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
    .brand { font-family: 'Cormorant Garamond', serif; color: var(--amber); font-size: 1.05rem; letter-spacing: 0.04em; }
    h1 { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 2.2rem; line-height: 1.15; margin: 0.6rem 0 0.3rem; }
    .asof { color: var(--muted); font-size: 0.85rem; margin-bottom: 1.75rem; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 2.25rem; }
    .metric { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 0.9rem 0.9rem 0.8rem; }
    .metric .n { font-family: 'Cormorant Garamond', serif; font-size: 2.3rem; line-height: 1; }
    .metric.warning .n { color: var(--yellow); }
    .metric.success .n { color: var(--green); }
    .metric .l { color: var(--muted); font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 0.45rem; line-height: 1.3; }
    section { margin-bottom: 2rem; }
    h2 { font-family: 'Cormorant Garamond', serif; font-weight: 400; font-size: 1.45rem; margin-bottom: 0.6rem; padding-bottom: 0.45rem; border-bottom: 1px solid var(--border); }
    .rows { list-style: none; }
    .row { display: flex; align-items: center; gap: 0.75rem; padding: 0.7rem 0; border-bottom: 1px solid var(--border); }
    .row:last-child { border-bottom: 0; }
    .lead { color: var(--muted); font-size: 0.78rem; min-width: 3.4rem; }
    .main { flex: 1; min-width: 0; }
    .title { display: block; font-size: 0.95rem; font-weight: 400; }
    .meta { display: block; color: var(--muted); font-size: 0.78rem; }
    .pill { font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; padding: 0.22rem 0.55rem; border-radius: 2px; border: 1px solid var(--border); color: var(--muted); }
    .pill.danger { color: var(--red); border-color: rgba(248,113,113,0.4); background: rgba(248,113,113,0.1); }
    .pill.warning { color: var(--yellow); border-color: rgba(251,191,36,0.4); background: rgba(251,191,36,0.1); }
    .pill.success { color: var(--green); border-color: rgba(74,222,128,0.4); background: rgba(74,222,128,0.1); }
    .empty { color: var(--muted); font-size: 0.9rem; padding: 0.4rem 0; }
    ul.plain { list-style: none; }
    ul.plain li { position: relative; padding: 0.35rem 0 0.35rem 1.1rem; font-size: 0.95rem; }
    ul.plain li::before { content: '—'; position: absolute; left: 0; color: var(--amber); }
    @media (max-width: 560px) {
      h1 { font-size: 1.8rem; }
      .metrics { grid-template-columns: repeat(2, 1fr); }
      .row { align-items: flex-start; flex-wrap: wrap; }
      .lead { min-width: 100%; }
      .pill { margin-left: auto; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="brand">The Rainy Day Co.</div>
    <h1>${esc(d.title || 'Product Board')}</h1>
    <p class="asof">${d.asOf ? 'As of ' + esc(d.asOf) + '.' : ''}</p>
    <div class="metrics">
      ${metrics.map(([l, n, t]) => `<div class="metric ${t}"><div class="n">${n}</div><div class="l">${esc(l)}</div></div>`).join('')}
    </div>
    ${section('Waiting on Greg', d.waitingOnGreg, 'Nothing right now.')}
    ${section('Waiting on Rachael', d.waitingOnRachael, 'Nothing right now.')}
    ${section('In progress', d.inProgress, 'Nothing right now.')}
    ${section('On hold', d.onHold, 'Nothing on hold.')}
    ${section('Done this week', d.doneThisWeek, 'Nothing yet this week.')}
    <section>
      <h2>How approvals work</h2>
      <ul class="plain">${approvals.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </section>
  </div>
</body>
</html>`;
}
