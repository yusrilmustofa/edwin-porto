const API = '/api/admin';
const $ = s => document.querySelector(s);
const el = (t, c = '', h = '') => { const e = document.createElement(t); e.className = c; e.innerHTML = h; return e; };
const LBL = { name: 'Nama', hero: 'Bagian Atas (Hero)', about: 'Tentang Saya', skills: 'Keahlian', projects: 'Portofolio', experience: 'Pengalaman & Pendidikan', contact: 'Kontak',
  greeting: 'Salam', headline: 'Headline', highlight: 'Kata berwarna hijau', description: 'Deskripsi', cta_portfolio: 'Teks tombol Portofolio', cta_contact: 'Teks tombol Kontak',
  photo: 'Foto (kosongkan = huruf inisial)', images: 'Gambar slideshow (bisa lebih dari satu)', title: 'Judul', intro: 'Pengantar', items: 'Daftar', text: 'Teks', hard: 'Hard Skills', soft: 'Soft Skills', note: 'Catatan kecil (opsional)',
  tag: 'Label kategori', role: 'Peran', impact: 'Dampak / hasil', period: 'Periode', desc: 'Keterangan', email: 'Email', linkedin: 'Link LinkedIn (https://...)', instagram: 'Link Instagram (https://...)', footer: 'Teks footer' };
const lbl = k => LBL[k] || k;

let auth = JSON.parse(sessionStorage.auth || 'null'), data;
const call = async body => {
  const r = await fetch(API, { method: 'POST', body: JSON.stringify({ ...auth, ...body }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
  return j;
};
const say = (msg, ok) => { $('#status').textContent = msg; $('#status').className = 'text-sm ' + (ok ? 'text-emerald-700' : 'text-red-600'); };

// Foto: kecilkan dulu (maks 900px, JPEG) agar ringan
const shrink = file => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => {
    const k = Math.min(1, 900 / Math.max(img.width, img.height)), c = el('canvas');
    c.width = img.width * k; c.height = img.height * k;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    res(c.toDataURL('image/jpeg', .85).split(',')[1]);
  };
  img.onerror = () => rej(new Error('File bukan gambar'));
  img.src = URL.createObjectURL(file);
});

// Gambar dipilih -> ditampung di memori (pending), baru dikirim bersama teks saat Simpan = 1 commit
const pending = {}; let dirty = false;
const stage = async (file, i = 0) => {
  const path = `images/foto-${Date.now()}-${i}.jpg`;
  pending[path] = await shrink(file); dirty = true;
  return path;
};
addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

// Form generik dari struktur JSON: string -> input, array -> daftar (tambah/hapus), object -> grup
function node(obj, key, title, up) {
  const v = obj[key], box = el('div');
  if (Array.isArray(v)) {
    const shape = v[0];
    box.append(el('label', 'block font-semibold text-sm mb-1', title));
    const list = el('div', 'space-y-2');
    const draw = () => {
      list.innerHTML = '';
      v.forEach((it, i) => {
        const row = el('div', 'flex gap-3 items-start p-3 border rounded-lg bg-white');
        const body = el('div', 'flex-1 space-y-3');
        if (it && typeof it === 'object') Object.keys(it).forEach(k => body.append(node(it, k, lbl(k)))); else body.append(node(v, i, ''));
        const del = el('button', 'text-red-600 text-sm shrink-0', 'Hapus'); del.type = 'button';
        del.onclick = () => { if (confirm('Hapus item ini?')) { v.splice(i, 1); dirty = true; draw(); } };
        row.append(body, del); list.append(row);
      });
    };
    draw();
    const add = el('button', 'mt-2 text-emerald-700 text-sm font-semibold', '+ Tambah'); add.type = 'button';
    add.onclick = () => { dirty = true; v.push(shape && typeof shape === 'object' ? Object.fromEntries(Object.keys(shape).map(k => [k, Array.isArray(shape[k]) ? [] : ''])) : ''); draw(); };
    box.append(list);
    if (key === 'images') { // pilih banyak gambar sekaligus
      const pick = el('label', 'inline-block mt-2 text-emerald-700 text-sm font-semibold cursor-pointer', '+ Pilih gambar (bisa banyak sekaligus)');
      const f = el('input', 'hidden'); f.type = 'file'; f.accept = 'image/*'; f.multiple = true;
      f.onchange = async () => {
        try {
          say('Memproses gambar…', true);
          for (const [i, file] of [...f.files].entries()) v.push(await stage(file, i));
          draw(); say(`${f.files.length} gambar ditambahkan. Klik Simpan.`, true);
        } catch (e) { say(e.message); }
        f.value = '';
      };
      pick.append(f); box.append(pick);
    } else box.append(add);
  } else if (v && typeof v === 'object') {
    box.className = 'p-4 bg-white border rounded-xl space-y-3';
    box.append(el('h2', 'font-bold text-lg text-slate-900', title));
    Object.keys(v).forEach(k => box.append(node(v, k, lbl(k))));
  } else {
    if (title) box.append(el('label', 'block text-sm font-medium mb-1', title));
    const img = key === 'photo';
    const long = img ? false : String(v).length > 40 || /description|text|intro|desc/.test(key);
    const inp = el(long ? 'textarea' : 'input', 'w-full rounded-lg border border-slate-300 px-3 py-2 bg-white');
    if (long) inp.rows = 3;
    inp.value = v ?? '';
    inp.oninput = () => { obj[key] = inp.value; dirty = true; };
    box.append(inp);
    if (img) {
      const f = el('input', 'mt-2 text-sm'); f.type = 'file'; f.accept = 'image/*';
      f.onchange = async () => {
        try {
          say('Memproses foto…', true);
          obj[key] = inp.value = await stage(f.files[0]); say('Foto siap. Klik Simpan.', true);
        } catch (e) { say(e.message); }
      };
      box.append(f);
    }
  }
  return box;
}

async function open() {
  data = await (await fetch('../content.json?' + Date.now())).json();
  (data.projects?.items || []).forEach(p => p.images ??= []); // proyek lama belum punya daftar gambar
  const f = $('#form'); f.innerHTML = '';
  Object.keys(data).forEach(k => f.append(node(data, k, lbl(k))));
  $('#login').classList.add('hidden'); $('#editor').classList.remove('hidden');
}

$('#loginForm').onsubmit = async e => {
  e.preventDefault();
  auth = { user: $('#u').value, password: $('#p').value };
  try { await call({ action: 'login' }); sessionStorage.auth = JSON.stringify(auth); await open(); }
  catch (err) { auth = null; $('#loginErr').textContent = err.message; }
};
$('#save').onclick = async () => {
  try {
    // kirim hanya gambar yang masih dipakai; dipecah per ~3,5 MB (batas ukuran request), teks ikut di batch terakhir
    const used = Object.keys(pending).filter(p => JSON.stringify(data).includes(p));
    const batches = [[]]; let size = 0;
    for (const p of used) {
      if (size + pending[p].length > 3_500_000 && batches.at(-1).length) { batches.push([]); size = 0; }
      batches.at(-1).push({ path: p, data: pending[p] }); size += pending[p].length;
    }
    for (const [i, files] of batches.entries()) {
      say(`Menyimpan… (${i + 1}/${batches.length})`, true);
      await call({ action: 'save', files, ...(i === batches.length - 1 ? { content: data } : {}) });
    }
    used.forEach(p => delete pending[p]); dirty = false;
    say('Tersimpan ✓ Situs update ±1 menit.', true);
  } catch (e) { say(e.message); }
};
$('#logout').onclick = () => { sessionStorage.removeItem('auth'); location.reload(); };

if (auth) open().catch(() => sessionStorage.removeItem('auth'));
