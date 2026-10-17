# Aistim Board

Extension Chrome sederhana yang mengganti halaman tab baru dengan dashboard pribadi. Terinspirasi dari [Muslim Board](https://github.com/novalagung/muslimboard).

## Fitur (v0.5)

- Jam dan tanggal (bahasa Indonesia), format 24 jam atau 12 jam
- Sapaan sesuai waktu, dengan nama Anda (opsional)
- Kutipan harian
- Latar: berganti tiap hari, pilih warna, atau gambar sendiri (otomatis diperkecil)
- Daftar tugas: tambah, centang, ubah (klik ✎ atau klik ganda), hapus, hapus yang selesai
- Ekspor / impor tugas (JSON), impor melewati duplikat
- Tampilan **Start (Aistim.icu)** bergaya Windows 8, tersimpan di dalam extension sehingga jalan tanpa internet; pilih di Pengaturan → Tampilan ("Aistim"), kembali lewat tautan di footer
- Tile tampilan Start bisa diubah tanpa rilis: edit `data/tiles.json` lalu push ke `main`; extension mengambilnya dari GitHub saat online dan menyimpannya untuk offline
- Pengaturan lewat tombol ⚙ di kanan atas; semua data tersimpan di `chrome.storage.local`

## Struktur

- `extension/` — halaman utama (Board): `newtab.html`, `script.js`, `style.css`
- `extension/menu/` — halaman tampilan lain: `icu.html` (Aistim), `sync.html` (Aistim.sync dan tampilan buatan sendiri), beserta `app.js`, `sync.js`, `tailwind.css`, `vendor/`
- `extension/sdk/` — library dari SDK Aistim (minify, tanpa jaringan/eval): `secp256k1.js` (tanda tangan dan kunci, dipakai `menu/verify.js`), `hkdf.js`, `keccak.js`, `base64.js` (disiapkan, belum dipakai halaman mana pun)
- `data/` — isi yang bisa diedit tanpa pasang ulang
- `tools/` — pembuat CSS (`build.sh`), paket Web Store (`build-store.py`), penanda tangan data (`sign.mjs`)

## Private key admin

Ikon kunci di pojok kanan atas Board (di sebelah ⚙) menyimpan private key admin Aistim (64 karakter hex atau blok PEM) di `chrome.storage.local` browser itu, tanpa enkripsi. Belum dipakai fitur lain di extension ini. Pakai hanya di perangkat yang dipercaya; tombol Hapus menghapusnya.

## Menjalankan secara lokal

1. Buka `chrome://extensions`.
2. Aktifkan **Developer mode**.
3. Klik **Load unpacked**, pilih folder `extension/`.
4. Buka tab baru.

## Aistim.sync

Pilihan Tampilan ketiga. Isinya HTML dari `data/sync.html` di repo ini (sekarang "Hallo"). Edit berkas itu lalu push ke `main`; extension mengambilnya saat online dan menyimpannya untuk offline, tanpa pasang ulang. HTML dan CSS berjalan, skrip tidak (iframe sandbox).

Di halaman Aistim.sync (footer): **Edit** (editor langsung, tersimpan di perangkat dan diutamakan atas versi GitHub), **Salin** (ke clipboard), **Unduh** (simpan jadi `sync.html`), **Impor file** (pakai berkas HTML dari perangkat), **Kembalikan dari GitHub** (hapus salinan lokal).

### Upload ke GitHub (Aistim.sync)

Ikon awan-panah di footer Aistim.sync menyimpan HTML ke `data/sync.html` di repo ini lewat API GitHub, sehingga semua perangkat mengikutinya. Ikon kunci untuk mengisi atau menghapus token. Token dibuat sendiri (fine-grained, hanya repo Aistim.board, izin **Contents: Read and write**) dan hanya tersimpan di browser itu. Repo ini public, jadi isi yang diunggah bisa dibaca siapa saja.

## Verifikasi data dari GitHub

Data yang diambil dari GitHub (`data/tiles.json`, `data/sync.html`) hanya dipakai bila ada berkas tanda tangan `<nama>.sig` yang cocok dengan public key admin (tertanam di `extension/menu/verify.js`, sama dengan admin di `akun.json` repo Auth). Tanda tangan ECDSA secp256k1 memakai library `extension/sdk/secp256k1.js` dari SDK Aistim. Ini hanya memeriksa data; tidak ada kode yang diunduh atau dijalankan. Data yang tidak ada tanda tangannya, tidak cocok, atau diubah diabaikan, dan extension memakai salinan terverifikasi terakhir atau data bawaan.

Menandatangani (di komputer sendiri, private key jangan masuk repo):

```
AISTIM_ADMIN_KEY=<64 hex> node tools/sign.mjs data/tiles.json data/sync.html
```

Commit dan push berkas `*.sig` bersama datanya. Di versi lengkap, upload dari Aistim.sync otomatis ikut menandatangani `data/sync.html.sig` bila key admin (hex) tersimpan lewat ikon kunci di Board.

## Password Aistim.sync

Ikon gembok di Aistim.sync membuat, mengubah, atau menghapus password; tombol "Buat otomatis" membuat password acak 24 karakter (dari `Secp256k1.utils.randomBytes` SDK). Yang disimpan hanya hash (PBKDF2-SHA256, 200.000 putaran, salt acak 16 byte, lalu HKDF dari SDK `secp256k1.js`) di `chrome.storage.local` (`syncPass`), bukan passwordnya. Saat password aktif, Aistim.sync meminta password dulu: isi HTML tidak dimuat, ikon edit/salin/unduh disembunyikan, editor Aistim.sync di Pengaturan menolak membuka, dan salah memasukkan membuat jeda makin lama. Ini penguncian tampilan di perangkat itu saja; HTML-nya sendiri tidak dienkripsi, jadi tidak melindungi dari orang yang bisa membuka profil browser.

## Tampilan buatan sendiri

Di Pengaturan → tab **Menu** ada tabel CRUD: tambah menu baru (maksimal 20), pakai, edit HTML, ubah nama, hapus. Pilih tampilannya di daftar **Tampilan**. Isi HTML diedit lewat tautan **Edit** di footer tampilan itu (juga ada Salin, Unduh, Impor file). Semua tersimpan di perangkat (`chrome.storage.local`), tanpa upload dan tanpa pasang ulang.

## Mengubah tampilan Start

Halaman `extension/menu/icu.html` memakai Alpine.js (build CSP, `extension/menu/vendor/alpine.js`) dan Tailwind CSS (`extension/menu/tailwind.css`, hasil build). Setelah mengubah class di `icu.html` atau `app.js`, jalankan `sh tools/build.sh`.

## ID extension

ID tetap `ngihdjhihcflmlajbfkleakcglaefgjk` (dari `key` di `manifest.json`), jadi data tersimpan tidak hilang saat extension dipasang ulang dari folder lain.

## Rilis

Naikkan `version` di `extension/manifest.json` lalu push ke `main`; workflow Release membuat dua berkas:

- `Aistim-Board-<versi>.zip`: versi lengkap (Load unpacked), termasuk ikon private key admin dan upload ke GitHub.
- `Aistim-Board-store-<versi>.zip`: untuk Chrome Web Store. Dibuat oleh `tools/build-store.py`: tanpa `key` di manifest, tanpa izin `api.github.com`, tanpa fitur kunci admin dan upload/token GitHub. Semua JS ikut terkemas; tidak ada kode jarak jauh, `eval`, atau obfuscation. Yang diambil dari GitHub hanya data (`tiles.json`) dan HTML tanpa script yang tampil di iframe terisolasi.

Kode yang hanya untuk versi lengkap diberi penanda `<!--PRO-->...<!--/PRO-->` (HTML) dan `/*PRO*/...*/PRO*/` (JS); build Web Store membuangnya dan gagal bila masih ada sisa `adminKey`, `ghToken`, atau `api.github.com`.

## Rencana berikutnya

- Cuaca / lokasi (butuh izin tambahan)
- Kutipan sendiri
