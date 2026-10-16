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

const DEFAULT_SETTINGS = { nama: "", jam24: true, latar: "harian", warna: 0, gambar: "", tampilan: "board" };

// Tampilan Start dimuat di iframe agar alamat tab tetap newtab.html (kolom alamat Chrome tetap kosong)
window.addEventListener("message", (e) => {
  if (e.origin === location.origin && e.data && e.data.aistim === "board") location.reload();
});

function showStart() {
  const f = document.createElement("iframe");
  f.src = "icu.html";
  f.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0";
  document.body.replaceChildren(f);
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
let todos = [];

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

function applyBackground() {
  const b = document.body.style;
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

// ---------- Todo ----------
function msg(text) {
  const el = $("todo-msg");
  el.textContent = text;
  clearTimeout(msg.t);
  if (text) msg.t = setTimeout(() => (el.textContent = ""), 4000);
}

async function saveTodos() {
  await store.set("todos", todos);
}

function startEdit(li, i) {
  const span = li.querySelector("span");
  const input = document.createElement("input");
  input.type = "text";
  input.className = "edit";
  input.value = todos[i].text;
  input.maxLength = 300;
  span.replaceWith(input);
  input.focus();
  input.select();

  let selesai = false;
  const finish = async (simpan) => {
    if (selesai) return;
    selesai = true;
    const v = input.value.trim();
    if (simpan && v && v !== todos[i].text) {
      todos[i].text = v;
      await saveTodos();
    }
    render();
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    else if (e.key === "Escape") finish(false);
  });
  input.addEventListener("blur", () => finish(true));
}

function render() {
  const list = $("todo-list");
  list.textContent = "";
  todos.forEach((t, i) => {
    const li = document.createElement("li");
    if (t.done) li.className = "done";

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = t.done;
    check.addEventListener("change", async () => {
      todos[i].done = check.checked;
      await saveTodos();
      render();
    });

    const text = document.createElement("span");
    text.textContent = t.text;
    text.addEventListener("dblclick", () => startEdit(li, i));

    const edit = document.createElement("button");
    edit.textContent = "✎";
    edit.title = "Ubah";
    edit.addEventListener("click", () => startEdit(li, i));

    const del = document.createElement("button");
    del.textContent = "×";
    del.title = "Hapus";
    del.addEventListener("click", async () => {
      todos.splice(i, 1);
      await saveTodos();
      render();
    });

    li.append(check, text, edit, del);
    list.append(li);
  });
}

$("todo-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("todo-input");
  const text = input.value.trim();
  if (!text) return;
  todos.push({ text, done: false });
  input.value = "";
  await saveTodos();
  render();
});

$("btn-clear-done").addEventListener("click", async () => {
  const sisa = todos.filter((t) => !t.done);
  const n = todos.length - sisa.length;
  if (!n) return msg("Belum ada tugas yang selesai.");
  todos = sisa;
  await saveTodos();
  render();
  msg(n + " tugas selesai dihapus.");
});

// ---------- Ekspor / impor ----------
$("btn-export").addEventListener("click", () => {
  const data = { app: "aistim-board", versi: 1, diekspor: new Date().toISOString(), todos };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "aistim-board-tugas.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  msg("Diekspor: " + todos.length + " tugas.");
});

$("btn-import").addEventListener("click", () => $("file-import").click());

$("file-import").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error("Berkas terlalu besar.");
    const data = JSON.parse(await file.text());
    const arr = Array.isArray(data) ? data : data && data.todos;
    if (!Array.isArray(arr)) throw new Error("Format tidak dikenali.");
    const ada = new Set(todos.map((t) => t.text));
    let tambah = 0;
    arr.forEach((t) => {
      const text = t && typeof t.text === "string" ? t.text.trim().slice(0, 300) : "";
      if (!text || ada.has(text)) return;
      ada.add(text);
      todos.push({ text, done: !!t.done });
      tambah++;
    });
    await saveTodos();
    render();
    msg("Diimpor: " + tambah + " tugas baru (duplikat dilewati).");
  } catch (err) {
    msg("Gagal impor: " + err.message);
  }
});

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

$("btn-settings").addEventListener("click", () => {
  gambarBaru = null;
  $("set-view").value = settings.tampilan || "board";
  $("set-name").value = settings.nama || "";
  $("set-24h").checked = !!settings.jam24;
  $("set-bg").value = settings.latar;
  $("set-grad").value = String(settings.warna);
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
  applyBackground();
  tick();
});

(async function init() {
  const s = await store.get("settings", {});
  settings = { ...DEFAULT_SETTINGS, ...s };
  if (settings.tampilan === "start") return showStart();
  tick();
  setInterval(tick, 1000);
  initQuote();
  applyBackground();
  todos = await store.get("todos", []);
  render();
})();
