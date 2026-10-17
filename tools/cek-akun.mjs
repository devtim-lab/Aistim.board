#!/usr/bin/env node
// Periksa data/akun.json: struktur, role, dan addr cocok dengan pub (keccak256). Juga memastikan salinan bawaan
// extension/menu/akun.json sama persis. Pemakaian: node tools/cek-akun.mjs
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const S = require(path.join(root, "extension/sdk/secp256k1.js"));
const K = require(path.join(root, "extension/sdk/keccak.js"));
const gagal = (t) => { console.error("DITOLAK: " + t); process.exit(1); };
const a = fs.readFileSync(path.join(root, "data/akun.json"), "utf8");
const b = fs.readFileSync(path.join(root, "extension/menu/akun.json"), "utf8");
if (a !== b) gagal("extension/menu/akun.json harus sama dengan data/akun.json");
const j = JSON.parse(a);
if (j.version !== 1 || !Array.isArray(j.akun) || !j.akun.length || j.akun.length > 200) gagal("struktur tidak valid");
const nama = new Set(), pubs = new Set();
for (const x of j.akun) {
  const n = String(x.nama || "").trim();
  if (!n || n.length > 40 || nama.has(n.toLowerCase())) gagal("nama tidak valid atau ganda: " + n);
  nama.add(n.toLowerCase());
  if (!/^0[23][0-9a-f]{64}$/.test(x.pub || "") || pubs.has(x.pub)) gagal("pub tidak valid atau ganda untuk " + n);
  pubs.add(x.pub);
  if (x.role !== "admin" && x.role !== "user") gagal("role tidak valid untuk " + n);
  if (!Array.isArray(x.script)) gagal("script harus berupa daftar untuk " + n);
  const tak = S.Point.fromHex(x.pub).toHex(false);
  const addr = "0x" + Buffer.from(K.keccak256(S.utils.hexToBytes(tak.slice(2))).slice(-20)).toString("hex");
  if (String(x.addr).toLowerCase() !== addr) gagal("addr tidak cocok dengan pub untuk " + n + " (seharusnya " + addr + ")");
}
if (!j.akun.some((x) => x.role === "admin")) gagal("harus ada minimal satu admin");
console.log("OK " + j.akun.length + " akun");
