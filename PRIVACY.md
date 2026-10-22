# Kebijakan Privasi: Aistim Tab

Aistim Tab tidak punya akun, server, analitik, atau iklan, dan tidak mengirim data pribadimu ke pengembang.

## Data yang disimpan di perangkatmu

Hanya di browser ini (`chrome.storage.local`): daftar menu pintasan yang kamu isi sendiri (nama, link, ikon emoji/huruf bila diisi, dan id yang diturunkan dari link). Menghapus extension atau datanya dari pengaturan browser menghapus semuanya.

## Koneksi jaringan

Satu-satunya permintaan yang dibuat adalah mengambil gambar ikon situs dari layanan favicon Google (`https://www.google.com/s2/favicons`) untuk menu yang tidak punya ikon sendiri. Yang dikirim hanya **nama domain induk** menu (mis. `trial.erzap.com` menjadi `erzap.com`), tanpa subdomain, path, query, atau data lain, dan tanpa header Referer. Nama domain pribadi (tanpa titik, alamat IP, `localhost`, `.local`, `.lan`, dan sejenisnya) tidak pernah dikirim. Saat mengisi form, permintaan baru dikirim setelah kolom link selesai diisi, bukan tiap ketikan. Bila ikon sendiri diisi, favicon tidak diminta. Seperti permintaan web biasa, Google dapat mencatat alamat IP dan informasi browser sesuai kebijakan mereka. Saat offline atau gagal, ikon berupa huruf pertama nama.

Extension tidak meminta izin situs (`host_permissions`) apa pun; izin yang dipakai hanya `storage`.

## Kode jarak jauh

Tidak ada. Semua kode ada di dalam paket extension.
