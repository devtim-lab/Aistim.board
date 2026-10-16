/* Aistim.sync: HTML diambil dari data/sync.html di GitHub (tanpa pasang ulang) dan disimpan untuk offline.
   Bisa juga diedit langsung di sini (tersimpan lokal), diunduh, atau diimpor dari berkas. Salinan lokal diutamakan.
   Ditampilkan di iframe sandbox: HTML dan CSS berjalan, skrip tidak. */
const URL_SYNC = "https://raw.githubusercontent.com/devtim-lab/Aistim.board/main/data/sync.html";
const DEFAULT_HTML = '<!doctype html><meta charset="utf-8"><body style="margin:0;height:100vh;display:grid;place-items:center;background:#0f172a;color:#fff;font-family:system-ui"><h1 style="font-weight:300;font-size:64px">Hallo</h1>';
const $ = (id) => document.getElementById(id);
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
  const r = await get("syncHtml");
  if (ok(r)) remote = r;
  const l = await get("syncLocal");
  if (ok(l)) local = l;
  render();
  try {
    const res = await fetch(URL_SYNC, { cache: "no-cache" });
    if (!res.ok) return;
    const h = await res.text();
    if (!ok(h) || h === remote) return;
    remote = h;
    await put({ syncHtml: h });
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
