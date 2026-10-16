#!/usr/bin/env node
// Tandatangani berkas data (data/tiles.json, data/sync.html) dengan key admin; hasilnya <berkas>.sig.
// Extension hanya memakai data dari GitHub bila tanda tangannya cocok dengan public key admin (extension/menu/verify.js).
//
// Pemakaian (di komputer sendiri; JANGAN taruh key di repo):
//   AISTIM_ADMIN_KEY=<64 hex> node tools/sign.mjs data/tiles.json data/sync.html
//   lalu commit dan push berkas *.sig bersama datanya.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const S = require(path.join(root, "extension/menu/lib/secp256k1.js"));
const src = fs.readFileSync(path.join(root, "extension/menu/verify.js"), "utf8");
const PUB = (src.match(/const PUB = "([0-9a-f]{66})"/) || [])[1];
const enc = new TextEncoder();
const hex = (u) => Array.from(u, (b) => b.toString(16).padStart(2, "0")).join("");

const key = (process.env.AISTIM_ADMIN_KEY || "").trim().replace(/^0x/i, "").toLowerCase();
if (!/^[0-9a-f]{64}$/.test(key)) { console.error("Set AISTIM_ADMIN_KEY (64 karakter hex)."); process.exit(1); }
if (S.getPublicKey(key, true) !== PUB) { console.error("Key ini bukan key admin yang tertanam di verify.js."); process.exit(1); }
const files = process.argv.slice(2);
if (!files.length) { console.error("Pemakaian: node tools/sign.mjs <berkas>..."); process.exit(1); }

for (const f of files) {
  const bytes = new Uint8Array(fs.readFileSync(f));
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) { console.error(f + ": hapus BOM dulu"); process.exit(1); }
  const nama = path.basename(f);
  const msg = S.utils.sha256(enc.encode("aistim-data:" + nama + ":" + hex(S.utils.sha256(bytes))));
  const sig = S.signatureToCompact(S.sign(msg, key));
  if (!S.verify(S.signatureFromCompact(sig), msg, PUB)) { console.error(f + ": verifikasi mandiri gagal"); process.exit(1); }
  fs.writeFileSync(f + ".sig", sig + "\n");
  console.log("OK " + f + ".sig");
}
