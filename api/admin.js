// Endpoint admin (Vercel): login + simpan content.json + upload foto ke repo GitHub.
// Env vars di Vercel: ADMIN_USER, ADMIN_PASSWORD, GITHUB_TOKEN, GITHUB_REPO (user/repo), GITHUB_BRANCH (opsional)
const crypto = require('crypto');
const { ADMIN_USER, ADMIN_PASSWORD, GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH = 'master' } = process.env;

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

module.exports = async (req, res) => {
  const reply = (code, body) => res.status(code).json(body);
  if (req.method !== 'POST') return reply(405, { error: 'Hanya POST' });

  let d = req.body;
  try { if (typeof d === 'string') d = JSON.parse(d); } catch { d = null; }
  if (!d || typeof d !== 'object') return reply(400, { error: 'Data tidak valid' });

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
