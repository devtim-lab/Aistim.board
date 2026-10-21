#!/usr/bin/env node
// Mengenkripsi token GitHub (AISTIM_HUB) dengan kunci turunan private key admin (AISTIM_PRIVATE) menjadi data/key.json.
// Berkas itu aman ditaruh di repo publik: hanya pemegang private key admin (key yang diturunkan dari password
// Aistim.sync) yang bisa membukanya. Nilai rahasia dibaca dari variabel lingkungan dan tidak pernah dicetak.
//
// Pemakaian:
//   AISTIM_PRIVATE=<64 hex> AISTIM_HUB=<token> node tools/key-json.mjs enkripsi [data/key.json]
//   AISTIM_PRIVATE=<64 hex> [AISTIM_HUB=<token>] node tools/key-json.mjs cek [data/key.json]
//       membuka lalu mencocokkan dengan AISTIM_HUB bila ada; tanpa mencetak token
//   AISTIM_PRIVATE=<64 hex> node tools/key-json.mjs tampil [data/key.json]
//       mencetak token; hanya untuk dipakai sendiri di komputer sendiri
//
// Format: { versi, algoritma, pub, salt, iv, ct }
//   kunci AES-256 = HKDF-SHA256(ikm = private key 32 byte, salt, info = "aistim-hub-token")
//   ct = hex(AES-256-GCM(token) lalu tag 16 byte), AAD = "aistim-key.json:v1:" + pub
// Board (versi lengkap) membukanya dengan private key yang diturunkan dari password saat tombol Terbitkan.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const S = require(path.join(root, "extension/sdk/secp256k1.js"));
const PUB = (fs.readFileSync(path.join(root, "extension/menu/verify.js"), "utf8").match(/const PUB = "([0-9a-f]{66})"/) || [])[1];
const INFO = "aistim-hub-token";
const aad = (pub) => Buffer.from("aistim-key.json:v1:" + pub);
// Di GitHub Actions, pesan galat ditampilkan sebagai anotasi (::error::) agar terlihat di ringkasan run.
const gagal = (m) => { console.error(process.env.GITHUB_ACTIONS ? "::error::" + m : m); process.exit(1); };
// Ciri nilai yang salah, tanpa membocorkan isinya: hanya panjang, jenis karakter, dan awalan token yang memang publik.
const ciri = (v, token) => {
  v = String(v || "");
  const c = ["panjang " + v.length];
  if (/-----BEGIN/.test(v)) c.push("berformat PEM");
  else if (/^\s*(0x)?[0-9a-fA-F]+\s*$/.test(v)) c.push("hanya karakter hex");
  else c.push("ada karakter bukan hex");
  if (/\S\s+\S/.test(v)) c.push("ada spasi/baris baru di tengah");
  if (token) c.push((v.trim().match(/^(github_pat_|ghp_|gho_|ghu_|ghs_|ghr_)/) || ["awalan tidak dikenal"])[0].replace(/^(?!awalan)/, "awalan "));
  return c.join(", ");
};

const [perintah, berkasArg] = process.argv.slice(2);
if (!["enkripsi", "cek", "tampil"].includes(perintah)) gagal("Pemakaian: node tools/key-json.mjs enkripsi|cek|tampil [data/key.json]");
const berkas = path.resolve(berkasArg || path.join(root, "data/key.json"));

const priv = (process.env.AISTIM_PRIVATE || "").trim().replace(/^0x/i, "").toLowerCase();
if (!/^[0-9a-f]{64}$/.test(priv)) gagal("AISTIM_PRIVATE harus private key 64 karakter hex (bukan PEM). Terbaca: " + ciri(process.env.AISTIM_PRIVATE) + ".");
if (S.getPublicKey(priv, true) !== PUB) gagal("AISTIM_PRIVATE berformat benar tetapi BUKAN key admin yang tertanam di verify.js (public key-nya tidak cocok). Pakai private key admin yang sama dengan public key di akun.json.");
const kunci = (saltHex) => Buffer.from(crypto.hkdfSync("sha256", Buffer.from(priv, "hex"), Buffer.from(saltHex, "hex"), Buffer.from(INFO), 32));
const tokenSah = (t) => /^[A-Za-z0-9_\-]{20,255}$/.test(t);

function buka() {
  let j;
  try { j = JSON.parse(fs.readFileSync(berkas, "utf8")); } catch (e) { gagal("key.json tidak ada atau bukan JSON yang sah."); }
  if (!j || j.versi !== 1 || j.pub !== PUB || !/^[0-9a-f]{32}$/.test(j.salt) || !/^[0-9a-f]{24}$/.test(j.iv) || !/^(?:[0-9a-f]{2}){17,1024}$/.test(j.ct)) gagal("Format key.json tidak dikenali.");
  const ct = Buffer.from(j.ct, "hex");
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", kunci(j.salt), Buffer.from(j.iv, "hex"));
    d.setAAD(aad(j.pub));
    d.setAuthTag(ct.subarray(ct.length - 16));
    return Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]).toString("utf8");
  } catch (e) {
    gagal("Gagal membuka key.json: key salah atau berkas rusak.");
  }
}

if (perintah === "enkripsi") {
  const token = (process.env.AISTIM_HUB || "").trim();
  if (!tokenSah(token)) gagal("AISTIM_HUB kosong atau bukan token GitHub yang terlihat benar (hanya huruf, angka, _ dan -; 20-255 karakter). Terbaca: " + ciri(process.env.AISTIM_HUB, true) + ".");
  const salt = crypto.randomBytes(16).toString("hex");
  const iv = crypto.randomBytes(12).toString("hex");
  const c = crypto.createCipheriv("aes-256-gcm", kunci(salt), Buffer.from(iv, "hex"));
  c.setAAD(aad(PUB));
  const ct = Buffer.concat([c.update(token, "utf8"), c.final(), c.getAuthTag()]).toString("hex");
  const obj = { versi: 1, algoritma: "AES-256-GCM; kunci = HKDF-SHA256(private key admin, salt, info aistim-hub-token)", pub: PUB, salt, iv, ct };
  fs.mkdirSync(path.dirname(berkas), { recursive: true });
  fs.writeFileSync(berkas, JSON.stringify(obj, null, 2) + "\n");
  // periksa balik: harus bisa dibuka lagi dan sama dengan aslinya
  if (buka() !== token) gagal("Pemeriksaan balik gagal; berkas tidak dipakai.");
  console.log("OK " + path.relative(process.cwd(), berkas));
} else if (perintah === "cek") {
  const t = buka();
  const ada = (process.env.AISTIM_HUB || "").trim();
  if (ada) {
    const a = Buffer.from(t), b = Buffer.from(ada);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) gagal("key.json bisa dibuka tetapi isinya BEDA dengan AISTIM_HUB.");
    console.log("OK key.json bisa dibuka dan sama dengan AISTIM_HUB");
  } else {
    console.log("OK key.json bisa dibuka");
  }
} else {
  process.stdout.write(buka() + "\n");
}
