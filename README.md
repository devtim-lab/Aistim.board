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
- `data/` — isi yang bisa diedit tanpa pasang ulang
- `tools/` — pembuat CSS

## Menjalankan secara lokal

1. Buka `chrome://extensions`.
2. Aktifkan **Developer mode**.
3. Klik **Load unpacked**, pilih folder `extension/`.
4. Buka tab baru.

## Aistim.sync

Pilihan Tampilan ketiga. Isinya HTML dari `data/sync.html` di repo ini (sekarang "Hallo"). Edit berkas itu lalu push ke `main`; extension mengambilnya saat online dan menyimpannya untuk offline, tanpa pasang ulang. HTML dan CSS berjalan, skrip tidak (iframe sandbox).

Di halaman Aistim.sync (footer): **Edit** (editor langsung, tersimpan di perangkat dan diutamakan atas versi GitHub), **Salin** (ke clipboard), **Unduh** (simpan jadi `sync.html`), **Impor file** (pakai berkas HTML dari perangkat), **Kembalikan dari GitHub** (hapus salinan lokal).

## Tampilan buatan sendiri

Di Pengaturan → tab **Menu**: tambah tampilan baru (nama bebas, maksimal 20), ubah nama, atau hapus. Pilih tampilannya di daftar **Tampilan**. Isi HTML diedit lewat tautan **Edit** di footer tampilan itu (juga ada Salin, Unduh, Impor file). Semua tersimpan di perangkat (`chrome.storage.local`), tanpa upload dan tanpa pasang ulang.

## Mengubah tampilan Start

Halaman `extension/menu/icu.html` memakai Alpine.js (build CSP, `extension/menu/vendor/alpine.js`) dan Tailwind CSS (`extension/menu/tailwind.css`, hasil build). Setelah mengubah class di `icu.html` atau `app.js`, jalankan `sh tools/build.sh`.

## ID extension

ID tetap `ngihdjhihcflmlajbfkleakcglaefgjk` (dari `key` di `manifest.json`), jadi data tersimpan tidak hilang saat extension dipasang ulang dari folder lain.

## Rilis

Naikkan `version` di `extension/manifest.json` lalu push ke `main`; workflow Release membuat `Aistim-Board-<versi>.zip`.

## Rencana berikutnya

- Cuaca / lokasi (butuh izin tambahan)
- Kutipan sendiri
