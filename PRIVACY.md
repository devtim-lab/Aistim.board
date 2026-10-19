# Kebijakan Privasi Aistim Board

Terakhir diperbarui: 19 Oktober 2026 (logo situs pada tombol link)

Aistim Board adalah extension Chrome yang menggantikan halaman tab baru dengan dashboard (jam, tugas, tampilan Aistim, Aistim.sync, dan tampilan buatan sendiri).

## Data yang dikumpulkan

Aistim Board **tidak mengumpulkan, mengirim, menjual, atau membagikan data pribadi** kepada pengembang atau pihak ketiga. Tidak ada akun, pelacak, analitik, atau iklan.

## Data yang disimpan di perangkatmu

Semua berikut hanya tersimpan di browser ini (`chrome.storage.local` dan `localStorage`) dan tidak pernah dikirim ke mana pun:

- pengaturan (nama sapaan, format jam, latar);
- daftar tugas;
- HTML tampilan Aistim.sync dan tampilan buatan sendiri yang kamu tulis atau impor;
- riwayat chat di tampilan Aistim (balasan dibuat lokal);
- hash password Aistim.sync bila kamu membuatnya (PBKDF2-SHA256 dengan salt; passwordnya sendiri tidak disimpan);
- salinan terakhir data tile dan HTML yang sudah diverifikasi, agar bisa dipakai offline.

Menghapus extension atau datanya dari pengaturan browser menghapus semuanya. Password yang lupa tidak bisa dipulihkan.

## Koneksi jaringan

Extension hanya mengambil dua berkas data publik beserta tanda tangannya dari `https://raw.githubusercontent.com/devtim-lab/Aistim.board/` (`data/tiles.json`, `data/sync.html`, dan berkas `.sig`-nya). Permintaan ini tidak membawa data pribadimu. Seperti permintaan web biasa, GitHub dapat mencatat alamat IP dan informasi browser sesuai kebijakan privasi GitHub. Data hanya dipakai bila tanda tangannya cocok dengan kunci publik yang tertanam di extension.

### Foto online (opsional)

Hanya bila kamu memilih latar "Foto online" di Pengaturan (tidak aktif secara bawaan), halaman tab baru memuat satu gambar dari `https://picsum.photos/` (foto Unsplash). Permintaan gambar itu memuat ukuran layar dan kode acak atau tanggal untuk memilih foto. Seperti permintaan web biasa, picsum.photos dapat mencatat alamat IP dan informasi browser sesuai kebijakan mereka. Extension tidak mengirim data pribadi apa pun ke sana. Saat offline atau gagal, dipakai gradien.

### Logo situs pada tombol link (favicon)

Tombol link di tampilan Aistim (Start), seperti CRM, Shopee, dan Midtrans, menampilkan logo situs tujuannya. Logo diambil dari layanan favicon Google (`https://t0.gstatic.com/faviconV2`). Yang dikirim hanya alamat domain situs di tombol itu (misalnya `https://shopee.com`), tanpa path, tanpa data pribadi, dan tanpa referrer. Seperti permintaan web biasa, Google dapat mencatat alamat IP dan informasi browser sesuai kebijakan privasi Google. Hanya tombol yang diberi tanda favicon di `data/tiles.json` yang memakainya. Jika layanan tidak tersedia atau situs tidak punya logo, tombol memakai ikon bawaan.

## Kode jarak jauh

Extension tidak mengunduh atau menjalankan kode dari luar. Semua JavaScript ikut terkemas. Yang diambil dari GitHub hanya data (JSON dan HTML tanpa skrip), dan HTML itu ditampilkan di iframe terisolasi yang tidak menjalankan skrip.

## Kontak

Pertanyaan: buka issue di https://github.com/devtim-lab/Aistim.board/issues
