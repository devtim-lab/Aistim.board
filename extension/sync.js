/* Aistim.sync: isi halaman diambil dari data/sync.html di GitHub (tanpa pasang ulang), disimpan untuk offline.
   Ditampilkan di iframe sandbox: HTML dan CSS berjalan, skrip tidak. */
const URL_SYNC = "https://raw.githubusercontent.com/devtim-lab/Aistim.board/main/data/sync.html";
const DEFAULT_HTML = '<!doctype html><meta charset="utf-8"><body style="margin:0;height:100vh;display:grid;place-items:center;background:#0f172a;color:#fff;font-family:system-ui"><h1 style="font-weight:300;font-size:64px">Hallo</h1>';
const frame = document.getElementById("v");
const ok = (h) => typeof h === "string" && h.length > 0 && h.length < 500000;

(async function () {
  let html = DEFAULT_HTML;
  try {
    const r = await chrome.storage.local.get("syncHtml");
    if (ok(r.syncHtml)) html = r.syncHtml;
  } catch (e) {}
  frame.srcdoc = html;
  try {
    const res = await fetch(URL_SYNC, { cache: "no-cache" });
    if (!res.ok) return;
    const h = await res.text();
    if (!ok(h) || h === html) return;
    try { await chrome.storage.local.set({ syncHtml: h }); } catch (e) {}
    frame.srcdoc = h;
  } catch (e) {}
})();

document.getElementById("back").addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    const r = await chrome.storage.local.get("settings");
    await chrome.storage.local.set({ settings: { ...(r.settings || {}), tampilan: "board" } });
  } catch (x) {}
  parent.postMessage({ aistim: "board" }, location.origin);
});
