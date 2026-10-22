# Kebijakan Privasi Aistim Board

Terakhir diperbarui: 22 Oktober 2026

Aistim Board adalah extension Chrome yang menggantikan halaman tab baru dengan dashboard (jam, menu pintasan, tampilan Aistim, Aistim.sync, dan tampilan buatan sendiri).

## Data yang dikumpulkan

Aistim Board **tidak mengumpulkan, mengirim, menjual, atau membagikan data pribadi** kepada pengembang atau pihak ketiga. Tidak ada akun, pelacak, analitik, atau iklan.

## Data yang disimpan di perangkatmu

Semua berikut hanya tersimpan di browser ini (`chrome.storage.local` dan `localStorage`) dan tidak pernah dikirim ke mana pun:

- pengaturan (nama sapaan, format jam, latar);
- menu pintasan di Board (nama, link, dan ikon yang kamu isi sendiri; ikon gambar disimpan sebagai data kecil di browser, tidak diunduh dari internet; id menu hanya turunan dari link dan tidak dikirim ke mana pun);
- daftar tugas dari versi lama, bila ada (sudah tidak ditampilkan);
- HTML tampilan Aistim.sync dan tampilan buatan sendiri yang kamu tulis atau impor;
- riwayat chat di tampilan Aistim (balasan dibuat lokal);
- hash password Aistim.sync bila kamu membuatnya (PBKDF2-SHA256 dengan salt; passwordnya sendiri tidak disimpan);
- salinan terakhir data tile, HTML, dan menu bersama yang sudah diverifikasi, agar bisa dipakai offline;
- hasil pemeriksaan pembaruan terakhir (nomor versi dan waktu; hanya versi lengkap).

Menghapus extension atau datanya dari pengaturan browser menghapus semuanya. Password yang lupa tidak bisa dipulihkan.

## Koneksi jaringan

Extension hanya mengambil tiga berkas data publik beserta tanda tangannya dari `https://raw.githubusercontent.com/devtim-lab/Aistim.board/` (`data/tiles.json`, `data/sync.html`, `data/menu.json`, dan berkas `.sig`-nya). `data/menu.json` berisi daftar menu bersama (nama, link, ikon) yang tampil di kartu Menu untuk semua pengguna. Permintaan ini tidak membawa data pribadimu. Seperti permintaan web biasa, GitHub dapat mencatat alamat IP dan informasi browser sesuai kebijakan privasi GitHub. Data hanya dipakai bila tanda tangannya cocok dengan kunci publik yang tertanam di extension.

### Ikon situs (favicon Google)

Ikon menu diambil otomatis dari layanan favicon Google (`https://www.google.com/s2/favicons`) untuk setiap menu yang tidak punya ikon sendiri. Yang dikirim hanya **nama domain induk** menu, tanpa subdomain (mis. `trial.erzap.com` menjadi `erzap.com`), tanpa path, query, atau data lain, dan tanpa header Referer. Google dapat mencatat alamat IP dan informasi browser sesuai kebijakan mereka, seperti permintaan web biasa. Nama domain pribadi (tanpa titik, alamat IP, `localhost`, `.local`, `.lan`, dan sejenisnya) tidak pernah dikirim. Saat mengisi form, permintaan baru dikirim setelah kolom link selesai diisi, bukan tiap ketikan. Bila ikon sendiri (emoji atau gambar) diisi, favicon tidak diminta. Bila tidak terjangkau, ikon berupa huruf pertama nama.

### Pemeriksaan pembaruan (hanya versi lengkap)

Versi lengkap (dipasang lewat Load unpacked) memeriksa rilis terbaru lewat `https://api.github.com/repos/devtim-lab/Aistim.board/releases/latest`, paling sering sekali tiap 6 jam dan saat kamu menekan **Periksa**. Permintaan ini tanpa token, tanpa cookie, dan tanpa data pribadi; yang dibaca hanya nomor versi dan daftar berkas rilis. Seperti permintaan web biasa, GitHub dapat mencatat alamat IP dan informasi browser sesuai kebijakan GitHub. Extension tidak mengunduh atau memasang pembaruan sendiri: tombol Unduh hanya membuka halaman unduhan GitHub di tab baru. Versi Chrome Web Store tidak punya fitur ini dan tidak mengakses `api.github.com`.

### Foto online (opsional)

Hanya bila kamu memilih latar "Foto online" di Pengaturan (tidak aktif secara bawaan), halaman tab baru memuat satu gambar dari `https://picsum.photos/` (foto Unsplash). Permintaan gambar itu memuat ukuran layar dan kode acak atau tanggal untuk memilih foto. Seperti permintaan web biasa, picsum.photos dapat mencatat alamat IP dan informasi browser sesuai kebijakan mereka. Extension tidak mengirim data pribadi apa pun ke sana. Saat offline atau gagal, dipakai gradien.

## Kode jarak jauh

Extension tidak mengunduh atau menjalankan kode dari luar. Semua JavaScript ikut terkemas. Yang diambil dari GitHub hanya data (JSON dan HTML tanpa skrip), dan HTML itu ditampilkan di iframe terisolasi yang tidak menjalankan skrip.

## Kontak

Pertanyaan: buka issue di https://github.com/devtim-lab/Aistim.board/issues
