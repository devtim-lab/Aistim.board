# Kebijakan Privasi Aistim Board

Terakhir diperbarui: 17 Oktober 2026

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

## Kode jarak jauh

Extension tidak mengunduh atau menjalankan kode dari luar. Semua JavaScript ikut terkemas. Yang diambil dari GitHub hanya data (JSON dan HTML tanpa skrip), dan HTML itu ditampilkan di iframe terisolasi yang tidak menjalankan skrip.

## Kontak

Pertanyaan: buka issue di https://github.com/devtim-lab/Aistim.board/issues
