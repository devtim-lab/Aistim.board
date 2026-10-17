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
let locked = false; // true selama password belum dimasukkan
const current = () => (ok(local) ? local : remote);

async function get(k) {
  try { return (await chrome.storage.local.get(k))[k]; } catch (e) { return undefined; }
}
async function put(o) {
  try { await chrome.storage.local.set(o); return true; } catch (e) { return false; }
}
function render() {
  if (locked) return;
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
  $("lock").hidden = false;
  $("prof").hidden = false;
  const pr = await get("syncPass");
  if (pr && pr.hash) {
    if (await sesiSah(pr)) await sesi.buat(pr.hash); // masih masuk: perpanjang
    else { locked = true; document.body.classList.add("locked"); $("lk-in").focus(); }
  }
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
async function profilDari(pw, saltHex, iter) {
  const bits = await pbkdf(pw, saltHex, iter);
  const priv = hx(Secp256k1.utils.hkdf(bits, hexBytes(saltHex), new TextEncoder().encode("aistim-sync-key"), 32));
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
for (const id of ["lk-in", "pw-old", "pw-new", "pw-new2"]) pasangMata($(id));
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
  locked = false;
  document.body.classList.remove("locked");
  render();
}
$("lk-ok").addEventListener("click", bukaKunci);
// lupa password: hapus password dan hasil edit lokal (isi lokal tidak pernah terbaca tanpa password)
$("lk-lupa").addEventListener("click", () => { $("lk-reset").hidden = false; });
$("lk-reset-no").addEventListener("click", () => { $("lk-reset").hidden = true; });
$("lk-reset-ok").addEventListener("click", async () => {
  try { await chrome.storage.local.remove(["syncPass", "syncLocal"]); } catch (e) { $("lk-msg").textContent = "Gagal mereset."; return; }
  await sesi.hapus();
  local = null;
  gagalPw = 0;
  locked = false;
  $("lk-reset").hidden = true;
  $("lk-in").value = "";
  $("lk-msg").textContent = "";
  document.body.classList.remove("locked");
  render();
  note("Password dan edit lokal dihapus");
});
$("lk-in").addEventListener("keydown", (e) => { if (e.key === "Enter") bukaKunci(); });

let punyaPw = false;
async function bukaPw(e) {
  e.preventDefault();
  const rec = await get("syncPass");
  punyaPw = !!(rec && rec.hash);
  for (const id of ["pw-old", "pw-new", "pw-new2"]) { $(id).value = ""; $(id).type = "password"; }
  $("pw-old").hidden = !punyaPw;
  $("pw-del").hidden = !punyaPw;
  $("pw-t").textContent = punyaPw ? "Ubah password Aistim.sync" : "Buat password Aistim.sync";
  $("pw-msg").textContent = "";
  $("pw").classList.add("on");
  (punyaPw ? $("pw-old") : $("pw-new")).focus();
}
$("lock").addEventListener("click", bukaPw);
$("pw-cancel").addEventListener("click", () => { $("pw").classList.remove("on"); for (const id of ["pw-old", "pw-new", "pw-new2"]) $(id).type = "password"; });
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
  const salt = hx(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await hashPw(a, salt, PW_ITER, 2);
  const pr = await profilDari(a, salt, PW_ITER);
  if (!(await put({ syncPass: { v: 2, salt, iter: PW_ITER, hash, ...pr } }))) { $("pw-msg").textContent = "Gagal menyimpan."; return; }
  $("pw").classList.remove("on");
  for (const id of ["pw-new", "pw-new2"]) { $(id).type = "password"; $(id).value = ""; }
  note("Password disimpan");
});
$("pw-del").addEventListener("click", async () => {
  if (!(await pwLama())) return;
  try { await chrome.storage.local.remove("syncPass"); } catch (e) { $("pw-msg").textContent = "Gagal menghapus."; return; }
  await sesi.hapus();
  $("pw").classList.remove("on");
  note("Password dihapus");
});
// daftar akun (akun.json): salinan bawaan di extension, diperbarui dari GitHub hanya bila bertanda tangan admin
const alamatDari = (pub) => "0x" + hx(Keccak.keccak256(Secp256k1.utils.hexToBytes(Secp256k1.Point.fromHex(pub).toHex(false).slice(2))).slice(-20));
function akunSah(j) {
  try {
    if (!j || j.version !== 1 || !Array.isArray(j.akun) || !j.akun.length || j.akun.length > 200) return false;
    return j.akun.every((a) => a && typeof a.nama === "string" && a.nama.length > 0 && a.nama.length <= 40 &&
      /^0[23][0-9a-f]{64}$/.test(a.pub) && (a.role === "admin" || a.role === "user") && String(a.addr).toLowerCase() === alamatDari(a.pub));
  } catch (e) { return false; }
}
async function akunLokal() {
  const c = await get("akunV");
  if (akunSah(c)) return c;
  try { const j = await (await fetch("akun.json")).json(); if (akunSah(j)) return j; } catch (e) {}
  return null;
}
async function akunRemote() {
  try {
    const [r, sg] = await Promise.all([fetch(URL_AKUN, { cache: "no-cache" }), fetch(URL_AKUN + ".sig", { cache: "no-cache" })]);
    if (!r.ok || !sg.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    if (!AistimVerify.cek("akun.json", buf, await sg.text())) return null; // tanda tangan admin tidak cocok: abaikan
    const j = JSON.parse(new TextDecoder().decode(buf));
    if (!akunSah(j)) return null;
    await put({ akunV: j });
    return j;
  } catch (e) { return null; }
}
function hasilAkun(list, rec) {
  if (!list) return "Daftar akun tidak tersedia";
  const a = list.akun.find((x) => x.addr.toLowerCase() === String(rec.addr).toLowerCase());
  if (!a) return "Tidak terdaftar";
  return a.pub === rec.pub ? a.nama + " (" + a.role + ")" : "Alamat terdaftar tetapi pub tidak cocok";
}
async function tampilAkun(rec) {
  $("pf-akun").textContent = hasilAkun(await akunLokal(), rec);
  const r = await akunRemote();
  if (r && $("pf").classList.contains("on")) $("pf-akun").textContent = hasilAkun(r, rec);
}

// ikon profil: hash password, addr, pub (diturunkan dari password lewat SDK)
$("prof").addEventListener("click", async (e) => {
  e.preventDefault();
  const rec = await get("syncPass");
  const ada = !!(rec && rec.hash);
  $("pf-p").textContent = ada
    ? "Pasangan kunci secp256k1 diturunkan dari passwordmu (SDK). Private key tidak disimpan. Ketuk nilai untuk menyalin."
    : "Belum ada password. Buat password lewat ikon gembok; hash, addr, dan pub diturunkan dari password itu.";
  for (const id of ["pf-r1", "pf-r2", "pf-r3", "pf-r4"]) $(id).hidden = !ada;
  $("pf-out").hidden = !ada;
  if (ada) {
    $("pf-hash").textContent = rec.hash; $("pf-addr").textContent = rec.addr || "-"; $("pf-pub").textContent = rec.pub || "-";
    $("pf-akun").textContent = "Memeriksa…";
    tampilAkun(rec);
  }
  $("pf").classList.add("on");
});
$("pf-close").addEventListener("click", () => $("pf").classList.remove("on"));
// keluar: hapus sesi dan kunci lagi sekarang juga
$("pf-out").addEventListener("click", async () => {
  await sesi.hapus();
  locked = true;
  frame.srcdoc = "";
  $("ed").classList.remove("on");
  $("tk") && $("tk").classList.remove("on");
  $("pw").classList.remove("on");
  $("pf").classList.remove("on");
  document.body.classList.add("locked");
  $("lk-msg").textContent = "Kamu sudah keluar.";
  $("lk-in").focus();
});
for (const id of ["pf-hash", "pf-addr", "pf-pub"]) $(id).addEventListener("click", async () => {
  const t = $(id).textContent;
  if (!t || t === "-") return;
  await salin(t);
  $("pf-p").textContent = "Tersalin: " + t.slice(0, 12) + "…";
});
async function salin(text) {
  try { await navigator.clipboard.writeText(text); note("Tersalin"); return; } catch (e) {}
  const t = document.createElement("textarea"); // cadangan bila clipboard API ditolak
  t.value = text; document.body.appendChild(t); t.select();
  let okc = false; try { okc = document.execCommand("copy"); } catch (e) {}
  t.remove(); note(okc ? "Tersalin" : "Gagal menyalin");
}
$("cp").addEventListener("click", (e) => { e.preventDefault(); salin(current()); });
$("copy2").addEventListener("click", () => salin($("ta").value));
$("dl").addEventListener("click", (e) => {
  e.preventDefault();
  const url = URL.createObjectURL(new Blob([current()], { type: "text/html" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "sync.html";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$("imp").addEventListener("click", (e) => { e.preventDefault(); $("file").click(); });
$("file").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f || f.size > 500000) return;
  const v = await f.text();
  if (!ok(v)) return;
  if (await simpan(v)) render();
});

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
/*/PRO*/
