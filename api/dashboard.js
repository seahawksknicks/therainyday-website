// Vercel Serverless Function: password-protected Libations dashboard.
// /dashboard is rewritten here so dashboard content is only returned after
// server-side Basic Auth succeeds. Credentials must be supplied via Vercel
// environment variables; do not embed secrets in this repo or in HTML.

import { readFileSync } from 'fs';
import { join } from 'path';
import { timingSafeEqual } from 'crypto';

const DASHBOARD_HTML_PATH = join(process.cwd(), 'api', 'libations-dashboard.html.tmpl');

export default async function handler(req, res) {
  const username = process.env.RAINYDAY_DASHBOARD_USERNAME || process.env.DASHBOARD_USERNAME;
  const password = process.env.RAINYDAY_DASHBOARD_PASSWORD || process.env.DASHBOARD_PASSWORD;

  if (!username || !password) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).send('Dashboard auth is not configured.');
  }

  if (!isAuthorized(req.headers.authorization, username, password)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Rainy Day Dashboard", charset="UTF-8"');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(401).send('Authentication required.');
  }

  const html = readFileSync(DASHBOARD_HTML_PATH, 'utf8');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return res.status(200).send(html);
}

function isAuthorized(header, expectedUser, expectedPassword) {
  if (!header || !header.startsWith('Basic ')) return false;

  let decoded;
  try {
    decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
  } catch (_) {
    return false;
  }

  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex < 0) return false;

  const suppliedUser = decoded.slice(0, separatorIndex);
  const suppliedPassword = decoded.slice(separatorIndex + 1);
  return safeEqual(suppliedUser, expectedUser) && safeEqual(suppliedPassword, expectedPassword);
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
