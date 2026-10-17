/* Verifikasi data dari GitHub: tanda tangan ECDSA secp256k1 (library: ../sdk/secp256k1.js, dari SDK Aistim).
   Data (data/tiles.json, data/sync.html) hanya dipakai bila ada berkas <nama>.sig yang cocok dengan public key admin di bawah.
   Ini hanya memeriksa data, tidak ada kode yang diunduh atau dijalankan. Tanda tangan dibuat offline oleh admin (tools/sign.mjs). */
(() => {
  const PUB = "0280a1985a488e55a30e2847661e48af258cb687b72eb697d8abe76598c22acdf5"; // public key admin (sama dengan akun.json di Auth)
  const S = globalThis.Secp256k1;
  const enc = new TextEncoder();
  const hex = (u) => Array.from(u, (b) => b.toString(16).padStart(2, "0")).join("");
  // pesan yang ditandatangani: sha256("aistim-data:" + nama + ":" + sha256hex(isi berkas))
  const pesan = (nama, bytes) => S.utils.sha256(enc.encode("aistim-data:" + nama + ":" + hex(S.utils.sha256(bytes))));
  function cek(nama, bytes, sig) {
    try {
      sig = String(sig || "").trim().toLowerCase();
      if (!S || !/^[0-9a-f]{128}$/.test(sig) || !(bytes instanceof Uint8Array)) return false;
      return S.verify(S.signatureFromCompact(sig), pesan(nama, bytes), PUB);
    } catch (e) { return false; }
  }
  function tanda(nama, bytes, privHex) {
    const s = S.sign(pesan(nama, bytes), privHex);
    return S.signatureToCompact(s);
  }
  globalThis.AistimVerify = { PUB, cek, tanda };
})();
