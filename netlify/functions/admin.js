// Endpoint admin: login + simpan content.json + upload foto ke repo GitHub.
// Rahasia ada di Netlify env vars: ADMIN_USER, ADMIN_PASSWORD, GITHUB_TOKEN, GITHUB_REPO (user/repo), GITHUB_BRANCH (opsional)
const crypto = require('crypto');
const { ADMIN_USER, ADMIN_PASSWORD, GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH = 'main' } = process.env;

const eq = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const gh = (path, opt = {}) => fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
  ...opt,
  headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'User-Agent': 'portfolio-admin', Accept: 'application/vnd.github+json' },
});
const put = async (path, b64, message) => {
  const cur = await gh(`${path}?ref=${GITHUB_BRANCH}`);
  const sha = cur.ok ? (await cur.json()).sha : undefined;
  return gh(path, { method: 'PUT', body: JSON.stringify({ message, content: b64, branch: GITHUB_BRANCH, sha }) });
};
const reply = (code, body) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

exports.handler = async (ev) => {
  if (ev.httpMethod !== 'POST') return reply(405, { error: 'Hanya POST' });
  let d;
  try { d = JSON.parse(ev.body); } catch { return reply(400, { error: 'Data tidak valid' }); }

  if (!ADMIN_USER || !ADMIN_PASSWORD || !eq(d.user, ADMIN_USER) || !eq(d.password, ADMIN_PASSWORD))
    return reply(401, { error: 'Username atau password salah' });

  if (d.action === 'login') return reply(200, { ok: true });

  if (d.action === 'save') {
    if (!d.content || typeof d.content !== 'object') return reply(400, { error: 'Konten kosong' });
    const r = await put('content.json', Buffer.from(JSON.stringify(d.content, null, 2) + '\n').toString('base64'), 'Update konten via admin');
    return r.ok ? reply(200, { ok: true }) : reply(502, { error: `Gagal menyimpan ke GitHub (${r.status})` });
  }

  if (d.action === 'upload') {
    if (!/^[\w.-]+\.(jpe?g|png|webp|gif)$/i.test(d.name || '')) return reply(400, { error: 'Nama/tipe file tidak valid' });
    if (!d.data || d.data.length > 4_000_000) return reply(400, { error: 'File terlalu besar' });
    const r = await put(`images/${d.name}`, d.data, `Upload foto ${d.name}`);
    return r.ok ? reply(200, { ok: true, path: `images/${d.name}` }) : reply(502, { error: `Gagal upload ke GitHub (${r.status})` });
  }

  return reply(400, { error: 'Aksi tidak dikenal' });
};
