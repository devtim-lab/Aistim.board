# Aistim Tab

Extension Chrome yang mengganti halaman **tab baru** dengan dua kartu: **jam dan kata-kata** di atas, lalu kartu **Menu** berisi pintasan ke situs yang sering dibuka, dengan tile **+** untuk menambah menu.

Versi lama (Aistim Board dengan jam, kutipan, Aistim.sync, dan menu bersama bertanda tangan) ada di branch [`main-v1`](../../tree/main-v1).

## Fitur

- **Jam dan kata-kata** (kartu atas): jam 24 jam yang berganti tepat di pergantian menit, tanggal dalam bahasa Indonesia, dan satu kata-kata per hari (berganti tiap tengah malam menurut jam di perangkatmu). Semuanya dihitung di browser, tanpa jaringan.
- **Tambah**: ketuk tile **+** (lingkaran dengan tanda plus tipis, tanpa teks; ukuran dan warnanya sama dengan tile tambah di tab baru Brave), isi **Link** (dan **Nama** bila mau; kosong berarti nama situsnya), lalu Simpan. Link tanpa `https://` dilengkapi otomatis; hanya `http`/`https` yang diterima. Maksimal 24 menu.
- **Buka**: ketuk tile membuka link di **tab baru**; halaman menu tetap terbuka.
- **Ubah dan hapus** ada di sisi belakang kartu: ketuk **Atur** (kartu berbalik), lalu **Ubah** atau **Hapus** per baris (hapus meminta konfirmasi), **Selesai** atau Escape untuk kembali. Sisi depan tidak punya tombol edit.
- **Ikon otomatis** dari favicon situs lewat Google. Yang dikirim hanya nama **domain induk** (`trial.erzap.com` menjadi `erzap.com`, `shop.example.co.id` menjadi `example.co.id`), tanpa subdomain, path, atau query, dan baru setelah kolom link selesai diisi. Host pribadi (tanpa titik, alamat IP, `localhost`, `.local`, `.lan`, dan sejenisnya) tidak pernah dikirim. Bila gagal dimuat dipakai huruf pertama nama. Di **Ikon sendiri (opsional)** bisa diisi emoji atau huruf sebagai ganti favicon.
- **Responsif**: 320 px sampai desktop; mengikuti `prefers-reduced-motion`.
- Perubahan di satu tab baru ikut tampil di tab baru lain yang sedang terbuka.

## ID tetap

ID extension tidak berubah walau dipasang dari folder berbeda, karena `extension/manifest.json` memuat `key` (public key):

```
lapfimgknhjnohjplfedmfdckjebjhil
```

ID ini juga tampil di sisi belakang kartu (Atur). Data menu tersimpan per ID, jadi tidak hilang saat extension dipasang ulang.
`tools/id-extension.py` menghitung ID dari `key` dan gagal bila `key` hilang atau berubah; workflow Release menjalankannya sebelum membuat zip. **Jangan ubah `key`**: ID baru berarti data menu lama tidak terbaca.

**ID menu** juga tetap: tiap menu punya id yang diturunkan dari link-nya (tanpa skema, `www.`, huruf besar/kecil nama situs, `/` di akhir, dan `#bagian`). Link yang sama selalu menghasilkan id yang sama, sehingga tidak bisa tampil dobel: menambah link yang sudah ada ditolak, dan data lama yang dobel digabung saat halaman dibuka.

## Memasang

1. Unduh `Aistim-Tab-<versi>.zip` dari [Releases](../../releases) lalu ekstrak.
2. Buka `chrome://extensions`, aktifkan **Mode pengembang**, pilih **Load unpacked**, dan tunjuk folder hasil ekstrak (yang berisi `manifest.json`).
3. Buka tab baru.

Memperbarui: ekstrak zip versi baru ke folder yang sama, lalu tekan ikon muat ulang (⟳) pada kartu extension.

## Data

Menu tersimpan di browser (`chrome.storage.local`, kunci `pins`: `id`, `nama`, `href`, `ikon`). Tidak ada akun dan tidak ada server. Lihat [PRIVACY.md](PRIVACY.md).

## Struktur

- `extension/`: `manifest.json`, `newtab.html`, `script.js`, `style.css`, `icons/`
- `tools/id-extension.py`: pemeriksa ID tetap
- `.github/workflows/release.yml`: setiap push ke `main` membuat atau memperbarui release `v<versi>` dengan `Aistim-Tab-<versi>.zip` (naikkan `version` di `manifest.json` untuk rilis baru)
