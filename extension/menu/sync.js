/* Aistim.sync: HTML diambil dari data/sync.html di GitHub (tanpa pasang ulang) dan disimpan untuk offline.
   Bisa juga diedit langsung di sini (tersimpan lokal), diunduh, atau diimpor dari berkas. Salinan lokal diutamakan.
   Ditampilkan di iframe sandbox: HTML dan CSS berjalan, skrip tidak. */
const URL_SYNC = "https://raw.githubusercontent.com/devtim-lab/Aistim.board/main/data/sync.html";
const URL_SIG = URL_SYNC + ".sig";
const DEFAULT_HTML = '<!doctype html><meta charset="utf-8"><body style="margin:0;height:100vh;display:grid;place-items:center;background:#0f172a;color:#fff;font-family:system-ui"><h1 style="font-weight:300;font-size:64px">Hallo</h1>';
const $ = (id) => document.getElementById(id);
const GH = { owner: "devtim-lab", repo: "Aistim.board", path: "data/sync.html", branch: "main" };
const VIEW_ID = new URLSearchParams(location.search).get("id"); // ada = tampilan buatan sendiri (lokal saja)
const frame = $("v");
const ok = (h) => typeof h === "string" && h.length > 0 && h.length < 500000;
let remote = DEFAULT_HTML; // salinan GitHub / bawaan
let local = null; // salinan hasil edit di perangkat ini
const current = () => (ok(local) ? local : remote);

async function get(k) {
  try { return (await chrome.storage.local.get(k))[k]; } catch (e) { return undefined; }
}
async function put(o) {
  try { await chrome.storage.local.set(o); return true; } catch (e) { return false; }
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
