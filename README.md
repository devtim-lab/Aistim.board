# Aistim Board

Extension Chrome sederhana yang mengganti halaman tab baru dengan dashboard pribadi. Terinspirasi dari [Muslim Board](https://github.com/novalagung/muslimboard).

## Fitur (v0.3)

- Jam dan tanggal (bahasa Indonesia), format 24 jam atau 12 jam
- Sapaan sesuai waktu, dengan nama Anda (opsional)
- Kutipan harian
- Latar: berganti tiap hari, pilih warna, atau gambar sendiri (otomatis diperkecil)
- Daftar tugas: tambah, centang, ubah (klik ✎ atau klik ganda), hapus, hapus yang selesai
- Ekspor / impor tugas (JSON), impor melewati duplikat
- Tampilan **Start (Aistim.icu)** bergaya Windows 8, tersimpan di dalam extension sehingga jalan tanpa internet; pilih di Pengaturan → Tampilan, kembali lewat tautan di footer
- Pengaturan lewat tombol ⚙ di kanan atas; semua data tersimpan di `chrome.storage.local`

## Menjalankan secara lokal

1. Buka `chrome://extensions`.
2. Aktifkan **Developer mode**.
3. Klik **Load unpacked**, pilih folder `extension/`.
4. Buka tab baru.

## Rilis

Naikkan `version` di `extension/manifest.json` lalu push ke `main`; workflow Release membuat `Aistim-Board-<versi>.zip`.

## Rencana berikutnya

- Cuaca / lokasi (butuh izin tambahan)
- Kutipan sendiri
