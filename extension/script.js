"use strict";
// Aistim Tab: halaman tab baru berisi menu pintasan (tambah, ubah, hapus). Tanpa akun, tanpa server:
// data tersimpan di browser ini; satu-satunya permintaan jaringan adalah ikon favicon (lihat PRIVACY.md).

const $ = (id) => document.getElementById(id);

// ---------- Penyimpanan (chrome.storage.local, cadangan localStorage saat dibuka sebagai file biasa) ----------
const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
const store = {
  async get(key, fallback) {
    if (hasChrome) {
      const r = await chrome.storage.local.get(key);
      return r[key] === undefined ? fallback : r[key];
    }
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  },
  async set(key, value) {
    if (hasChrome) await chrome.storage.local.set({ [key]: value });
    else localStorage.setItem(key, JSON.stringify(value));
  },
};

const MAX_PIN = 24;
let pins = []; // [{ id, nama, href, ikon }]
let pinTarget = null; // id yang sedang diubah di dialog; null = menu baru

function msg(text) {
  const el = $("msg");
  el.textContent = text;
  clearTimeout(msg.t);
  if (text) msg.t = setTimeout(() => (el.textContent = ""), 4000);
}

// ---------- Link, ID tetap, ikon ----------
// Hanya http/https yang diterima; "contoh.com" otomatis jadi https://contoh.com/
function normalUrl(v) {
  v = (v || "").trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) return null; // skema lain (ftp://, file://, ...)
    v = "https://" + v;
  }
  try {
    const u = new URL(v);
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname ? u.href : null;
  } catch (e) {
    return null;
  }
}
function hostOf(href) {
  try { return new URL(href).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
}
function grafem(s, n) {
  s = (s || "").trim();
  if (typeof Intl !== "undefined" && Intl.Segmenter) return Array.from(new Intl.Segmenter().segment(s), (x) => x.segment).slice(0, n).join("");
  return Array.from(s).slice(0, n).join("");
}
function pinLabel(p) { return p.nama || hostOf(p.href); }

// ID menu tetap: diturunkan dari link (tanpa skema, "www.", garis miring akhir, dan #bagian), jadi sama di semua
// perangkat dan link yang sama tidak mungkin tampil dobel. Hash 53-bit (cyrb53), bukan untuk keamanan.
function kunciLink(href) {
  try {
    const u = new URL(href);
    return u.hostname.replace(/^www\./, "").toLowerCase() + (u.port ? ":" + u.port : "") + u.pathname.replace(/\/+$/, "") + u.search;
  } catch (e) {
    return String(href || "");
  }
}
function idLink(href) {
  const s = kunciLink(href);
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return "m" + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
// Data tersimpan dirapikan: id dari link, link sama digabung, data yang kosong dilengkapi dari duplikatnya.
function rapikanPins(daftar) {
  const hasil = [];
  const ada = new Map();
  for (const x of Array.isArray(daftar) ? daftar : []) {
    const href = x && typeof x.href === "string" ? normalUrl(x.href) : null;
    if (!href) continue;
    const id = idLink(href);
    const p = { id, nama: typeof x.nama === "string" ? x.nama : "", href, ikon: typeof x.ikon === "string" ? x.ikon : "" };
    const d = ada.get(id);
    if (!d) {
      ada.set(id, p);
      hasil.push(p);
    } else {
      d.nama = d.nama || p.nama;
      d.ikon = d.ikon || p.ikon;
    }
  }
  return hasil;
}

// Ikon otomatis: favicon dari Google (hanya nama domain induk yang dikirim, tanpa subdomain). Nama tanpa titik,
// alamat IP, dan domain lokal tidak pernah dikirim.
const FAVICON = "https://www.google.com/s2/favicons?sz=64&domain=";
const favOk = new Set(); // alamat favicon yang sudah berhasil dimuat di halaman ini
function faviconUrl(href) {
  let h = "";
  try { h = new URL(href).hostname.toLowerCase(); } catch (e) { return ""; }
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z][a-z0-9-]+$/.test(h)) return "";
  if (/\.(local|localhost|internal|lan|home|corp|intranet|test|invalid|example)$/.test(h)) return "";
  return FAVICON + encodeURIComponent(indukDomain(h));
}
// Domain induk: trial.erzap.com -> erzap.com, shop.example.co.id -> example.co.id. Tanpa daftar sufiks publik lengkap:
// akhiran negara 2 huruf yang didahului kata umum (co, com, net, org, ac, go, ...) dihitung satu akhiran.
const SLD_UMUM = new Set(["co", "com", "net", "org", "gov", "edu", "ac", "or", "go", "sch", "web", "my", "biz", "mil", "ne", "ltd", "plc", "nom", "desa", "ponpes"]);
function indukDomain(h) {
  const p = h.split(".");
  if (p.length <= 2) return h;
  const n = p[p.length - 1].length === 2 && SLD_UMUM.has(p[p.length - 2]) ? 3 : 2;
  return p.slice(-n).join(".");
}
function pinWarna(s) {
  let h = 0;
  for (const c of s || "") h = (h * 31 + c.codePointAt(0)) >>> 0;
  return "hsl(" + (h % 360) + " 55% 40%)";
}
// Urutan ikon: emoji/huruf sendiri, favicon situs, huruf pertama nama. Favicon baru dipasang setelah berhasil
// dimuat, jadi saat offline atau gagal tetap tampil huruf berwarna.
function pinIkon(p, favicon = true) {
  const s = document.createElement("span");
  s.className = "pin-ic";
  s.textContent = p.ikon || grafem(pinLabel(p), 1).toUpperCase() || "•";
  if (p.ikon) return s;
  s.style.background = pinWarna(hostOf(p.href) || p.nama);
  const fu = favicon ? faviconUrl(p.href) : "";
  if (fu) {
    const im = new Image();
    im.alt = "";
    im.decoding = "async";
    im.referrerPolicy = "no-referrer";
    const pasang = () => {
      s.textContent = "";
      s.style.background = "";
      s.classList.add("fav");
      s.append(im);
    };
    im.onload = () => {
      favOk.add(fu);
      pasang();
    };
    im.src = fu;
    if (favOk.has(fu)) pasang(); // sudah pernah berhasil di halaman ini: langsung tampil, tanpa berkedip jadi huruf
  }
  return s;
}

// ---------- Tampilan ----------
const PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const IKON_UBAH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>';
const IKON_HAPUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg>';

function pinTile(p) {
  const a = document.createElement("a");
  a.className = "pin";
  a.href = p.href;
  a.target = "_blank"; // dibuka di tab baru; halaman ini tetap terbuka
  a.rel = "noopener noreferrer";
  a.title = p.href;
  const nm = document.createElement("span");
  nm.className = "pin-nm";
  nm.textContent = pinLabel(p);
  a.append(pinIkon(p), nm);
  return a;
}
function tambahTile() {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "pin tambah";
  b.id = "pin-tile-tambah";
  const ic = document.createElement("span");
  ic.className = "pin-ic plus";
  ic.innerHTML = PLUS;
  const nm = document.createElement("span");
  nm.className = "pin-nm";
  nm.textContent = "Tambahkan baru";
  b.append(ic, nm);
  b.addEventListener("click", () => openPin(null));
  return b;
}
function pinBaris(p) {
  const li = document.createElement("li");
  li.className = "baris";
  const t = document.createElement("span");
  t.className = "baris-t";
  const b = document.createElement("b");
  b.textContent = pinLabel(p);
  const sm = document.createElement("small");
  sm.textContent = hostOf(p.href) || p.href;
  t.append(b, sm);
  li.append(pinIkon(p), t);
  const mk = (cls, judul, svg, fn) => {
    const x = document.createElement("button");
    x.type = "button";
    x.className = "ico2 " + cls;
    x.title = judul + " " + pinLabel(p);
    x.setAttribute("aria-label", x.title);
    x.innerHTML = svg;
    x.addEventListener("click", fn);
    return x;
  };
  li.append(
    mk("ubah", "Ubah", IKON_UBAH, () => openPin(p.id)),
    mk("hapus", "Hapus", IKON_HAPUS, async () => {
      const r = await hapusPin(p);
      if (typeof r === "string") msg(r);
    })
  );
  return li;
}
function renderPins() {
  const g = $("pin-grid");
  g.textContent = "";
  pins.forEach((p) => g.append(pinTile(p)));
  if (pins.length < MAX_PIN) g.append(tambahTile());
  const l = $("pin-list");
  l.textContent = "";
  pins.forEach((p) => l.append(pinBaris(p)));
  l.hidden = !pins.length;
  $("pin-kosong").hidden = pins.length > 0;
  const penuh = pins.length >= MAX_PIN;
  $("pin-tambah").disabled = penuh;
  $("pin-tambah").textContent = penuh ? "Maksimal " + MAX_PIN + " menu" : "+ Tambah menu";
}

// Kartu berbalik: depan = menu untuk dibuka, belakang = atur (tambah, ubah, hapus)
const flipKartu = $("flip");
function putar(belakang) {
  flipKartu.classList.toggle("balik", belakang);
  $("btn-flip").setAttribute("aria-expanded", String(belakang));
  if (belakang) $("pin-tambah").focus({ preventScroll: true });
  else setTimeout(() => $("btn-flip").focus({ preventScroll: true }), 320); // sisi depan baru terlihat setelah setengah putaran
}
$("btn-flip").addEventListener("click", () => putar(true));
$("btn-flip-balik").addEventListener("click", () => putar(false));
$("pin-tambah").addEventListener("click", () => openPin(null));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && flipKartu.classList.contains("balik") && !document.querySelector("dialog[open]")) putar(false);
});

// ---------- Tambah / ubah / hapus ----------
const dlgPin = $("dlg-pin");
const dlgHapus = $("dlg-hapus");

function formPin() {
  const href = normalUrl($("pin-url").value);
  return { href: href || "", nama: $("pin-nama").value.trim().slice(0, 30), ikon: grafem($("pin-ikon").value, 2) };
}
// Favicon di pratinjau baru diminta setelah kolom link selesai diisi (event "change"), bukan tiap ketikan,
// supaya potongan nama domain yang masih diketik tidak ikut dikirim ke Google.
let pinFav = false;
function previewPin() {
  const p = formPin();
  $("pin-preview").replaceWith(Object.assign(pinIkon(p, pinFav), { id: "pin-preview" }));
  $("pin-nama").placeholder = p.href ? "Kosong: " + hostOf(p.href) : "Kosong: pakai nama situs";
}
function openPin(id) {
  const p = id ? pins.find((x) => x.id === id) : null;
  pinTarget = p ? p.id : null;
  $("pin-title").textContent = p ? "Ubah menu" : "Tambah menu";
  $("pin-url").value = p ? p.href : "";
  $("pin-nama").value = p ? p.nama : "";
  $("pin-ikon").value = p ? p.ikon : "";
  pinFav = !!p; // menu yang sudah ada punya link lengkap; menu baru menunggu link selesai diisi
  $("pin-lain").open = !!(p && p.ikon);
  $("pin-del").hidden = !p;
  $("pin-err").textContent = "";
  previewPin();
  dlgPin.showModal();
  $("pin-url").focus();
}
$("pin-url").addEventListener("input", () => {
  pinFav = false;
  previewPin();
});
$("pin-url").addEventListener("change", () => {
  pinFav = true;
  previewPin();
});
["pin-nama", "pin-ikon"].forEach((id) => $(id).addEventListener("input", previewPin));
$("pin-cancel").addEventListener("click", () => dlgPin.close());

let pinSimpan = false; // ketukan ganda pada Simpan tidak menyimpan dua kali
$("form-pin").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (pinSimpan) return;
  const data = formPin();
  if (!data.href) return ($("pin-err").textContent = "Link tidak valid (harus http:// atau https://).");
  const id = idLink(data.href);
  const kembar = pins.find((x) => x.id === id && x.id !== pinTarget);
  if (kembar) return ($("pin-err").textContent = 'Link ini sudah ada di menu: "' + pinLabel(kembar) + '".');
  if (!pinTarget && pins.length >= MAX_PIN) return ($("pin-err").textContent = "Maksimal " + MAX_PIN + " menu.");
  const next = pinTarget ? pins.map((x) => (x.id === pinTarget ? { ...x, ...data, id } : x)) : [...pins, { id, ...data }];
  pinSimpan = true;
  try {
    await store.set("pins", next);
  } catch (err) {
    return ($("pin-err").textContent = "Gagal menyimpan: " + (err && err.message ? err.message : err));
  } finally {
    pinSimpan = false;
  }
  pins = next;
  dlgPin.close();
  renderPins();
});

function konfirmasi(teks) {
  return new Promise((selesai) => {
    $("hapus-teks").textContent = teks;
    dlgHapus.returnValue = "";
    dlgHapus.addEventListener("close", () => selesai(dlgHapus.returnValue === "ya"), { once: true });
    dlgHapus.showModal();
    $("hapus-batal").focus();
  });
}
$("hapus-batal").addEventListener("click", () => dlgHapus.close("batal"));
// Hasil: true = terhapus, false = dibatalkan, teks = alasan gagal
async function hapusPin(p) {
  if (!(await konfirmasi('Hapus menu "' + pinLabel(p) + '"?'))) return false;
  const next = pins.filter((x) => x.id !== p.id);
  try {
    await store.set("pins", next);
  } catch (err) {
    return "Gagal menghapus: " + (err && err.message ? err.message : err);
  }
  pins = next;
  renderPins();
  return true;
}
$("pin-del").addEventListener("click", async () => {
  const p = pins.find((x) => x.id === pinTarget);
  if (!p) return;
  const r = await hapusPin(p);
  if (r === true) dlgPin.close();
  else if (typeof r === "string") $("pin-err").textContent = r;
});

// ---------- Mulai ----------
// Perubahan dari tab lain (tab baru kedua yang terbuka) ikut tampil, supaya simpan dari tab lama tidak menimpa data baru.
function dariLuar(nilai) {
  const baru = rapikanPins(nilai);
  if (JSON.stringify(baru) === JSON.stringify(pins)) return;
  pins = baru;
  renderPins();
}
function pantau() {
  if (hasChrome) {
    if (chrome.storage.onChanged) chrome.storage.onChanged.addListener((c, area) => { if (area === "local" && c.pins) dariLuar(c.pins.newValue); });
  } else {
    window.addEventListener("storage", (e) => {
      if (e.key !== "pins") return;
      try { dariLuar(JSON.parse(e.newValue)); } catch (err) {}
    });
  }
}
function labelVersi() {
  try {
    const v = chrome.runtime.getManifest().version;
    $("ver").textContent = "Aistim Tab v" + v + " · ID extension: " + chrome.runtime.id;
  } catch (e) {
    $("ver").textContent = "Aistim Tab";
  }
}
async function mulai() {
  const tersimpan = await store.get("pins", []);
  pins = rapikanPins(tersimpan);
  if (JSON.stringify(pins) !== JSON.stringify(tersimpan)) {
    try { await store.set("pins", pins); } catch (e) {}
  }
  renderPins();
  labelVersi();
  pantau();
}
mulai().catch((e) => msg("Gagal memuat menu: " + (e && e.message ? e.message : e)));
