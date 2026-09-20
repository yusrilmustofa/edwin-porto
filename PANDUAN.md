# Panduan Edit Konten

Semua tulisan website ada di **`content.json`**. `index.html` tidak perlu disentuh.

## Cara A — Edit file langsung
1. Buka `content.json` dengan Notepad/VS Code.
2. Ubah teks di antara tanda kutip `"..."` (jangan hapus tanda kutip, koma, atau kurung).
3. Simpan, lalu upload ulang folder ke hosting.
4. Foto: taruh di folder `images/`, lalu isi `"photo": "images/foto.jpg"`.

## Cara B — Halaman admin (untuk client)
Buka `https://alamat-situs-anda/admin`, login dengan username + password, edit lewat formulir, klik **Simpan**. Situs update sendiri dalam ±1 menit. Client tidak perlu akun GitHub.

### Setup satu kali (oleh developer)
1. Upload seluruh folder ke repo GitHub, lalu hubungkan repo ke Netlify (Add new site → Import from Git).
2. Buat token GitHub: Settings → Developer settings → Fine-grained tokens → akses hanya repo ini, izin **Contents: Read and write**.
3. Netlify → Site configuration → Environment variables, tambahkan:
   - `ADMIN_USER` — username untuk client
   - `ADMIN_PASSWORD` — password (panjang & unik)
   - `GITHUB_TOKEN` — token dari langkah 2
   - `GITHUB_REPO` — `username/nama-repo`
   - `GITHUB_BRANCH` — opsional, default `main`
4. Deploy ulang (Deploys → Trigger deploy) supaya variabel terbaca.

Catatan: setelah Simpan, `content.json` di repo berubah dan Netlify deploy otomatis. Jika halaman admin dibuka ulang sebelum deploy selesai, isinya masih versi lama.
