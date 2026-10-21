// Jika ada kesalahan tak terduga, tampilkan di layar supaya kelihatan penyebabnya (terutama di HP).
window.addEventListener("error", (e) => showError(e.message + (e.lineno ? " (baris " + e.lineno + ")" : "")));
window.addEventListener("unhandledrejection", (e) => showError(e.reason));

const QUOTES = [
  { text: "Mulailah dari mana kamu berada, gunakan apa yang kamu punya.", author: "Arthur Ashe" },
  { text: "Langkah kecil setiap hari lebih baik daripada lompatan besar sesekali.", author: "Anonim" },
  { text: "Fokus pada kemajuan, bukan kesempurnaan.", author: "Anonim" },
  { text: "Kerjakan yang penting dulu, sisanya menyusul.", author: "Anonim" },
  { text: "Konsistensi mengalahkan intensitas.", author: "Anonim" },
];

const GRADIENTS = [
  { nama: "Biru laut", warna: ["#1e3c72", "#2a5298"] },
  { nama: "Hijau teduh", warna: ["#134e5e", "#71b280"] },
  { nama: "Ungu senja", warna: ["#42275a", "#734b6d"] },
  { nama: "Abu arang", warna: ["#232526", "#414345"] },
  { nama: "Biru malam", warna: ["#0f2027", "#2c5364"] },
];

const DEFAULT_VIEW_HTML = '<!doctype html><meta charset="utf-8"><body style="margin:0;height:100vh;display:grid;place-items:center;background:#0f172a;color:#fff;font-family:system-ui"><h1 style="font-weight:300;font-size:64px">Hallo</h1>';
let views = []; // tampilan buatan sendiri: [{ id, nama, html }]

// Simpan daftar menu, lalu baca ulang untuk memastikan benar-benar tersimpan; salinan cadangan di localStorage.
async function saveViews() {
  try { localStorage.setItem("views-backup", JSON.stringify(views)); } catch (e) {}
  try {
    await store.set("views", views);
    const cek = await store.get("views", null);
    if (!Array.isArray(cek) || cek.length !== views.length) throw new Error("data tidak terbaca ulang");
    status("Tersimpan (" + views.length + " menu buatan).");
    return true;
  } catch (e) {
    status("Gagal menyimpan: " + (e && e.message ? e.message : e), true);
    return false;
  }
}
function status(t, err) {
  const el = $("menu-status");
  if (!el) return;
  el.textContent = t;
  el.style.color = err ? "#fca5a5" : "";
}

const DEFAULT_SETTINGS = { nama: "", jam24: true, latar: "harian", warna: 0, gambar: "", foto: "hari", tampilan: "board" };

// Tampilan Start dimuat di iframe agar alamat tab tetap newtab.html (kolom alamat Chrome tetap kosong)
window.addEventListener("message", (e) => {
  if (e.origin === location.origin && e.data && e.data.aistim === "board") location.reload();
});

function showStart(page = "menu/icu.html") {
  const f = document.createElement("iframe");
  f.src = page;
  f.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0";
  document.body.replaceChildren(f);
}

function openCustom() {
  const id = String(settings.tampilan).slice(2);
  if (views.some((v) => v.id === id)) return showStart("menu/sync.html?id=" + encodeURIComponent(id));
  settings.tampilan = "board"; // tampilan sudah dihapus: kembali ke Board
  store.set("settings", settings);
  applyBackground();
  tick();
}

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

let settings = { ...DEFAULT_SETTINGS };

// ---------- Jam, tanggal, sapaan ----------
function greetingFor(hour) {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function tick() {
  if (!$("clock")) return;
  const now = new Date();
  $("clock").textContent = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !settings.jam24,
  });
  $("date").textContent = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const nama = (settings.nama || "").trim();
  $("greeting").textContent = greetingFor(now.getHours()) + (nama ? ", " + nama : "");
}

// ---------- Kutipan & latar ----------
function dayIndex() {
  return Math.floor(Date.now() / 86400000);
}

function initQuote() {
  const q = QUOTES[dayIndex() % QUOTES.length];
  $("quote-text").textContent = `“${q.text}”`;
  $("quote-author").textContent = q.author;
}

const SEED_TAB = Math.random().toString(36).slice(2, 10); // tetap selama satu kali buka tab
function fotoUrl() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const hari = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
  const seed = settings.foto === "tab" ? SEED_TAB : settings.foto === "jam" ? hari + "h" + p(d.getHours()) : hari;
  const r = window.devicePixelRatio || 1;
  const w = Math.min(2560, Math.max(640, Math.round((screen.width * r) / 160) * 160));
  const h = Math.min(1600, Math.max(480, Math.round((screen.height * r) / 160) * 160));
  return "https://picsum.photos/seed/" + seed + "/" + w + "/" + h;
}
function applyGradient() {
  const b = document.body.style;
  const idx = settings.latar === "warna" ? settings.warna : dayIndex();
  const [a, c] = GRADIENTS[((idx % GRADIENTS.length) + GRADIENTS.length) % GRADIENTS.length].warna;
  b.background = `linear-gradient(135deg, ${a}, ${c})`;
  b.backgroundAttachment = "fixed";
}
function fotoStatus(teks, ms) {
  let el = document.getElementById("foto-status");
  if (!teks) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement("div");
    el.id = "foto-status";
    el.style.cssText = "position:fixed;left:12px;bottom:12px;padding:6px 10px;border-radius:999px;background:#000a;color:#fff;font:12px system-ui;z-index:50;max-width:calc(100% - 24px)";
    document.body.append(el);
  }
  el.textContent = teks;
  clearTimeout(fotoStatus.t);
  if (ms) fotoStatus.t = setTimeout(() => el.remove(), ms);
}
function applyBackground() {
  const b = document.body.style;
  fotoStatus("");
  if (settings.latar === "online") {
    applyGradient(); // sementara dan cadangan bila offline
    const url = fotoUrl();
    const img = new Image();
    let selesai = false;
    const lambat = setTimeout(() => { if (!selesai) fotoStatus("Foto online lambat dimuat, masih menunggu…"); }, 4000);
    img.onload = () => {
      selesai = true;
      clearTimeout(lambat);
      fotoStatus("");
      if (settings.latar !== "online") return;
      b.background = `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.35)), center / cover no-repeat url("${url}")`;
      b.backgroundAttachment = "fixed";
    };
    img.onerror = () => {
      selesai = true;
      clearTimeout(lambat);
      fotoStatus("Foto online gagal dimuat (offline atau diblokir). Memakai gradien.", 8000);
    };
    img.src = url;
    return;
  }
  if (settings.latar === "gambar" && settings.gambar) {
    b.background = `center / cover no-repeat url("${settings.gambar}")`;
    b.backgroundAttachment = "fixed";
    return;
  }
  const idx = settings.latar === "warna" ? settings.warna : dayIndex();
  const [a, c] = GRADIENTS[((idx % GRADIENTS.length) + GRADIENTS.length) % GRADIENTS.length].warna;
  b.background = `linear-gradient(135deg, ${a}, ${c})`;
  b.backgroundAttachment = "fixed";
}

// ---------- Menu (pintasan di Board) ----------
const MAX_PIN = 24;
let pins = []; // menu pribadi: [{ id, nama, href, ikon, gambar }]
let pinsV = []; // menu bersama dari admin (data/menu.json, sudah diverifikasi tanda tangannya); hanya baca
let pinAdmin = false; // true bila profil Aistim.sync di browser ini adalah admin yang public key-nya tertanam (verify.js)
let pinAtur = false; // mode atur: ketuk menu untuk mengubah atau menghapus
let pinTarget = null; // id yang sedang diubah di dialog; null = menu baru
let pinGambar = ""; // data URL gambar ikon yang dipilih di dialog

function msg(text) {
  const el = $("board-msg");
  el.textContent = text;
  clearTimeout(msg.t);
  if (text) msg.t = setTimeout(() => (el.textContent = ""), 4000);
}

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
function pinWarna(s) {
  let h = 0;
  for (const c of s || "") h = (h * 31 + c.codePointAt(0)) >>> 0;
  return "hsl(" + (h % 360) + " 55% 40%)";
}
function pinIkon(p) {
  const s = document.createElement("span");
  s.className = "pin-ic";
  if (p.gambar) {
    const im = document.createElement("img");
    im.src = p.gambar;
    im.alt = "";
    s.append(im);
  } else {
    s.textContent = p.ikon || grafem(pinLabel(p), 1).toUpperCase() || "•";
    s.style.background = pinWarna(hostOf(p.href) || p.nama);
  }
  return s;
}

function pinTile(p, bersama) {
  const a = document.createElement("a");
  a.className = "pin" + (bersama ? " bersama" : "") + (!bersama && p.bagi ? " dibagi" : "");
  if (!bersama && p.bagi) a.title = p.href + " (dibagikan ke semua pengguna saat diterbitkan)";
  a.href = p.href;
  if (!a.title) a.title = p.href;
  const nm = document.createElement("span");
  nm.className = "pin-nm";
  nm.textContent = pinLabel(p);
  a.append(pinIkon(p), nm);
  a.addEventListener("click", (e) => {
    if (!pinAtur) return;
    e.preventDefault();
    if (bersama) msg("Menu bersama dari admin, tidak bisa diubah di sini.");
    else openPin(p.id);
  });
  return a;
}

// ---- Menu bersama: data/menu.json di GitHub, dipakai hanya bila tanda tangan admin cocok (menu/verify.js) ----
const MENU_URL = "https://raw.githubusercontent.com/devtim-lab/Aistim.board/main/data/menu.json";
function validMenu(m) {
  return (
    Array.isArray(m) &&
    m.length <= MAX_PIN &&
    m.every(
      (x) =>
        x &&
        typeof x.nama === "string" && x.nama.length <= 30 &&
        typeof x.href === "string" && x.href.length <= 500 && !!normalUrl(x.href) &&
        (x.ikon === undefined || (typeof x.ikon === "string" && x.ikon.length <= 16)) &&
        (x.gambar === undefined || x.gambar === "" || (typeof x.gambar === "string" && x.gambar.length <= 60000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(x.gambar)))
    )
  );
}
function bersihMenu(m) {
  return m.map((x, i) => ({ id: "b" + i, nama: x.nama.trim(), href: normalUrl(x.href), ikon: x.ikon || "", gambar: x.gambar || "" }));
}
async function refreshMenuBersama() {
  try {
    if (typeof AistimVerify === "undefined") return;
    const [res, sg] = await Promise.all([fetch(MENU_URL, { cache: "no-cache" }), fetch(MENU_URL + ".sig", { cache: "no-cache" })]);
    if (!res.ok || !sg.ok) return;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (!AistimVerify.cek("menu.json", buf, await sg.text())) return; // tanda tangan admin tidak cocok: abaikan
    const d = JSON.parse(new TextDecoder().decode(buf));
    if (!d || !validMenu(d.menu)) return;
    const baru = bersihMenu(d.menu);
    if (JSON.stringify(baru) === JSON.stringify(pinsV)) return;
    await store.set("pinsV", baru);
    pinsV = baru;
    renderPins();
  } catch (e) {}
}

function renderPins() {
  if (!pins.length) pinAtur = false;
  $("btn-pin-edit").hidden = !pins.length;
  $("btn-pin-edit").setAttribute("aria-pressed", String(pinAtur));
  $("btn-pin-bagi").hidden = !pinAdmin;
  const g = $("pin-grid");
  g.textContent = "";
  g.classList.toggle("atur", pinAtur);
  const sendiri = new Set(pins.map((p) => p.href)); // link yang sama dengan menu pribadi hanya ditampilkan sekali
  pinsV.filter((p) => !sendiri.has(p.href)).forEach((p) => g.append(pinTile(p, true)));
  pins.forEach((p) => g.append(pinTile(p, false)));
  if (pins.length < MAX_PIN) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pin pin-add";
    b.title = "Tambah menu";
    b.setAttribute("aria-label", "Tambah menu");
    const ic = document.createElement("span");
    ic.className = "pin-ic";
    ic.textContent = "+";
    const nm = document.createElement("span");
    nm.className = "pin-nm";
    nm.textContent = "Tambah";
    b.append(ic, nm);
    b.addEventListener("click", () => openPin(null));
    g.append(b);
  }
}

const dlgPin = $("dlg-pin");

function formPin() {
  const href = normalUrl($("pin-url").value);
  return { href: href || "", nama: $("pin-nama").value.trim().slice(0, 30), ikon: grafem($("pin-ikon").value, 2), gambar: pinGambar, bagi: pinAdmin && $("pin-bagi").checked };
}
function previewPin() {
  const p = formPin();
  $("pin-preview").replaceWith(Object.assign(pinIkon(p), { id: "pin-preview" }));
  $("pin-img-clear").hidden = !pinGambar;
}

function openPin(id) {
  const p = id ? pins.find((x) => x.id === id) : null;
  pinTarget = p ? p.id : null;
  $("pin-title").textContent = p ? "Ubah menu" : "Tambah menu";
  $("pin-url").value = p ? p.href : "";
  $("pin-nama").value = p ? p.nama : "";
  $("pin-ikon").value = p ? p.ikon : "";
  pinGambar = p ? p.gambar : "";
  $("pin-bagi-row").hidden = !pinAdmin;
  $("pin-bagi").checked = !!(p && p.bagi);
  $("pin-del").hidden = !p;
  $("pin-err").textContent = "";
  previewPin();
  dlgPin.showModal();
  $("pin-url").focus();
}

["pin-url", "pin-nama", "pin-ikon"].forEach((id) => $(id).addEventListener("input", previewPin));
$("btn-pin-edit").addEventListener("click", () => {
  pinAtur = !pinAtur;
  renderPins();
});
$("pin-cancel").addEventListener("click", () => dlgPin.close());
$("pin-img-btn").addEventListener("click", () => $("pin-img").click());
$("pin-img-clear").addEventListener("click", () => {
  pinGambar = "";
  previewPin();
});

// Gambar ikon: dipotong persegi dari tengah, jadi PNG 96x96
function ikonDariFile(file, sisi = 96) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      if (!s) return reject(new Error("Gambar tidak bisa dibaca."));
      const c = document.createElement("canvas");
      c.width = c.height = sisi;
      c.getContext("2d").drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, sisi, sisi);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gambar tidak bisa dibaca."));
    };
    img.src = url;
  });
}
$("pin-img").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f) return;
  try {
    pinGambar = await ikonDariFile(f);
    $("pin-err").textContent = "";
    previewPin();
  } catch (err) {
    $("pin-err").textContent = err.message;
  }
});

$("form-pin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = formPin();
  if (!data.href) return ($("pin-err").textContent = "Link tidak valid (harus http:// atau https://).");
  if (!pinTarget && pins.length >= MAX_PIN) return ($("pin-err").textContent = "Maksimal " + MAX_PIN + " menu.");
  const next = pinTarget ? pins.map((x) => (x.id === pinTarget ? { ...x, ...data } : x)) : [...pins, { id: Date.now().toString(36), ...data }];
  try {
    await store.set("pins", next);
  } catch (err) {
    return ($("pin-err").textContent = "Gagal menyimpan: " + (err && err.message ? err.message : err));
  }
  pins = next;
  dlgPin.close();
  renderPins();
});

$("pin-del").addEventListener("click", async () => {
  const p = pins.find((x) => x.id === pinTarget);
  if (!p) return;
  if (!(await popup({ judul: "Hapus menu", teks: 'Hapus menu "' + pinLabel(p) + '"?', ok: "Hapus", bahaya: true }))) return;
  const next = pins.filter((x) => x.id !== p.id);
  try {
    await store.set("pins", next);
  } catch (err) {
    return ($("pin-err").textContent = "Gagal menghapus: " + (err && err.message ? err.message : err));
  }
  pins = next;
  dlgPin.close();
  renderPins();
});

// ---------- Terbitkan menu bersama (admin) ----------
// Private key diturunkan dari password Aistim.sync: HKDF(PBKDF2(password, salt, iter)), rumus yang sama dengan menu/sync.js.
// Salt dan iter tersimpan di profil browser ini (syncPass), jadi hanya browser tempat password admin dibuat yang menghasilkan key admin.
const hx = (u) => Array.from(new Uint8Array(u), (b) => b.toString(16).padStart(2, "0")).join("");
const hexBytes = (h) => Uint8Array.from(h.match(/../g).map((x) => parseInt(x, 16)));
async function privDari(pw, saltHex, iter) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: hexBytes(saltHex), iterations: iter }, k, 256));
  return hx(Secp256k1.utils.hkdf(bits, hexBytes(saltHex), new TextEncoder().encode("aistim-sync-key"), 32));
}

const dlgBagi = $("dlg-bagi");
let bagiTeks = "";
let bagiSig = "";
let bagiGagal = 0;

function daftarBagi() {
  return pins
    .filter((p) => p.bagi)
    .map((p) => {
      const o = { nama: (p.nama || hostOf(p.href)).slice(0, 30), href: p.href };
      if (p.ikon) o.ikon = p.ikon;
      if (p.gambar) o.gambar = p.gambar;
      return o;
    });
}
function bagiMsg(t, err) {
  const el = $("bagi-msg");
  el.textContent = t;
  el.style.color = err ? "#fca5a5" : "";
}
async function salin(t) {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch (e) {}
  const ta = document.createElement("textarea"); // cadangan bila clipboard API ditolak
  ta.value = t;
  dlgBagi.append(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) {}
  ta.remove();
  return ok;
}

$("btn-pin-bagi").addEventListener("click", () => {
  const list = daftarBagi();
  const href = new Set(list.map((x) => x.href));
  const hapus = pinsV.filter((p) => !href.has(p.href)).map((p) => p.nama);
  let info = list.length
    ? list.length + " menu akan dibagikan ke semua pengguna: " + list.map((x) => x.nama).join(", ") + "."
    : "Belum ada menu bertanda Bagikan; menerbitkan akan mengosongkan menu bersama.";
  if (hapus.length) info += " Akan dihapus dari semua pengguna: " + hapus.join(", ") + ".";
  $("bagi-info").textContent = info;
  $("bagi-pw").value = "";
  bagiMsg("");
  $("bagi-hasil").hidden = true;
  $("bagi-ok").hidden = false;
  bagiTeks = bagiSig = "";
  dlgBagi.showModal();
  $("bagi-pw").focus();
});
$("bagi-tutup").addEventListener("click", () => dlgBagi.close());
$("bagi-copy-json").addEventListener("click", async () => bagiMsg((await salin(bagiTeks)) ? "menu.json tersalin." : "Gagal menyalin."));
$("bagi-copy-sig").addEventListener("click", async () => bagiMsg((await salin(bagiSig + "\n")) ? "Tanda tangan tersalin." : "Gagal menyalin."));

$("form-bagi").addEventListener("submit", async (e) => {
  e.preventDefault();
  const pw = $("bagi-pw").value;
  if (!pw) return;
  $("bagi-ok").disabled = true;
  try {
    if (bagiGagal) await new Promise((r) => setTimeout(r, Math.min(bagiGagal, 5) * 1000)); // jeda makin lama bila salah
    bagiMsg("Memeriksa password…");
    const sp = await store.get("syncPass", null);
    if (!sp || typeof sp.salt !== "string" || !Number.isInteger(sp.iter)) return bagiMsg("Belum ada password Aistim.sync di browser ini.", true);
    const priv = await privDari(pw, sp.salt, sp.iter);
    if (Secp256k1.getPublicKey(priv, true) !== AistimVerify.PUB) {
      bagiGagal++;
      return bagiMsg("Password salah, atau bukan password admin di browser ini.", true);
    }
    const list = daftarBagi();
    if (!validMenu(list)) return bagiMsg("Daftar tidak lolos pemeriksaan (mis. gambar ikon terlalu besar; pakai emoji atau gambar lain).", true);
    const teks = JSON.stringify({ versi: 1, menu: list }, null, 2) + "\n";
    const bytes = new TextEncoder().encode(teks);
    const sig = AistimVerify.tanda("menu.json", bytes, priv);
    if (!AistimVerify.cek("menu.json", bytes, sig)) return bagiMsg("Pemeriksaan mandiri tanda tangan gagal.", true);
    bagiGagal = 0;
    bagiTeks = teks;
    bagiSig = sig;
    let hasil = null; // null = tidak ada fitur unggah; "" = terunggah; lainnya = alasan gagal
    if (typeof unggahBagi === "function") hasil = await unggahBagi(teks, sig, priv);
    if (hasil === "") {
      pinsV = bersihMenu(list);
      try { await store.set("pinsV", pinsV); } catch (x) {}
      renderPins();
      $("bagi-ok").hidden = true;
      bagiMsg("Terbit. Pengguna menerimanya saat membuka tab baru (cache GitHub bisa beberapa menit).");
    } else {
      $("bagi-hasil").hidden = false;
      bagiMsg((hasil ? "Ditandatangani, belum terunggah: " + hasil + ". " : "Ditandatangani. ") + "Salin kedua isi ke data/menu.json dan data/menu.json.sig di repo, lalu commit.");
    }
  } finally {
    $("bagi-ok").disabled = false;
    $("bagi-pw").value = "";
  }
});

/*PRO*/
// Unggah menu.json dan menu.json.sig ke GitHub memakai token yang sudah disimpan lewat Aistim.sync (ikon kunci di bar bawah).
const GH = { owner: "devtim-lab", repo: "Aistim.board", branch: "main" };
const b64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
async function ghKirim(path, isi, token, pesan) {
  const base = "https://api.github.com/repos/" + GH.owner + "/" + GH.repo + "/contents/" + path;
  const head = { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  for (let coba = 0; coba < 2; coba++) {
    const cur = await fetch(base + "?ref=" + GH.branch, { headers: head, cache: "no-store" });
    let sha;
    if (cur.status === 200) {
      const j = await cur.json();
      if ((j.content || "").replace(/\s/g, "") === b64(isi)) return "";
      sha = j.sha;
    } else if (cur.status === 401) return "token ditolak atau kedaluwarsa";
    else if (cur.status !== 404) return "GitHub membalas " + cur.status;
    const res = await fetch(base, { method: "PUT", headers: head, cache: "no-store", body: JSON.stringify({ message: pesan, content: b64(isi), branch: GH.branch, ...(sha ? { sha } : {}) }) });
    if (res.ok) return "";
    if (res.status === 401) return "token ditolak atau kedaluwarsa";
    if (res.status === 403) return "token tidak punya izin (perlu Contents: Read and write)";
    if (res.status !== 409 && res.status !== 422) return "GitHub membalas " + res.status; // 409/422 = sha basi, coba sekali lagi
  }
  return "berkas berubah di GitHub, coba lagi";
}
// Token GitHub terenkripsi di data/key.json (dibuat workflow "Encrypt hub token"): AES-256-GCM, kunci = HKDF-SHA256 dari
// private key admin. Hanya bisa dibuka dengan private key yang diturunkan dari password admin, yang baru ada saat Terbitkan.
const KEY_URL = "https://raw.githubusercontent.com/devtim-lab/Aistim.board/main/data/key.json";
async function tokenDariKey(priv) {
  try {
    const r = await fetch(KEY_URL, { cache: "no-store" });
    if (!r.ok) return "";
    const j = await r.json();
    if (!j || j.versi !== 1 || j.pub !== AistimVerify.PUB || !/^[0-9a-f]{32}$/.test(j.salt) || !/^[0-9a-f]{24}$/.test(j.iv) || !/^(?:[0-9a-f]{2}){17,1024}$/.test(j.ct)) return "";
    const k = Secp256k1.utils.hkdf(hexBytes(priv), hexBytes(j.salt), new TextEncoder().encode("aistim-hub-token"), 32);
    const kunci = await crypto.subtle.importKey("raw", k, "AES-GCM", false, ["decrypt"]);
    const buf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: hexBytes(j.iv), additionalData: new TextEncoder().encode("aistim-key.json:v1:" + j.pub), tagLength: 128 }, kunci, hexBytes(j.ct));
    const t = new TextDecoder().decode(buf).trim();
    return /^[A-Za-z0-9_\-]{20,255}$/.test(t) ? t : "";
  } catch (e) {
    return ""; // tidak ada, rusak, atau bukan untuk key ini: pakai token tersimpan
  }
}
async function unggahBagi(teks, sig, priv) {
  const token = (await tokenDariKey(priv)) || (await store.get("ghToken", ""));
  if (!token) return "token GitHub belum ada (jalankan workflow Encrypt hub token di GitHub, atau simpan token lewat Aistim.sync)";
  try {
    return (await ghKirim("data/menu.json", teks, token, "menu.json: menu bersama diperbarui dari Board (admin)")) || (await ghKirim("data/menu.json.sig", sig + "\n", token, "menu.json.sig: tanda tangan admin"));
  } catch (e) {
    return "tidak ada koneksi";
  }
}
/*/PRO*/

// ---------- Pengaturan ----------
const dlg = $("dlg-settings");
let gambarBaru = null; // data URL gambar yang baru dipilih (belum disimpan)

GRADIENTS.forEach((g, i) => {
  const o = document.createElement("option");
  o.value = String(i);
  o.textContent = g.nama;
  $("set-grad").append(o);
});

function syncRows() {
  const mode = $("set-bg").value;
  $("row-warna").hidden = mode !== "warna";
  $("row-gambar").hidden = mode !== "gambar";
  $("row-online").hidden = mode !== "online";
}

function resizeImage(file, maxSide = 1920) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gambar tidak bisa dibaca."));
    };
    img.src = url;
  });
}

// ---------- Tampilan buatan sendiri ----------
const BAWAAN = [["board", "Board"], ["start", "Aistim"], ["sync", "Aistim.sync"]];

let editing = null; // { kind: "sync" | "view", id }

const ICONS = {
  pakai: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  edit: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
  nama: '<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>',
  hapus: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
};

function btn(name, label, fn, danger) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "ico" + (danger ? " danger" : "");
  b.title = label;
  b.setAttribute("aria-label", label);
  b.innerHTML = '<svg viewBox="0 0 24 24">' + ICONS[name] + "</svg>";
  b.addEventListener("click", fn);
  return b;
}

// Popup kecil serbaguna: tanya teks (tambah/ubah nama) atau konfirmasi (hapus)
const dlgMenu = $("dlg-menu");
let menuAksi = null;
function popup({ judul, teks, nilai, ok, bahaya }) {
  return new Promise((resolve) => {
    $("menu-title").textContent = judul;
    $("menu-text").textContent = teks || "";
    $("menu-text").hidden = !teks;
    const inp = $("menu-input");
    inp.hidden = nilai === undefined;
    inp.value = nilai || "";
    $("menu-ok").textContent = ok || "OK";
    $("menu-ok").className = bahaya ? "danger" : "pri";
    menuAksi = (batal) => {
      dlgMenu.close();
      menuAksi = null;
      resolve(batal ? null : nilai === undefined ? true : inp.value.trim().slice(0, 30));
    };
    dlgMenu.showModal();
    if (nilai !== undefined) { inp.focus(); inp.select(); }
  });
}
$("menu-cancel").addEventListener("click", () => menuAksi && menuAksi(true));
dlgMenu.addEventListener("cancel", (e) => { e.preventDefault(); menuAksi && menuAksi(true); });
$("form-menu").addEventListener("submit", (e) => { e.preventDefault(); menuAksi && menuAksi(false); });

function renderViews(pilih) {
  const sel = $("set-view");
  sel.textContent = "";
  [...BAWAAN, ...views.map((v) => ["v:" + v.id, v.nama])].forEach(([val, label]) => {
    const o = document.createElement("option");
    o.value = val;
    o.textContent = label;
    sel.append(o);
  });
  sel.value = pilih;
  if (sel.value !== pilih) sel.value = "board";
  const aktif = sel.value;

  const tb = $("view-list");
  tb.textContent = "";
  const baris = [
    ...BAWAAN.map(([val, nama]) => ({ val, nama, jenis: "Bawaan", sync: val === "sync" })),
    ...views.map((v, i) => ({ val: "v:" + v.id, nama: v.nama, jenis: "Buatan", i, v })),
  ];
  baris.forEach((r, n) => {
    const tr = document.createElement("tr");
    if (r.val === aktif) tr.className = "aktif";
    const c0 = document.createElement("td");
    c0.textContent = r.val === aktif ? "✓" : String(n + 1);
    const c1 = document.createElement("td");
    c1.textContent = r.nama;
    const sm = document.createElement("small");
    sm.textContent = r.jenis;
    c1.append(sm);
    const c2 = document.createElement("td");
    c2.className = "aksi";
    c2.append(btn("pakai", "Pakai", () => renderViews(r.val)));
    if (r.sync) c2.append(btn("edit", "Edit HTML", () => openEditor({ kind: "sync" })));
    if (r.v) {
      c2.append(btn("edit", "Edit HTML", () => openEditor({ kind: "view", id: r.v.id })));
      c2.append(
        btn("nama", "Ubah nama", async () => {
          const baru = await popup({ judul: "Ubah nama menu", nilai: r.v.nama, ok: "Simpan" });
          if (!baru) return;
          views[r.i].nama = baru;
          await saveViews();
          renderViews($("set-view").value);
        })
      );
      c2.append(
        btn(
          "hapus",
          "Hapus",
          async () => {
            if (!(await popup({ judul: "Hapus menu", teks: 'Hapus menu "' + r.v.nama + '" beserta HTML-nya?', ok: "Hapus", bahaya: true }))) return;
            const dipilih = $("set-view").value === r.val;
            views.splice(r.i, 1);
            await saveViews();
            renderViews(dipilih ? "board" : $("set-view").value);
          },
          true
        )
      );
    }
    tr.append(c0, c1, c2);
    tb.append(tr);
  });
}

async function openEditor(target) {
  editing = target;
  let html = DEFAULT_VIEW_HTML;
  if (target.kind === "sync") {
    const pw = await store.get("syncPass", null);
    if (pw && pw.hash) return msg("Aistim.sync terkunci. Buka lewat Aistim.sync dengan password.");
    html = (await store.get("syncLocal", "")) || (await store.get("syncHtmlV", "")) || html;
    $("ed-title").textContent = "Edit HTML: Aistim.sync";
    $("ed-reset").hidden = !(await store.get("syncLocal", ""));
  } else {
    const v = views.find((x) => x.id === target.id);
    if (!v) return;
    html = v.html || html;
    $("ed-title").textContent = "Edit HTML: " + v.nama;
    $("ed-reset").hidden = true;
  }
  $("ed-text").value = html;
  $("ed-msg").textContent = "";
  $("menu-table").hidden = true;
  $("menu-editor").hidden = false;
  $("btn-cancel").closest("menu").hidden = true; // sembunyikan Batal/Simpan utama saat mengedit HTML
  $("ed-text").focus();
}

function closeEditor() {
  editing = null;
  $("btn-cancel").closest("menu").hidden = false;
  $("menu-editor").hidden = true;
  $("menu-table").hidden = false;
}

$("ed-cancel").addEventListener("click", closeEditor);
$("ed-save").addEventListener("click", async () => {
  const v = $("ed-text").value;
  if (!v.trim() || v.length > 500000) return ($("ed-msg").textContent = "Isi kosong atau terlalu besar.");
  if (editing.kind === "sync") await store.set("syncLocal", v);
  else {
    const e = views.find((x) => x.id === editing.id);
    if (e) e.html = v;
    await saveViews();
  }
  closeEditor();
  msg("HTML disimpan.");
});
$("ed-reset").addEventListener("click", async () => {
  if (hasChrome) await chrome.storage.local.remove("syncLocal");
  else localStorage.removeItem("syncLocal");
  closeEditor();
  msg("Dikembalikan ke versi GitHub.");
});

$("btn-add-view").addEventListener("click", async () => {
  if (views.length >= 20) return msg("Maksimal 20 menu.");
  const nama = await popup({ judul: "Tambah menu", nilai: "", ok: "Tambah" });
  if (!nama) return;
  const id = Date.now().toString(36);
  views.push({ id, nama, html: DEFAULT_VIEW_HTML });
  await saveViews();
  renderViews("v:" + id);
});

try {
  if (hasChrome && chrome.runtime && chrome.runtime.getManifest) $("ver").textContent = "v" + chrome.runtime.getManifest().version;
} catch (e) {}

function showTab(n) {
  document.querySelectorAll(".tab").forEach((t) => {
    const on = t.dataset.tab === String(n);
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", on);
  });
  document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = p.id !== "tab-" + n));
}
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));

$("btn-settings").addEventListener("click", () => {
  gambarBaru = null;
  showTab(1);
  closeEditor();
  renderViews(settings.tampilan || "board");
  $("set-name").value = settings.nama || "";
  $("set-24h").checked = !!settings.jam24;
  $("set-bg").value = settings.latar;
  $("set-grad").value = String(settings.warna);
  $("set-foto").value = ["tab", "jam", "hari"].includes(settings.foto) ? settings.foto : "hari";
  $("set-img").value = "";
  $("img-info").textContent = settings.gambar ? "Gambar tersimpan. Pilih berkas baru untuk menggantinya." : "Belum ada gambar.";
  syncRows();
  dlg.showModal();
});
$("set-bg").addEventListener("change", syncRows);
$("btn-cancel").addEventListener("click", () => dlg.close());

$("set-img").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    gambarBaru = await resizeImage(f);
    $("img-info").textContent = "Gambar siap disimpan (" + Math.round(gambarBaru.length / 1024) + " KB).";
  } catch (err) {
    gambarBaru = null;
    $("img-info").textContent = err.message;
  }
});

$("form-settings").addEventListener("submit", async () => {
  const latar = $("set-bg").value;
  const gambar = gambarBaru || settings.gambar;
  settings = {
    nama: $("set-name").value.trim().slice(0, 30),
    jam24: $("set-24h").checked,
    latar: latar === "gambar" && !gambar ? "harian" : latar, // tanpa gambar tersimpan, kembali ke latar harian
    warna: Number($("set-grad").value) || 0,
    gambar,
    foto: $("set-foto").value,
    tampilan: $("set-view").value,
  };
  try {
    await store.set("settings", settings);
  } catch (e) {
    // gambar terlalu besar untuk disimpan: lepas gambarnya, sisanya tetap disimpan
    settings.gambar = "";
    if (settings.latar === "gambar") settings.latar = "harian";
    await store.set("settings", settings);
  }
  if (settings.tampilan === "start") return showStart();
  if (settings.tampilan === "sync") return showStart("menu/sync.html");
  if (String(settings.tampilan).startsWith("v:")) return openCustom();
  applyBackground();
  tick();
});

/*PRO*/
// ---------- Private key admin (disimpan lokal di browser ini) ----------
const dlgKey = $("dlg-key");
function normalKey(v) {
  v = (v || "").trim();
  if (/^-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]+-----END [A-Z ]*PRIVATE KEY-----$/.test(v)) return v;
  const h = v.replace(/^0x/i, "");
  return /^[0-9a-fA-F]{64}$/.test(h) ? h.toLowerCase() : null;
}
async function refreshKeyState() {
  const k = await store.get("adminKey", "");
  const ada = typeof k === "string" && k.length > 0;
  $("key-state").textContent = ada ? "Tersimpan di browser ini (berakhir …" + k.replace(/\s/g, "").slice(-4) + ")." : "Belum ada key tersimpan.";
  $("key-del").hidden = !ada;
}
$("btn-key").addEventListener("click", async () => {
  $("key-input").value = "";
  $("key-msg").textContent = "";
  await refreshKeyState();
  dlgKey.showModal();
  $("key-input").focus();
});
$("key-cancel").addEventListener("click", () => dlgKey.close());
$("form-key").addEventListener("submit", async (e) => {
  e.preventDefault();
  const k = normalKey($("key-input").value);
  if (!k) return ($("key-msg").textContent = "Format tidak dikenali (64 karakter hex atau blok PEM).");
  try {
    await store.set("adminKey", k);
    const cek = await store.get("adminKey", "");
    if (cek !== k) throw new Error("tidak terbaca ulang");
  } catch (err) {
    return ($("key-msg").textContent = "Gagal menyimpan: " + (err && err.message ? err.message : err));
  }
  $("key-input").value = "";
  dlgKey.close();
  msg("Private key tersimpan.");
});
$("key-del").addEventListener("click", async () => {
  if (hasChrome) await chrome.storage.local.remove("adminKey");
  else localStorage.removeItem("adminKey");
  dlgKey.close();
  msg("Private key dihapus.");
});
/*/PRO*/

async function startBoard() {
  tick();
  setInterval(tick, 1000);
  initQuote();
  applyBackground();
  const pn = await store.get("pins", []);
  pins = Array.isArray(pn) ? pn.filter((x) => x && typeof x.href === "string") : [];
  const pv = await store.get("pinsV", []); // salinan terverifikasi terakhir, agar tampil juga saat offline
  pinsV = validMenu(pv) ? pv : [];
  try {
    const sp = await store.get("syncPass", null);
    pinAdmin = !!(sp && sp.pub && typeof AistimVerify !== "undefined" && sp.pub === AistimVerify.PUB);
  } catch (e) {}
  renderPins();
  refreshMenuBersama(); // tidak ditunggu: halaman sudah tampil dengan salinan tersimpan
}

function showError(e) {
  const d = document.createElement("div");
  d.textContent = "Gagal memuat sebagian: " + (e && e.message ? e.message : e);
  d.style.cssText = "position:fixed;left:12px;right:12px;bottom:12px;padding:10px 12px;border-radius:8px;background:#7f1d1d;color:#fff;font:13px system-ui;z-index:99";
  document.body.append(d);
}

(async function init() {
  tick(); // jam langsung tampil, tidak menunggu penyimpanan
  try {
    const s = await store.get("settings", {});
    settings = { ...DEFAULT_SETTINGS, ...(s && typeof s === "object" ? s : {}) };
    const v = await store.get("views", []);
    views = Array.isArray(v) ? v : [];
    if (!views.length) {
      try {
        const b = JSON.parse(localStorage.getItem("views-backup") || "[]");
        if (Array.isArray(b) && b.length) { views = b; await store.set("views", views); }
      } catch (e) {}
    }
    const t = String(settings.tampilan);
    if (t === "start") return showStart();
    if (t === "sync") return showStart("menu/sync.html");
    if (t.startsWith("v:")) {
      if (views.some((x) => x.id === t.slice(2))) return openCustom();
      settings.tampilan = "board"; // menu sudah dihapus: kembali ke Board
      store.set("settings", settings);
    }
  } catch (e) {
    showError(e);
  }
  try {
    await startBoard();
  } catch (e) {
    showError(e);
  }
})();
