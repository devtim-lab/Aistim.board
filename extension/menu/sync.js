/* Aistim.sync: HTML diambil dari data/sync.html di GitHub (tanpa pasang ulang) dan disimpan untuk offline.
   Bisa juga diedit langsung di sini (tersimpan lokal), diunduh, atau diimpor dari berkas. Salinan lokal diutamakan.
   Ditampilkan di iframe sandbox: HTML dan CSS berjalan, skrip tidak. */
const URL_SYNC = "https://raw.githubusercontent.com/devtim-lab/Aistim.board/main/data/sync.html";
const URL_SIG = URL_SYNC + ".sig";
const URL_AKUN = "https://raw.githubusercontent.com/devtim-lab/Aistim.board/main/data/akun.json";
const DEFAULT_HTML = '<!doctype html><meta charset="utf-8"><body style="margin:0;height:100vh;display:grid;place-items:center;background:#0f172a;color:#fff;font-family:system-ui"><h1 style="font-weight:300;font-size:64px">Hallo</h1>';
const $ = (id) => document.getElementById(id);
const GH = { owner: "devtim-lab", repo: "Aistim.board", path: "data/sync.html", branch: "main" };
const VIEW_ID = new URLSearchParams(location.search).get("id"); // ada = tampilan buatan sendiri (lokal saja)
const frame = $("v");
const ok = (h) => typeof h === "string" && h.length > 0 && h.length < 500000;
let remote = DEFAULT_HTML; // salinan GitHub / bawaan
let local = null; // salinan hasil edit di perangkat ini
let locked = false; // true selama password ada tetapi belum dimasukkan (mode lihat: hanya salinan GitHub, alat edit tersembunyi)
const current = () => (!locked && ok(local) ? local : remote);

async function get(k) {
  try { return (await chrome.storage.local.get(k))[k]; } catch (e) { return undefined; }
}
async function put(o) {
  try { await chrome.storage.local.set(o); return true; } catch (e) { return false; }
}
// mode lihat: password ada tetapi belum login. Hanya salinan GitHub yang tampil; alat edit tersembunyi
function setKunci(v) {
  locked = v;
  document.body.classList.toggle("locked", v);
  if (!v) document.body.classList.remove("asking");
  segarLogin();
  if (v) {
    for (const id of ["ed", "tk", "pw", "pf", "ak"]) { const e = $(id); if (e) e.classList.remove("on"); }
    akDraft = null; akRec = null;
  }
  render();
}
// ikon Login terlihat selama belum login; bila belum ada password, ketukannya membuka dialog buat password
async function segarLogin() {
  if (VIEW_ID) return;
  const rec = await get("syncPass");
  $("login").hidden = !(locked || !(rec && rec.hash));
}
function render() {
  frame.srcdoc = current();
  $("reset").hidden = VIEW_ID ? true : !ok(local);
}

async function loadViews() { const v = await get("views"); return Array.isArray(v) ? v : []; }

(async function () {
  if (VIEW_ID) {
    const v = (await loadViews()).find((x) => x.id === VIEW_ID);
    if (v) { document.title = v.nama; remote = ok(v.html) ? v.html : DEFAULT_HTML; }
    render();
    return;
  }
  $("prof").hidden = false;
  const pr = await get("syncPass");
  if (pr && pr.hash) {
    if (await sesiSah(pr)) await sesi.buat(pr.hash); // masih masuk: perpanjang
    else setKunci(true);
  }
  segarLogin();
  const r = await get("syncHtmlV");
  if (ok(r)) remote = r;
  const l = await get("syncLocal");
  if (ok(l)) local = l;
  render();
  try {
    const [res, sg] = await Promise.all([fetch(URL_SYNC, { cache: "no-cache" }), fetch(URL_SIG, { cache: "no-cache" })]);
    if (!res.ok || !sg.ok) return;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (!AistimVerify.cek("sync.html", buf, await sg.text())) return; // tanda tangan admin tidak cocok: abaikan data GitHub
    const h = new TextDecoder().decode(buf);
    if (!ok(h) || h === remote) return;
    remote = h;
    await put({ syncHtmlV: h });
    if (!ok(local)) render();
  } catch (e) {}
})();

// simpan hasil edit: tampilan buatan sendiri -> entri di daftar views; Aistim.sync -> syncLocal
async function simpan(v) {
  if (!VIEW_ID) { const okk = await put({ syncLocal: v }); if (okk) local = v; return okk; }
  const list = await loadViews();
  const e = list.find((x) => x.id === VIEW_ID);
  if (!e) return false;
  e.html = v;
  const okk = await put({ views: list });
  if (okk) remote = v;
  return okk;
}

$("edit").addEventListener("click", (e) => {
  e.preventDefault();
  $("ta").value = current();
  $("msg").textContent = "";
  $("ed").classList.add("on");
  $("ta").focus();
});
$("cancel").addEventListener("click", () => $("ed").classList.remove("on"));
$("save").addEventListener("click", async () => {
  const v = $("ta").value;
  if (!ok(v)) { $("msg").textContent = "Isi kosong atau terlalu besar."; return; }
  if (!(await simpan(v))) { $("msg").textContent = "Gagal menyimpan."; return; }
  render();
  $("ed").classList.remove("on");
});
$("reset").addEventListener("click", async (e) => {
  e.preventDefault();
  try { await chrome.storage.local.remove("syncLocal"); } catch (x) {}
  local = null;
  render();
});
let toast;
function note(t) {
  const m = $("msg"), b = $("note");
  b.textContent = t; b.hidden = false; m.textContent = $("ed").classList.contains("on") ? t : "";
  clearTimeout(toast); toast = setTimeout(() => { b.hidden = true; if (m.textContent === t) m.textContent = ""; }, 2500);
}
/* ---------- Password Aistim.sync (hanya hash PBKDF2-SHA256 + salt yang disimpan, bukan passwordnya) ---------- */
const PW_ITER = 200000;
const hx = (u) => Array.from(new Uint8Array(u), (b) => b.toString(16).padStart(2, "0")).join("");
const hexBytes = (h) => Uint8Array.from(h.match(/../g).map((x) => parseInt(x, 16)));
async function pbkdf(pw, saltHex, iter) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: hexBytes(saltHex), iterations: iter }, key, 256));
}
// v1: PBKDF2-SHA256. v2: PBKDF2-SHA256 lalu HKDF dari SDK (Secp256k1.utils.hkdf) dengan info "aistim-sync-pw".
async function hashPw(pw, saltHex, iter, v) {
  const bits = await pbkdf(pw, saltHex, iter);
  if (v === 2) return hx(Secp256k1.utils.hkdf(bits, hexBytes(saltHex), new TextEncoder().encode("aistim-sync-pw"), 32));
  return hx(bits);
}
// pasangan kunci dari password (secp256k1, SDK): private key = HKDF(PBKDF2(password)), tidak disimpan; pub dan addr (keccak256) disimpan
async function privDari(pw, saltHex, iter) {
  const bits = await pbkdf(pw, saltHex, iter);
  return hx(Secp256k1.utils.hkdf(bits, hexBytes(saltHex), new TextEncoder().encode("aistim-sync-key"), 32));
}
// Kunci ID (salt): 32 karakter hex dipakai apa adanya; teks lain (8-200 karakter) dijadikan 16 byte lewat SHA-256.
async function saltDariKunci(k) {
  k = (k || "").trim();
  if (/^[0-9a-fA-F]{32}$/.test(k)) return k.toLowerCase();
  if (k.length < 8 || k.length > 200) return null;
  return hx(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("aistim-sync-kunci-id:v1:" + k))).slice(0, 16));
}
async function profilDari(pw, saltHex, iter) {
  const priv = await privDari(pw, saltHex, iter);
  const pub = Secp256k1.getPublicKey(priv, true);
  const tak = Secp256k1.getPublicKey(priv, false); // 04 + x + y
  const addr = "0x" + hx(Keccak.keccak256(Secp256k1.utils.hexToBytes(tak.slice(2))).slice(-20));
  return { pub, addr };
}
async function cekPw(pw, rec) {
  if (!rec || typeof rec.hash !== "string" || typeof rec.salt !== "string") return false;
  const h = await hashPw(pw, rec.salt, rec.iter, rec.v);
  let d = h.length ^ rec.hash.length;
  for (let i = 0; i < h.length; i++) d |= h.charCodeAt(i) ^ rec.hash.charCodeAt(i);
  return d === 0;
}
// sesi masuk: disimpan di chrome.storage.session (hilang saat browser ditutup), terikat ke hash password yang berlaku
const SESI_MS = 30 * 60 * 1000;
const sesi = {
  async ambil() { try { return (await chrome.storage.session.get("syncSesi")).syncSesi; } catch (e) { return undefined; } },
  async buat(hash) { try { await chrome.storage.session.set({ syncSesi: { h: hash, sampai: Date.now() + SESI_MS } }); } catch (e) {} },
  async hapus() { try { await chrome.storage.session.remove("syncSesi"); } catch (e) {} },
};
async function sesiSah(rec) {
  const s = await sesi.ambil();
  return !!(s && rec && s.h === rec.hash && s.sampai > Date.now());
}
// ikon mata: tampilkan atau sembunyikan password di kolom isian
const MATA = '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const MATA_CORET = '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>';
function pasangMata(inp) {
  const w = document.createElement("span");
  w.className = "pwf";
  inp.replaceWith(w);
  w.append(inp);
  const b = document.createElement("button");
  b.type = "button";
  b.className = "eye";
  w.append(b);
  const segarkan = () => {
    const lihat = inp.type === "text";
    b.innerHTML = lihat ? MATA_CORET : MATA;
    b.title = lihat ? "Sembunyikan password" : "Tampilkan password";
    b.setAttribute("aria-label", b.title);
  };
  b.addEventListener("click", () => { inp.type = inp.type === "password" ? "text" : "password"; inp.focus(); });
  new MutationObserver(segarkan).observe(inp, { attributes: true, attributeFilter: ["type"] });
  segarkan();
}
for (const id of ["lk-in", "pw-old", "pw-new", "pw-new2", "pw-key", "ak-pass"]) pasangMata($(id));
let gagalPw = 0;
async function bukaKunci() {
  const pw = $("lk-in").value;
  if (!pw) return;
  $("lk-ok").disabled = true;
  if (gagalPw) await new Promise((r) => setTimeout(r, Math.min(gagalPw, 5) * 1000)); // jeda makin lama setelah salah
  const rec0 = await get("syncPass");
  const benar = await cekPw(pw, rec0);
  $("lk-ok").disabled = false;
  if (benar && !(rec0.pub && rec0.addr)) { // rekam lama: lengkapi pub dan addr
    try { await put({ syncPass: { ...rec0, ...(await profilDari(pw, rec0.salt, rec0.iter)) } }); } catch (e) {}
  }
  if (!benar) { gagalPw++; $("lk-msg").textContent = "Password salah."; $("lk-in").select(); return; }
  gagalPw = 0;
  if ($("lk-tetap").checked) await sesi.buat(rec0.hash);
  $("lk-in").value = "";
  $("lk-in").type = "password";
  $("lk-msg").textContent = "";
  setKunci(false);
}
function mintaLogin(e) {
  e.preventDefault();
  $("pf").classList.remove("on");
  document.body.classList.add("asking");
  $("lk-msg").textContent = "";
  $("lk-in").focus();
}
$("login").addEventListener("click", (e) => { if (locked) mintaLogin(e); else bukaPw(e); });
$("pf-login").addEventListener("click", mintaLogin);
$("lk-batal").addEventListener("click", () => { document.body.classList.remove("asking"); $("lk-in").value = ""; $("lk-in").type = "password"; $("lk-msg").textContent = ""; $("lk-reset").hidden = true; });
$("lk-ok").addEventListener("click", bukaKunci);
// lupa password: hapus password dan hasil edit lokal (isi lokal tidak pernah terbaca tanpa password)
$("lk-lupa").addEventListener("click", () => { $("lk-reset").hidden = false; });
$("lk-reset-no").addEventListener("click", () => { $("lk-reset").hidden = true; });
$("lk-reset-ok").addEventListener("click", async () => {
  try { await chrome.storage.local.remove(["syncPass", "syncLocal"]); } catch (e) { $("lk-msg").textContent = "Gagal mereset."; return; }
  await sesi.hapus();
  local = null;
  gagalPw = 0;
  $("lk-reset").hidden = true;
  $("lk-in").value = "";
  $("lk-msg").textContent = "";
  setKunci(false);
  note("Password dan edit lokal dihapus");
});
$("lk-in").addEventListener("keydown", (e) => { if (e.key === "Enter") bukaKunci(); });

let punyaPw = false;
async function bukaPw(e) {
  e.preventDefault();
  const rec = await get("syncPass");
  punyaPw = !!(rec && rec.hash);
  for (const id of ["pw-old", "pw-new", "pw-new2", "pw-key"]) { $(id).value = ""; $(id).type = "password"; }
  $("pw-key").placeholder = punyaPw ? "Kunci ID (kosong: tetap yang sekarang)" : "Kunci ID (kosong: dibuat acak)";
  $("pw-old").hidden = !punyaPw;
  $("pw-del").hidden = !punyaPw;
  $("pw-t").textContent = punyaPw ? "Ubah password Aistim.sync" : "Buat password Aistim.sync";
  $("pw-msg").textContent = "";
  $("pw").classList.add("on");
  (punyaPw ? $("pw-old") : $("pw-new")).focus();
}
$("pf-pw").addEventListener("click", (e) => { $("pf").classList.remove("on"); bukaPw(e); });
$("pw-cancel").addEventListener("click", () => { $("pw").classList.remove("on"); for (const id of ["pw-old", "pw-new", "pw-new2", "pw-key"]) $(id).type = "password"; });
async function pwLama() {
  if (!punyaPw) return true;
  if (await cekPw($("pw-old").value, await get("syncPass"))) return true;
  $("pw-msg").textContent = "Password saat ini salah.";
  return false;
}
$("pw-save").addEventListener("click", async () => {
  if (!(await pwLama())) return;
  const a = $("pw-new").value;
  if (a.length < 4 || a.length > 200) { $("pw-msg").textContent = "Password minimal 4 karakter."; return; }
  if (a !== $("pw-new2").value) { $("pw-msg").textContent = "Pengulangan tidak sama."; return; }
  // Kunci ID = salt. Diisi: dipakai (supaya Addr sama di perangkat lain). Kosong: tetap yang sekarang, atau acak bila belum ada.
  const lama = await get("syncPass");
  const kunci = $("pw-key").value.trim();
  let salt = kunci ? await saltDariKunci(kunci) : lama && /^[0-9a-f]{32}$/.test(lama.salt) ? lama.salt : hx(crypto.getRandomValues(new Uint8Array(16)));
  if (!salt) { $("pw-msg").textContent = "Kunci ID: 32 karakter hex dari Profil, atau frasa minimal 8 karakter."; return; }
  const hash = await hashPw(a, salt, PW_ITER, 2);
  const pr = await profilDari(a, salt, PW_ITER);
  if (!(await put({ syncPass: { v: 2, salt, iter: PW_ITER, hash, ...pr } }))) { $("pw-msg").textContent = "Gagal menyimpan."; return; }
  segarLogin();
  await sesi.buat(hash); // yang baru saja membuat atau mengubah password tetap masuk
  $("pw").classList.remove("on");
  for (const id of ["pw-new", "pw-new2", "pw-key"]) { $(id).type = "password"; $(id).value = ""; }
  note("Password disimpan. Addr " + pr.addr.slice(0, 6) + "…" + pr.addr.slice(-4));
});
$("pw-del").addEventListener("click", async () => {
  if (!(await pwLama())) return;
  try { await chrome.storage.local.remove("syncPass"); } catch (e) { $("pw-msg").textContent = "Gagal menghapus."; return; }
  await sesi.hapus();
  segarLogin();
  $("pw").classList.remove("on");
  note("Password dihapus");
});
// daftar akun (akun.json): salinan bawaan di extension, diperbarui dari GitHub hanya bila bertanda tangan admin
const alamatDari = (pub) => "0x" + hx(Keccak.keccak256(Secp256k1.utils.hexToBytes(Secp256k1.Point.fromHex(pub).toHex(false).slice(2))).slice(-20));
function akunSah(j) {
  try {
    if (!j || j.version !== 1 || !Array.isArray(j.akun) || !j.akun.length || j.akun.length > 200) return false;
    return j.akun.some((a) => a && a.role === "admin") && j.akun.every((a) => a && typeof a.nama === "string" && a.nama.length > 0 && a.nama.length <= 40 &&
      /^0[23][0-9a-f]{64}$/.test(a.pub) && (a.role === "admin" || a.role === "user") && String(a.addr).toLowerCase() === alamatDari(a.pub) && Array.isArray(a.script));
  } catch (e) { return false; }
}
async function akunLokal() {
  const c = await get("akunV");
  if (akunSah(c)) return c;
  try { const j = await (await fetch("akun.json")).json(); if (akunSah(j)) return j; } catch (e) {}
  return null;
}
async function akunBawaan() {
  try { const j = await (await fetch("akun.json")).json(); if (akunSah(j)) return j; } catch (e) {}
  return null;
}
const adminPub = (list) => new Set(list ? list.akun.filter((a) => a.role === "admin").map((a) => a.pub) : []);
// daftar dari GitHub diterima hanya bila ditandatangani admin yang sudah dipercaya (admin di salinan bawaan atau di daftar terverifikasi saat ini)
async function akunRemote() {
  try {
    const [r, sg] = await Promise.all([fetch(URL_AKUN, { cache: "no-cache" }), fetch(URL_AKUN + ".sig", { cache: "no-cache" })]);
    if (!r.ok || !sg.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    const sig = (await sg.text()).trim().toLowerCase();
    const penanda = AistimVerify.penanda("akun.json", buf, sig);
    const boleh = new Set([...adminPub(await akunBawaan()), ...adminPub(await akunLokal())]);
    if (!penanda || !boleh.has(penanda)) return null; // bukan ditandatangani admin: abaikan
    const teks = new TextDecoder().decode(buf);
    const j = JSON.parse(teks);
    if (!akunSah(j)) return null;
    await put({ akunV: j, akunTeks: teks, akunSig: sig });
    return j;
  } catch (e) { return null; }
}
function adalahAdmin(list, rec) {
  const a = list && rec ? list.akun.find((x) => x.addr.toLowerCase() === String(rec.addr).toLowerCase() && x.pub === rec.pub) : null;
  return !!(a && a.role === "admin");
}
function hasilAkun(list, rec) {
  if (!list) return "Daftar akun tidak tersedia";
  const a = list.akun.find((x) => x.addr.toLowerCase() === String(rec.addr).toLowerCase());
  if (!a) return "Tidak terdaftar";
  return a.pub === rec.pub ? a.nama + " (" + a.role + ")" : "Alamat terdaftar tetapi pub tidak cocok";
}
async function tampilAkun(rec) {
  const l = await akunLokal();
  $("pf-akun").textContent = hasilAkun(l, rec);
  $("pf-kelola").hidden = !adalahAdmin(l, rec);
  const r = await akunRemote();
  if (r && $("pf").classList.contains("on")) {
    $("pf-akun").textContent = hasilAkun(r, rec);
    $("pf-kelola").hidden = !adalahAdmin(r, rec);
  }
}

// ikon profil: hash password, addr, pub (diturunkan dari password lewat SDK)
$("prof").addEventListener("click", async (e) => {
  e.preventDefault();
  const rec = await get("syncPass");
  const ada = !!(rec && rec.hash);
  const lihat = locked; // mode lihat: menu hanya menawarkan Login
  $("pf-login").hidden = !lihat;
  $("pf-pw").hidden = lihat;
  if (lihat) {
    $("pf-p").textContent = "Belum login. Login dengan password untuk membuka edit, profil, dan pengaturan password.";
    for (const id of ["pf-r1", "pf-r2", "pf-r3", "pf-r4", "pf-r5"]) $(id).hidden = true;
    $("pf-kelola").hidden = true;
    $("pf-out").hidden = true;
    $("pf").classList.add("on");
    return;
  }
  $("pf-p").textContent = ada
    ? "Pasangan kunci secp256k1 diturunkan dari password dan Kunci ID (SDK). Private key tidak disimpan. Ketuk nilai untuk menyalin. Isi Kunci ID yang sama di perangkat lain agar Addr-nya sama."
    : "Belum ada password. Ketuk Atur password; hash, addr, dan pub diturunkan dari password itu.";
  for (const id of ["pf-r1", "pf-r2", "pf-r3", "pf-r4", "pf-r5"]) $(id).hidden = !ada;
  $("pf-kelola").hidden = true;
  $("pf-out").hidden = !ada;
  if (ada) {
    $("pf-hash").textContent = rec.hash; $("pf-addr").textContent = rec.addr || "-"; $("pf-pub").textContent = rec.pub || "-"; $("pf-salt").textContent = rec.salt || "-";
    $("pf-akun").textContent = "Memeriksa…";
    tampilAkun(rec);
  }
  $("pf").classList.add("on");
});
$("pf-close").addEventListener("click", () => $("pf").classList.remove("on"));
// keluar: hapus sesi dan kunci lagi sekarang juga
$("pf-out").addEventListener("click", async () => {
  await sesi.hapus();
  setKunci(true);
  note("Kamu sudah keluar");
});
for (const id of ["pf-hash", "pf-addr", "pf-pub", "pf-salt"]) $(id).addEventListener("click", async () => {
  const t = $(id).textContent;
  if (!t || t === "-") return;
  await salin(t);
  $("pf-p").textContent = "Tersalin: " + t.slice(0, 12) + "…";
});
/* ---------- Kelola akun (khusus admin): tambah, ubah, hapus; disimpan dan ditandatangani dengan password admin ---------- */
const IKON_UBAH = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>';
const IKON_HAPUS = '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg>';
let akDraft = null, akRec = null, akUbah = -1, akHapus = -1, akKotor = false;
const akMsg = (t) => { $("ak-msg").textContent = t || ""; };
function akRender() {
  const box = $("ak-list");
  box.replaceChildren();
  akDraft.forEach((a, i) => {
    const it = document.createElement("div");
    it.className = "it";
    const t = document.createElement("div");
    t.className = "t";
    const b = document.createElement("b");
    b.textContent = a.nama + " · " + a.role;
    const sm = document.createElement("small");
    sm.textContent = a.addr;
    t.append(b, sm);
    it.append(t);
    const mk = (cls, judul, html, fn) => {
      const x = document.createElement("button");
      x.type = "button"; x.className = cls; x.title = judul; x.setAttribute("aria-label", judul); x.innerHTML = html;
      x.addEventListener("click", fn);
      return x;
    };
    if (akHapus === i) {
      const y = document.createElement("button"); y.type = "button"; y.className = "danger"; y.textContent = "Hapus";
      y.addEventListener("click", () => akHapusYa(i));
      const n = document.createElement("button"); n.type = "button"; n.textContent = "Batal";
      n.addEventListener("click", () => { akHapus = -1; akRender(); });
      it.append(y, n);
    } else {
      it.append(mk("ico2", "Ubah", IKON_UBAH, () => akBukaForm(i)), mk("ico2", "Hapus", IKON_HAPUS, () => { akHapus = i; akRender(); }));
    }
    box.append(it);
  });
  $("ak-simpan").disabled = !akKotor;
}
function akCek(daftar) {
  const adaAdmin = daftar.some((a) => a.role === "admin");
  if (!adaAdmin) return "Harus ada minimal satu admin.";
  if (!daftar.some((a) => a.addr.toLowerCase() === String(akRec.addr).toLowerCase() && a.role === "admin")) return "Kamu tidak bisa menghapus atau menurunkan akunmu sendiri.";
  const nama = new Set(), pubs = new Set();
  for (const a of daftar) {
    if (nama.has(a.nama.toLowerCase())) return "Nama ganda: " + a.nama;
    nama.add(a.nama.toLowerCase());
    if (pubs.has(a.pub)) return "Pub ganda untuk " + a.nama;
    pubs.add(a.pub);
  }
  return "";
}
function akHapusYa(i) {
  const baru = akDraft.filter((_, k) => k !== i);
  const err = akCek(baru);
  akHapus = -1;
  if (err) { akMsg(err); akRender(); return; }
  akDraft = baru; akKotor = true; akMsg("Akun dihapus. Belum disimpan."); akRender();
}
function akBukaForm(i) {
  akUbah = i;
  const a = i >= 0 ? akDraft[i] : null;
  $("ak-nama").value = a ? a.nama : "";
  $("ak-pub").value = a ? a.pub : "";
  $("ak-pub").readOnly = !!a; // pub tidak diubah; hapus lalu tambah ulang
  $("ak-role").value = a ? a.role : "user";
  $("ak-script").value = a ? a.script.join(", ") : "";
  $("ak-form").hidden = false;
  $("ak-sign").hidden = true;
  $("ak-hasil").hidden = true;
  akMsg("");
  $("ak-nama").focus();
}
$("ak-tambah").addEventListener("click", () => akBukaForm(-1));
$("ak-f-batal").addEventListener("click", () => { $("ak-form").hidden = true; akMsg(""); });
$("ak-f-ok").addEventListener("click", () => {
  const nama = $("ak-nama").value.trim();
  const pub = $("ak-pub").value.trim().toLowerCase();
  const role = $("ak-role").value;
  const script = $("ak-script").value.split(",").map((x) => x.trim()).filter(Boolean);
  if (!nama || nama.length > 40) return akMsg("Nama wajib diisi (maks. 40 karakter).");
  if (!/^0[23][0-9a-f]{64}$/.test(pub)) return akMsg("Pub harus 66 karakter hex diawali 02 atau 03.");
  if (script.some((x) => !/^[a-z0-9_-]+$/.test(x))) return akMsg("Nama script hanya huruf kecil, angka, - dan _.");
  let addr;
  try { addr = alamatDari(pub); } catch (e) { return akMsg("Pub bukan titik kurva yang sah."); }
  const baru = akDraft.map((a) => ({ ...a }));
  if (akUbah >= 0) Object.assign(baru[akUbah], { nama, role, script });
  else baru.push({ nama, addr, pub, role, script, dibuat: new Date().toISOString() });
  const err = akCek(baru);
  if (err) return akMsg(err);
  akDraft = baru; akKotor = true; $("ak-form").hidden = true; akMsg("Entri disimpan. Belum ditandatangani."); akRender();
});
$("ak-simpan").addEventListener("click", () => {
  if (!akKotor) return;
  $("ak-form").hidden = true;
  $("ak-hasil").hidden = true;
  $("ak-pass").value = "";
  $("ak-pass").type = "password";
  $("ak-sign").hidden = false;
  akMsg("");
  $("ak-pass").focus();
});
$("ak-s-batal").addEventListener("click", () => { $("ak-sign").hidden = true; akMsg(""); });
let akGagal = 0;
$("ak-s-ok").addEventListener("click", async () => {
  const pw = $("ak-pass").value;
  if (!pw) return;
  $("ak-s-ok").disabled = true;
  try {
    if (akGagal) await new Promise((r) => setTimeout(r, Math.min(akGagal, 5) * 1000));
    const sp = await get("syncPass");
    if (!sp || !sp.hash || !(await cekPw(pw, sp))) { akGagal++; return akMsg("Password salah."); }
    const priv = await privDari(pw, sp.salt, sp.iter);
    if (Secp256k1.getPublicKey(priv, true) !== akRec.pub) { akGagal++; return akMsg("Password ini bukan milik akun admin yang sedang masuk."); }
    const obj = { version: 1, akun: akDraft };
    const err = akCek(akDraft) || (akunSah(obj) ? "" : "Daftar tidak valid.");
    if (err) return akMsg(err);
    const teks = JSON.stringify(obj, null, 2) + "\n";
    const sig = AistimVerify.tanda130("akun.json", new TextEncoder().encode(teks), priv);
    if (!(await put({ akunV: obj, akunTeks: teks, akunSig: sig }))) return akMsg("Gagal menyimpan.");
    akGagal = 0; akKotor = false;
    $("ak-sign").hidden = true; $("ak-hasil").hidden = false;
    akMsg("Ditandatangani oleh " + akRec.addr.slice(0, 10) + "…");
    akRender();
    tampilAkun(await get("syncPass"));
  } finally { $("ak-s-ok").disabled = false; $("ak-pass").value = ""; }
});
$("ak-copy-json").addEventListener("click", async () => { const t = await get("akunTeks"); if (t) { await salin(t); akMsg("akun.json tersalin"); } });
$("ak-copy-sig").addEventListener("click", async () => { const t = await get("akunSig"); if (t) { await salin(t); akMsg("Tanda tangan tersalin"); } });
$("ak-tutup").addEventListener("click", () => {
  if (akKotor && !confirmTutup()) return;
  $("ak").classList.remove("on");
});
let tutupSekali = false;
function confirmTutup() { // perubahan belum disimpan: ketuk Tutup dua kali untuk membuang
  if (tutupSekali) { tutupSekali = false; return true; }
  tutupSekali = true; akMsg("Ada perubahan yang belum disimpan. Ketuk Tutup lagi untuk membuang.");
  setTimeout(() => { tutupSekali = false; }, 4000);
  return false;
}
$("pf-kelola").addEventListener("click", async () => {
  const rec = await get("syncPass");
  const list = await akunLokal();
  if (!rec || !adalahAdmin(list, rec)) return; // hanya admin terdaftar
  akRec = rec; akDraft = list.akun.map((a) => ({ ...a, script: [...a.script] })); akKotor = false; akHapus = -1; akUbah = -1;
  $("ak-form").hidden = true; $("ak-sign").hidden = true; $("ak-hasil").hidden = true; akMsg("");
  akRender();
  $("pf").classList.remove("on");
  $("ak").classList.add("on");
});
async function salin(text) {
  try { await navigator.clipboard.writeText(text); note("Tersalin"); return; } catch (e) {}
  const t = document.createElement("textarea"); // cadangan bila clipboard API ditolak
  t.value = text; document.body.appendChild(t); t.select();
  let okc = false; try { okc = document.execCommand("copy"); } catch (e) {}
  t.remove(); note(okc ? "Tersalin" : "Gagal menyalin");
}
$("copy2").addEventListener("click", () => salin($("ta").value));

$("back").addEventListener("click", async (e) => {
  e.preventDefault();
  const r = await get("settings");
  await put({ settings: { ...(r || {}), tampilan: "board" } });
  parent.postMessage({ aistim: "board" }, location.origin);
});

/*PRO*/
/* ---------- Upload ke GitHub (hanya Aistim.sync) ---------- */
if (!VIEW_ID) { $("gh").hidden = false; $("key").hidden = false; }

const b64 = (str) => { // UTF-8 -> base64
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const api = (path, token, opt = {}) =>
  fetch("https://api.github.com/repos/" + GH.owner + "/" + GH.repo + "/contents/" + path + opt.q, {
    method: opt.method || "GET",
    headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    body: opt.body,
    cache: "no-store",
  });

function bukaToken(pesan) {
  get("ghToken").then((t) => { $("tk-del").hidden = !t; });
  $("tk-in").value = "";
  $("tk-msg").textContent = pesan || "";
  $("tk").classList.add("on");
  $("tk-in").focus();
}
$("key").addEventListener("click", (e) => { e.preventDefault(); bukaToken(); });
$("tk-cancel").addEventListener("click", () => $("tk").classList.remove("on"));
$("tk-save").addEventListener("click", async () => {
  const t = $("tk-in").value.trim();
  if (!/^[A-Za-z0-9_\-]{20,255}$/.test(t)) { $("tk-msg").textContent = "Token tidak terlihat benar."; return; }
  if (!(await put({ ghToken: t }))) { $("tk-msg").textContent = "Gagal menyimpan token."; return; }
  $("tk").classList.remove("on");
  note("Token disimpan");
});
$("tk-del").addEventListener("click", async () => {
  try { await chrome.storage.local.remove("ghToken"); } catch (e) {}
  $("tk").classList.remove("on");
  note("Token dihapus");
});

// tanda tangan data: berkas data/sync.html.sig, dibuat dari key admin (hex) yang disimpan di Board
async function unggahSig(isi, token) {
  const priv = String((await get("adminKey")) || "").trim().replace(/^0x/i, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(priv)) return "tanpa tanda tangan (simpan key admin hex di ikon kunci Board)";
  try {
    if (Secp256k1.getPublicKey(priv, true) !== AistimVerify.PUB) return "tanpa tanda tangan (key bukan key admin terdaftar)";
    const sig = AistimVerify.tanda("sync.html", new TextEncoder().encode(isi), priv);
    const p = GH.path + ".sig";
    for (let coba = 0; coba < 2; coba++) {
      const cur = await api(p, token, { q: "?ref=" + GH.branch });
      let sha;
      if (cur.status === 200) {
        const j = await cur.json();
        if ((j.content || "").replace(/\s/g, "") === b64(sig)) return "";
        sha = j.sha;
      } else if (cur.status !== 404) return "tanda tangan gagal (" + cur.status + ")";
      const res = await api(p, token, {
        method: "PUT",
        q: "",
        body: JSON.stringify({ message: "Aistim.sync: tanda tangan", content: b64(sig), branch: GH.branch, ...(sha ? { sha } : {}) }),
      });
      if (res.ok) return "";
      if (res.status !== 409 && res.status !== 422) return "tanda tangan gagal (" + res.status + ")";
    }
  } catch (e) {}
  return "tanda tangan gagal";
}

let sedangUpload = false;
$("gh").addEventListener("click", async (e) => {
  e.preventDefault();
  if (sedangUpload) return;
  const token = await get("ghToken");
  if (!token) return bukaToken("Tempel token dulu, lalu ketuk ikon upload lagi.");
  sedangUpload = true;
  note("Mengunggah…");
  try {
    const isi = current();
    for (let coba = 0; coba < 2; coba++) {
      const cur = await api(GH.path, token, { q: "?ref=" + GH.branch });
      let sha;
      if (cur.status === 200) {
        const j = await cur.json();
        sha = j.sha;
        if ((j.content || "").replace(/\s/g, "") === b64(isi)) { const m = await unggahSig(isi, token); note(m ? "Sudah sama dengan GitHub; " + m : "Sudah sama dengan GitHub, tanda tangan sesuai"); return; }
      } else if (cur.status !== 404) {
        return gagalGH(cur.status);
      }
      const res = await api(GH.path, token, {
        method: "PUT",
        q: "",
        body: JSON.stringify({ message: "Aistim.sync: perbarui dari extension", content: b64(isi), branch: GH.branch, ...(sha ? { sha } : {}) }),
      });
      if (res.ok) {
        remote = isi;
        local = null;
        await put({ syncHtmlV: isi });
        try { await chrome.storage.local.remove("syncLocal"); } catch (x) {}
        render();
        const m = await unggahSig(isi, token);
        note(m ? "Terunggah, " + m : "Terunggah dan bertanda tangan");
        return;
      }
      if (res.status !== 409 && res.status !== 422) return gagalGH(res.status); // 409/422 = sha basi, coba sekali lagi
    }
    note("Gagal: berkas berubah di GitHub, coba lagi");
  } catch (err) {
    note("Gagal: tidak ada koneksi");
  } finally {
    sedangUpload = false;
  }
});
async function gagalGH(status) {
  if (status === 401) {
    try { await chrome.storage.local.remove("ghToken"); } catch (e) {}
    bukaToken("Token ditolak atau kedaluwarsa. Tempel token baru.");
  } else if (status === 403) note("Gagal: token tidak punya izin (perlu Contents: Read and write)");
  else if (status === 404) note("Gagal: repo tidak ditemukan atau token tidak punya akses");
  else note("Gagal: GitHub membalas " + status);
}
// unggah daftar akun yang sudah ditandatangani (akun.json + akun.json.sig) ke repo
async function kirimFile(path, isi, token, pesan) {
  for (let coba = 0; coba < 2; coba++) {
    const cur = await api(path, token, { q: "?ref=" + GH.branch });
    let sha;
    if (cur.status === 200) {
      const j = await cur.json();
      if ((j.content || "").replace(/\s/g, "") === b64(isi)) return "";
      sha = j.sha;
    } else if (cur.status !== 404) return "GitHub membalas " + cur.status;
    const res = await api(path, token, { method: "PUT", q: "", body: JSON.stringify({ message: pesan, content: b64(isi), branch: GH.branch, ...(sha ? { sha } : {}) }) });
    if (res.ok) return "";
    if (res.status !== 409 && res.status !== 422) return "GitHub membalas " + res.status;
  }
  return "berkas berubah di GitHub, coba lagi";
}
$("ak-up").addEventListener("click", async () => {
  const token = await get("ghToken");
  if (!token) return $("ak-msg").textContent = "Simpan token GitHub dulu (ikon kunci di bar bawah).";
  const teks = await get("akunTeks"), sig = await get("akunSig");
  if (!teks || !sig) return $("ak-msg").textContent = "Belum ada daftar yang ditandatangani.";
  $("ak-up").disabled = true;
  $("ak-msg").textContent = "Mengunggah…";
  try {
    const e1 = await kirimFile("data/akun.json", teks, token, "akun.json: diperbarui dari Aistim.sync (admin)");
    const e2 = e1 || (await kirimFile("data/akun.json.sig", sig + "\n", token, "akun.json.sig: tanda tangan admin"));
    $("ak-msg").textContent = e1 || e2 ? "Gagal: " + (e1 || e2) : "Terunggah ke GitHub";
  } catch (e) { $("ak-msg").textContent = "Gagal: tidak ada koneksi"; }
  finally { $("ak-up").disabled = false; }
});
/*/PRO*/
