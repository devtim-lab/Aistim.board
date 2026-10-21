# Aistim Board

Extension Chrome sederhana yang mengganti halaman tab baru dengan dashboard pribadi. Terinspirasi dari [Muslim Board](https://github.com/novalagung/muslimboard).

## Fitur

- Jam dan tanggal (bahasa Indonesia), format 24 jam atau 12 jam
- Sapaan sesuai waktu, dengan nama Anda (opsional)
- Kutipan harian
- Latar: berganti tiap hari, pilih warna, atau gambar sendiri (otomatis diperkecil)
- Kartu **Menu**: pintasan ke situs favorit. Tombol **+** membuka form Link, Nama (opsional), dan Ikon (emoji/huruf, atau gambar sendiri yang otomatis dipotong persegi dan diperkecil); tanpa ikon dipakai huruf pertama nama. Link tanpa `https://` dilengkapi otomatis; hanya `http`/`https` yang diterima. Tombol ✎ di kartu masuk ke mode atur: ketuk menu untuk mengubah atau menghapusnya. Maksimal 24 menu, tersimpan di perangkat (`chrome.storage.local`, kunci `pins`)
- **Menu bersama**: menu yang tampil di semua pengguna, dikelola admin lewat `data/menu.json` (lihat bagian Menu bersama)
- Daftar tugas dari versi lama sudah tidak ditampilkan; datanya (`todos`) tidak dihapus dari browser
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

## Latar Board

Pengaturan → Latar: berganti tiap hari (gradien), pilih warna, gambar sendiri (lokal), atau **Foto online** (`picsum.photos`, foto Unsplash). Foto online bisa berganti tiap buka tab baru, tiap jam, atau tiap hari (seed tetap, jadi foto yang sama dalam periode itu). Gambar dimuat langsung sebagai latar (tanpa izin host tambahan) dengan lapisan gelap tipis agar teks terbaca; offline atau gagal memakai gradien. Dicatat di `PRIVACY.md`.

## Aistim.sync

Pilihan Tampilan ketiga. Isinya HTML dari `data/sync.html` di repo ini (sekarang "Hallo"). Edit berkas itu lalu push ke `main`; extension mengambilnya saat online dan menyimpannya untuk offline, tanpa pasang ulang. HTML dan CSS berjalan, skrip tidak (iframe sandbox).

Di halaman Aistim.sync (footer): **Edit** (editor langsung, tersimpan di perangkat dan diutamakan atas versi GitHub), **Kembalikan dari GitHub** (hapus salinan lokal).

### Upload ke GitHub (Aistim.sync)

Ikon awan-panah di footer Aistim.sync menyimpan HTML ke `data/sync.html` di repo ini lewat API GitHub, sehingga semua perangkat mengikutinya. Ikon kunci untuk mengisi atau menghapus token. Token dibuat sendiri (fine-grained, hanya repo Aistim.board, izin **Contents: Read and write**) dan hanya tersimpan di browser itu. Repo ini public, jadi isi yang diunggah bisa dibaca siapa saja.

## Menu bersama (tampil di semua pengguna)

Selain menu pribadi, kartu Menu di Board menampilkan menu bersama dari `data/menu.json`. Isinya sama untuk semua pengguna, ditaruh sebelum menu pribadi, dan hanya bisa dibaca (di mode atur, ketukan hanya menampilkan pemberitahuan). Cara kerjanya sama dengan `data/tiles.json`: extension mengambilnya dari GitHub saat online, menyimpannya untuk offline, dan **hanya memakainya bila ada `data/menu.json.sig` yang cocok dengan public key admin**. Tanpa tanda tangan, atau bila isinya diubah, daftarnya diabaikan.

Format (maksimal 24 menu; `ikon` dan `gambar` opsional):

```json
{
  "versi": 1,
  "menu": [
    { "nama": "CRM", "href": "https://crm.aistim.icu", "ikon": "🏢" },
    { "nama": "Shopee", "href": "https://subaccount.shopee.com/shops" }
  ]
}
```

- `href`: link `http`/`https`. `nama`: maksimal 30 karakter. `ikon`: emoji atau 1–2 huruf; kosong berarti huruf pertama nama.
- `gambar`: opsional, data URL PNG (`data:image/png;base64,...`, maksimal 60.000 karakter) sebagai ganti ikon. Gambar dari menu pribadi (kotak 96x96) bisa dipakai.
- Satu entri yang tidak valid membuat seluruh daftar ditolak, supaya data setengah rusak tidak tampil.

Menerbitkan, dua cara. Perubahan sampai ke pengguna saat mereka membuka tab baru (cache GitHub bisa beberapa menit).

**1. Dari Board (admin, tanpa terminal).** Di browser tempat password Aistim.sync admin dibuat, kartu Menu menampilkan tombol **Terbitkan**, dan form menu punya kotak **Bagikan ke semua pengguna**. Centang Bagikan pada menu yang ingin dibagikan (muncul titik biru di ikonnya), lalu ketuk **Terbitkan** dan masukkan password. Private key diturunkan dari password (`HKDF(PBKDF2(password, salt, 200000))`, rumus yang sama dengan Aistim.sync), dipakai menandatangani `menu.json`, lalu dibuang; tidak pernah disimpan.

- Versi lengkap langsung mengunggah `data/menu.json` dan `data/menu.json.sig` ke GitHub. Token diambil dari `data/key.json` (terenkripsi, lihat bagian Token terenkripsi) dan dibuka dengan key dari password yang baru saja Anda masukkan; bila tidak ada, dipakai token yang disimpan lewat Aistim.sync (ikon kunci di bar bawah). Versi Web Store, atau tanpa token, menampilkan tombol salin untuk kedua isi itu; tempel ke repo lalu commit.
- Isi daftar = semua menu pribadi yang bertanda Bagikan. Menghapus tanda lalu menerbitkan ulang menariknya dari semua pengguna (dialog menyebut menu yang akan dihapus). Menerbitkan tanpa menu bertanda mengosongkan daftar.
- Hanya browser yang salt-nya cocok dengan public key admin di `verify.js` yang bisa menandatangani. Salt dibuat acak saat password dibuat dan tersimpan di browser itu, jadi password yang sama di browser lain menghasilkan key lain dan ditolak.

**2. Dari terminal** (di komputer sendiri, private key jangan masuk repo):

```
AISTIM_ADMIN_KEY=<64 hex> node tools/sign.mjs data/menu.json
```

Commit dan push `data/menu.json` bersama `data/menu.json.sig`.

## Token terenkripsi (data/key.json)

`data/key.json` berisi token GitHub (secret `AISTIM_HUB`) yang dienkripsi dengan kunci turunan private key admin (secret `AISTIM_PRIVATE`). Berkas ini aman di repo publik karena hanya pemegang private key admin yang bisa membukanya, dan Board (versi lengkap) membukanya hanya saat Terbitkan, dengan private key yang diturunkan dari password. Jadi token tidak perlu tersimpan mentah di browser.

Membuat atau memperbaruinya: GitHub, Actions, **Encrypt hub token**, Run workflow (jalankan ulang bila token diganti). Workflow membaca kedua secret, mengenkripsi, memeriksa bahwa hasilnya bisa dibuka kembali dan sama dengan token aslinya, lalu mengommit `data/key.json`. Nilai secret tidak pernah dicetak.

- Format: `{ versi, algoritma, pub, salt, iv, ct }`. Kunci AES-256 = HKDF-SHA256(private key 32 byte, `salt`, info `aistim-hub-token`); `ct` = hex dari AES-256-GCM(token) diikuti tag 16 byte; AAD = `aistim-key.json:v1:` + `pub`. Salt dan IV acak, jadi hasilnya berbeda tiap dijalankan. Perubahan satu karakter pun membuat pembukaan gagal.
- Token cukup izin **Contents: Read and write** pada repo ini saja. Berkas ini hanya sekuat password admin: siapa pun yang mengetahui private key admin (atau password beserta salt-nya) bisa membuka tokennya, sekaligus menandatangani data. Pakai password yang kuat.
- Sama seperti penandatanganan, Board hanya bisa membukanya di browser tempat password admin dibuat (salt-nya tersimpan di sana). Di tempat lain dipakai token tersimpan atau tombol salin.
- Kode yang memegang kedua secret (`tools/key-json.mjs` dan `extension/sdk/secp256k1.js`) dikunci dengan hash di `encrypt-token.yml`, dengan aturan yang sama seperti Sign data.
- Di komputer sendiri: `AISTIM_PRIVATE=<64 hex> node tools/key-json.mjs tampil` mencetak token (jangan dijalankan di tempat yang log-nya dibagikan).

## Verifikasi data dari GitHub

Data yang diambil dari GitHub (`data/tiles.json`, `data/sync.html`, `data/menu.json`) hanya dipakai bila ada berkas tanda tangan `<nama>.sig` yang cocok dengan public key admin (tertanam di `extension/menu/verify.js`, sama dengan admin di `akun.json` repo Auth). Tanda tangan ECDSA secp256k1 memakai library `extension/sdk/secp256k1.js` dari SDK Aistim. Ini hanya memeriksa data; tidak ada kode yang diunduh atau dijalankan. Data yang tidak ada tanda tangannya, tidak cocok, atau diubah diabaikan, dan extension memakai salinan terverifikasi terakhir atau data bawaan.

Menandatangani (di komputer sendiri, private key jangan masuk repo):

```
AISTIM_ADMIN_KEY=<64 hex> node tools/sign.mjs data/tiles.json data/sync.html
```

Commit dan push berkas `*.sig` bersama datanya. Di versi lengkap, upload dari Aistim.sync otomatis ikut menandatangani `data/sync.html.sig` bila key admin (hex) tersimpan lewat ikon kunci di Board.

**Tanpa komputer: workflow Sign data.** `.github/workflows/sign-data.yml` menandatangani `data/tiles.json`, `data/sync.html`, dan `data/menu.json` di GitHub lalu mengommit berkas `.sig`-nya. Jalankan lewat GitHub, Actions, Sign data, Run workflow (bisa dari aplikasi GitHub di HP). Syaratnya satu secret repo (Settings, Secrets and variables, Actions): `AISTIM_PRIVATE` berisi private key admin 64 karakter hex (bukan PEM). Token tambahan tidak diperlukan; commit memakai `GITHUB_TOKEN` bawaan.

- Hanya manual, tidak otomatis saat push. Data ditandatangani apa adanya, jadi periksa dulu commit terbaru yang menyentuh `data/`. Isi kolom `sha` (awal SHA commit yang sudah diperiksa) bila ingin workflow berhenti kalau `main` sudah bergeser.
- Private key hanya dipakai langkah "Tandatangani". Kode yang berjalan bersamanya (`tools/sign.mjs` dan `extension/sdk/secp256k1.js`, hanya memakai modul bawaan Node) dikunci dengan hash di workflow: bila berubah, langkah berhenti sebelum key dipakai. Setelah sengaja mengubah salah satunya, perbarui hash di `sign-data.yml` (`sha256sum tools/sign.mjs extension/sdk/secp256k1.js`).
- Sisa risiko: data yang diubah orang lain ikut ditandatangani bila Anda menjalankan workflow tanpa memeriksanya. Pemegang izin Workflows di repo ini bisa mengubah workflow dan membaca secret, jadi jangan beri token upload izin itu.
- `akun.json.sig` tidak termasuk; tanda tangan akun (130 hex) dibuat lewat panel profil Aistim.sync.

## Daftar akun (akun.json)

`data/akun.json` (publik) berisi akun: `nama`, `addr`, `pub`, `role` (`admin` atau `user`), `script`, `dibuat`, dengan format yang sama seperti `akun.json` di repo Auth. Hanya data publik; jangan menaruh hash password, private key, atau token di sana. Identitas = pasangan kunci yang diturunkan dari password Aistim.sync (lihat panel profil).

- **Akar kepercayaan:** salinan bawaan `extension/menu/akun.json` (ikut terkemas di extension). `tools/cek-akun.mjs` memeriksa struktur, role, dan `addr` = keccak256(`pub`); dijalankan di workflow Release.
- **Hanya admin yang bisa mengubah.** Di panel profil, tombol **Kelola akun** hanya muncul bila addr dan pub profil terdaftar sebagai `admin`. Admin bisa menambah, mengubah (nama, role, script), dan menghapus akun. Aturannya: minimal satu admin, nama dan pub unik, tidak bisa menghapus atau menurunkan akun sendiri. Menyimpan meminta password admin lagi untuk menandatangani daftar (tanda tangan 130 hex: r, s, recid; private key diturunkan dari password dan tidak disimpan).
- **Pemberlakuan di perangkat lain:** simpan `akun.json` dan `akun.json.sig` ke `data/` (tombol salin; di versi lengkap ada **Unggah ke GitHub**). Extension hanya menerima daftar dari GitHub bila penandatangannya (dipulihkan dari tanda tangan) adalah admin di salinan bawaan atau di daftar terverifikasi saat ini. Admin baru yang ditambahkan lewat daftar baru dipercaya setelah extension menerima daftar yang menambahkannya; salinan bawaan baru di rilis berikutnya menjadi akar yang baru.
- Pembatasan ini ditegakkan oleh tanda tangan, bukan hanya tampilan: orang lain tidak bisa membuat daftar yang diterima extension tanpa kunci admin.

## Password Aistim.sync

Password dibuat, diubah, atau dihapus lewat tombol **Atur password** di panel profil (ikon profil, pojok kanan atas). Yang disimpan hanya hash (PBKDF2-SHA256, 200.000 putaran, salt acak 16 byte, lalu HKDF dari SDK `secp256k1.js`) di `chrome.storage.local` (`syncPass`), bukan passwordnya. Saat password aktif dan belum login, Aistim.sync terbuka dalam **mode lihat**: hanya salinan GitHub yang tampil (hasil edit lokal tidak dimuat), ikon edit/salin/unduh/impor/upload disembunyikan, hanya ikon Board dan **Login** yang terlihat (Login juga terlihat bila belum ada password; ketukannya membuka dialog buat password), editor Aistim.sync di Pengaturan menolak membuka, dan salah memasukkan membuat jeda makin lama. Ikon profil (pojok kanan atas; di mode lihat menunya hanya berisi tombol **Login**) menampilkan **hash** password, **addr**, dan **pub**. Pasangan kunci secp256k1 diturunkan dari password (`HKDF(PBKDF2(password))`, info `aistim-sync-key`) dengan SDK; private key tidak disimpan, pub (terkompresi) dan addr (`0x` + 20 byte terakhir keccak256 pub tak terkompresi, sama seperti `akun.json` di Auth) disimpan di `syncPass`. Ketuk nilai untuk menyalin.

Masuk dan keluar: ketuk ikon **Login** untuk memunculkan kolom password. Centang "Tetap masuk 30 menit" (bawaan) menyimpan sesi di `chrome.storage.session` (hilang saat browser ditutup, terikat ke hash password yang berlaku, diperpanjang tiap Aistim.sync dibuka). **Keluar** ada di panel profil dan langsung kembali ke mode lihat. Yang baru membuat atau mengubah password tetap masuk. Mengubah, menghapus, atau mereset password mengakhiri sesi.

Lupa password: ketuk Login lalu "Lupa password?" lalu "Reset dan hapus". Itu menghapus password dan hasil edit lokal Aistim.sync (data di GitHub tidak terpengaruh); isi lokal tidak pernah bisa dibaca tanpa password.

Ini penguncian tampilan di perangkat itu saja; HTML-nya sendiri tidak dienkripsi, jadi tidak melindungi dari orang yang bisa membuka profil browser.

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
