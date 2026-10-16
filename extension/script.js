const QUOTES = [
  { text: "Mulailah dari mana kamu berada, gunakan apa yang kamu punya.", author: "Arthur Ashe" },
  { text: "Langkah kecil setiap hari lebih baik daripada lompatan besar sesekali.", author: "Anonim" },
  { text: "Fokus pada kemajuan, bukan kesempurnaan.", author: "Anonim" },
  { text: "Kerjakan yang penting dulu, sisanya menyusul.", author: "Anonim" },
  { text: "Konsistensi mengalahkan intensitas.", author: "Anonim" },
];

const GRADIENTS = [
  ["#1e3c72", "#2a5298"],
  ["#134e5e", "#71b280"],
  ["#42275a", "#734b6d"],
  ["#232526", "#414345"],
  ["#0f2027", "#2c5364"],
];

const $ = (id) => document.getElementById(id);

// ---------- Jam, tanggal, sapaan ----------
function greetingFor(hour) {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function tick() {
  const now = new Date();
  $("clock").textContent = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
  $("date").textContent = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("greeting").textContent = greetingFor(now.getHours());
}

// ---------- Kutipan & latar (berganti per hari) ----------
function dayIndex() {
  return Math.floor(Date.now() / 86400000);
}

function initDaily() {
  const q = QUOTES[dayIndex() % QUOTES.length];
  $("quote-text").textContent = `“${q.text}”`;
  $("quote-author").textContent = q.author;

  const [a, b] = GRADIENTS[dayIndex() % GRADIENTS.length];
  document.body.style.background = `linear-gradient(135deg, ${a}, ${b})`;
  document.body.style.backgroundAttachment = "fixed";
}

// ---------- Todo (disimpan di chrome.storage.local) ----------
const store = {
  async get() {
    if (typeof chrome !== "undefined" && chrome.storage) {
      const r = await chrome.storage.local.get("todos");
      return r.todos || [];
    }
    return JSON.parse(localStorage.getItem("todos") || "[]");
  },
  async set(todos) {
    if (typeof chrome !== "undefined" && chrome.storage) {
      await chrome.storage.local.set({ todos });
    } else {
      localStorage.setItem("todos", JSON.stringify(todos));
    }
  },
};

let todos = [];

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
      await store.set(todos);
      render();
    });

    const text = document.createElement("span");
    text.textContent = t.text;

    const del = document.createElement("button");
    del.textContent = "×";
    del.title = "Hapus";
    del.addEventListener("click", async () => {
      todos.splice(i, 1);
      await store.set(todos);
      render();
    });

    li.append(check, text, del);
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
  await store.set(todos);
  render();
});

(async function init() {
  tick();
  setInterval(tick, 1000);
  initDaily();
  todos = await store.get();
  render();
})();
