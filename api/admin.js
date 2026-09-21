// Endpoint admin (Vercel): login + simpan content.json + upload foto ke repo GitHub.
// Env vars di Vercel: ADMIN_USER, ADMIN_PASSWORD, GITHUB_TOKEN, GITHUB_REPO (user/repo), GITHUB_BRANCH (opsional)
const crypto = require('crypto');
const { ADMIN_USER, ADMIN_PASSWORD, GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH = 'master' } = process.env;

const eq = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const api = (p, opt = {}) => fetch(`https://api.github.com/repos/${GITHUB_REPO}/${p}`, {
  ...opt,
  headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'User-Agent': 'portfolio-admin', Accept: 'application/vnd.github+json' },
});
const j = async r => { if (!r.ok) throw new Error(`GitHub ${r.status}`); return r.json(); };
const post = (p, body, method = 'POST') => api(p, { method, body: JSON.stringify(body) });

// Banyak file sekaligus -> 1 commit (Git Data API): blob per file, tree baru, commit, geser branch.
async function commitFiles(files, message) {
  const head = (await j(await api(`git/ref/heads/${GITHUB_BRANCH}`))).object.sha;
  const base = (await j(await api(`git/commits/${head}`))).tree.sha;
  const tree = await Promise.all(files.map(async f => ({
    path: f.path, mode: '100644', type: 'blob',
    sha: (await j(await post('git/blobs', { content: f.b64, encoding: 'base64' }))).sha,
  })));
  const t = await j(await post('git/trees', { base_tree: base, tree }));
  const c = await j(await post('git/commits', { message, tree: t.sha, parents: [head] }));
  await j(await post(`git/refs/heads/${GITHUB_BRANCH}`, { sha: c.sha }, 'PATCH'));
}

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
    const files = [];
    for (const f of Array.isArray(d.files) ? d.files : []) {
      if (!/^images\/[\w.-]+\.(jpe?g|png|webp|gif)$/i.test(f.path || '') || !f.data) return reply(400, { error: 'File gambar tidak valid' });
      files.push({ path: f.path, b64: f.data });
    }
    if (d.content) {
      if (typeof d.content !== 'object') return reply(400, { error: 'Konten tidak valid' });
      files.push({ path: 'content.json', b64: Buffer.from(JSON.stringify(d.content, null, 2) + '\n').toString('base64') });
    }
    if (!files.length) return reply(400, { error: 'Tidak ada yang disimpan' });
    try { await commitFiles(files, 'Update konten via admin'); return reply(200, { ok: true }); }
    catch (e) { return reply(502, { error: `Gagal menyimpan ke GitHub (${e.message})` }); }
  }

  return reply(400, { error: 'Aksi tidak dikenal' });
};
