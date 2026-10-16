/* Ubah daftar tile di sini. w/h = lebar/tinggi (satuan kotak), href = tujuan klik. */
const I={
mail:'<rect x="3" y="6" width="18" height="12"/><path d="M3 7l9 7 9-7"/>',
cal:'<rect x="4" y="5" width="16" height="15"/><path d="M4 9h16M8 3v4M16 3v4M8 13h2M12 13h2M16 13h1M8 16h2M12 16h2"/>',
ie:'<path d="M18 12H8a4 4 0 008 2M7 14c-2 5 3 7 10 3M17 8c2-5-3-6-9-2-4 3-5 8-2 12"/>',
store:'<path d="M5 8h14l-1 11H6zM9 8a3 3 0 016 0"/>',
people:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-5 3-7 6-7s6 2 6 7zM15 14c4-1 6 1 6 5h-4"/>',
photo:'<rect x="3" y="5" width="18" height="14"/><path d="M3 17l5-6 4 4 3-3 6 5"/><circle cx="16" cy="9" r="1.5"/>',
map:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>',
cloud:'<path d="M7 18a4 4 0 010-8 5 5 0 019-1 4.500 4.500 0 011 9z"/>',
msg:'<path d="M4 5h16v11H11l-4 4v-4H4z"/><path d="M9 9v2M15 9v2M9 13c2 1 4 1 6 0"/>',
chart:'<path d="M4 20V10M10 20V6M16 20v-8M3 20h18M5 8l5-4 6 5 4-3"/>',
trophy:'<path d="M8 4h8v6a4 4 0 01-8 0zM8 6H4c0 4 2 5 4 5M16 6h4c0 4-2 5-4 5M12 14v4M8 20h8"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
news:'<rect x="4" y="5" width="16" height="14"/><path d="M8 9h8M8 12h8M8 15h5"/>',
bag:'<rect x="4" y="8" width="16" height="11"/><path d="M9 8V5h6v3M4 13h16"/>',
pad:'<path d="M7 7h10c3 0 5 8 4 11-1 2-3 1-4-1l-1-2H8l-1 2c-1 2-3 3-4 1-1-3 1-11 4-11zM8 11h3M9.500 9.500v3"/>',
cam:'<path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.500"/>',
head:'<path d="M5 15v-3a7 7 0 0114 0v3"/><rect x="4" y="14" width="4" height="6"/><rect x="16" y="14" width="4" height="6"/>',
video:'<rect x="3" y="5" width="18" height="14"/><path d="M10 9l5 3-5 3z"/>',
desk:'<rect x="3" y="4" width="18" height="12"/><path d="M8 20h8M12 16v4"/>'
};
const G=[
 [ {n:'Mail',i:'mail',c:'#0097a7',w:2}, {n:'Kalender',i:'cal',c:'#6a3fc4',w:2}, {n:'Browser',i:'ie',c:'#1c7de0',href:'https://www.bing.com'}, {n:'Store',i:'store',c:'#0f9d0f'},
   {n:'Kontak',i:'people',c:'#d9531e',w:2}, {n:'Foto',i:'photo',c:'#0f9aa3',w:2}, {n:'Peta',i:'map',c:'#8a1fa6'}, {n:'Cloud',i:'cloud',c:'#1b62c9'},
   {n:'Pesan',i:'msg',c:'#a512a5',w:2}, {n:'Keuangan',i:'chart',c:'#0f9d0f',w:2}, {n:'Olahraga',i:'trophy',c:'#6a3fc4',w:2},
   {n:'Desktop',i:'desk',c:'#3a8fd8',w:2,img:'linear-gradient(135deg,#6fb4ee,#e8f4ff 50%,#4a9be0)'}, {n:'Cuaca',i:'sun',c:'#2b8cf0',w:2}, {n:'Berita',i:'news',c:'#c2183e',w:2} ],
 [ {n:'Bing',c:'#9a7d2c',w:2,img:'linear-gradient(#b8c46a,#6f8b2f 55%,#d7a43a)',cls:'photo'}, {n:'Perjalanan',i:'bag',c:'#0f9aa3',w:2},
   {n:'Game',i:'pad',c:'#0f9d0f'}, {n:'Kamera',i:'cam',c:'#a512a5'}, {n:'Musik',i:'head',c:'#d9531e'}, {n:'Video',i:'video',c:'#c2183e'} ]
];
const root=document.getElementById('start');
G.forEach((g,gi)=>{
  const d=document.createElement('div');d.className='group '+(gi?'g2':'g1');
  g.forEach(t=>{
    const a=document.createElement('a');a.className='tile'+(t.img?' photo':'');
    a.style.setProperty('--c',t.c);if(t.w)a.style.setProperty('--w',t.w);if(t.h)a.style.setProperty('--h',t.h);
    if(t.img)a.style.setProperty('--img',t.img);
    if(t.href){a.href=t.href;a.target='_blank';a.rel='noopener'}
    a.innerHTML=(t.i?`<svg viewBox="0 0 24 24">${I[t.i]}</svg>`:'')+`<span>${t.n}</span>`;
    d.appendChild(a);
  });
  root.insertBefore(d,document.getElementById("chat"));
});
/* Chat: tersimpan di browser (localStorage), balasan otomatis sederhana. Belum terhubung ke server. */
const msgs=document.getElementById('msgs'),ci=document.getElementById('ci'),KEY='aistim-chat';
let log=[];try{log=JSON.parse(localStorage.getItem(KEY))||[]}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(log.slice(-100)))}catch(e){}};
const hm=t=>new Date(t).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
function show(m){const d=document.createElement('div');d.className='m'+(m.me?' me':'');
  d.textContent=m.text;const s=document.createElement('small');s.textContent=(m.me?'Anda':'Aistim')+' · '+hm(m.t);d.appendChild(s);
  msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight}
function add(text,me){const m={text,me,t:Date.now()};log.push(m);save();show(m)}
function reply(q){q=q.toLowerCase();
  if(/halo|hai|^hi/.test(q))return'Halo! Ada yang bisa dibantu?';
  if(/jam|waktu/.test(q))return'Sekarang pukul '+hm(Date.now())+'.';
  if(/tanggal|hari/.test(q))return new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  return'Pesan diterima. (Chat ini masih lokal, belum terhubung ke server.)'}
if(!log.length)log.push({text:'Selamat datang di Aistim Chat!',me:false,t:Date.now()});
log.forEach(show);
document.getElementById('cf').addEventListener('submit',e=>{e.preventDefault();const v=ci.value.trim();if(!v)return;
  ci.value='';add(v,true);setTimeout(()=>add(reply(v),false),500)});
document.getElementById('clr').addEventListener('click',()=>{log=[];save();msgs.innerHTML=''});
/* scroll roda mouse -> horizontal, seperti layar Start Windows 8 */
root.addEventListener('wheel',e=>{if(e.target.closest('#msgs')||matchMedia('(max-width:800px)').matches)return;if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){root.scrollLeft+=e.deltaY;e.preventDefault()}},{passive:false});
const clock=document.getElementById('clock');
(function t(){const n=new Date();clock.innerHTML=n.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})+'<br>'+n.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'});setTimeout(t,10000)})();
/* Aistim Board: tombol kembali ke tampilan Board */
document.getElementById('back').addEventListener('click',async e=>{e.preventDefault();
  try{const r=await chrome.storage.local.get('settings');await chrome.storage.local.set({settings:{...(r.settings||{}),tampilan:'board'}})}catch(x){}
  location.href='newtab.html'});
