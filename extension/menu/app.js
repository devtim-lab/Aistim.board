/* Aistim Start: Alpine.js (build CSP) + Tailwind. Ubah tile di data/tiles.json (tanpa rilis). */
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
desk:'<rect x="3" y="4" width="18" height="12"/><path d="M8 20h8M12 16v4"/>',
card:'<rect x="3" y="6" width="18" height="13"/><path d="M3 10h18M6 15h4"/>',
car:'<path d="M5 16v-5l2-5h10l2 5v5M3 16h18M7 19v-3M17 19v-3M7 12h10"/>',
print:'<path d="M7 9V4h10v5M7 17H4V9h16v8h-3M7 14h10v6H7z"/>',
truck:'<path d="M2 6h11v11H2zM13 10h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
fb:'<path d="M14 8h3V4h-3a4 4 0 00-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>'
};
// ikon merek buatan sendiri: lencana putih membulat dengan gambar berwarna merek (tanpa gambar dari luar)
const B=(c,g)=>'<rect x="2" y="2" width="20" height="20" rx="6" fill="#fff" stroke="none"/><g stroke="'+c+'" stroke-width="2" fill="none">'+g+'</g>';
Object.assign(I,{
crm:B('#0097a7','<circle cx="10" cy="9.500" r="2.500"/><path d="M5.500 17.500c0-3 2-4.500 4.500-4.500s4.500 1.500 4.500 4.500zM15.500 12.300c2.300-.4 3.500 1 3.500 3.200"/>'),
erzap:B('#1c7de0','<path d="M16 7H9v10h7M9 12h5.500"/>'),
oto:B('#d9531e','<path d="M6 15v-3l1.500-3.500h9L18 12v3zM8 17.500V15M16 17.500V15M7 12h10"/>'),
shopee:B('#ee4d2d','<path d="M6.500 9h11l-.8 9H7.300zM9.500 9V8a2.500 2.500 0 015 0v1"/>'),
midtrans:B('#00518f','<path d="M6 17v-6a2 2 0 014 0v6M10 13a2 2 0 014 0v4M14 13a2 2 0 014 0v4"/>'),
imin:B('#6a3fc4','<path d="M8.500 10V6h7v4M8.500 15H6.500v-5h11v5h-2M8.500 13h7v5h-7z"/>'),
edbunt:B('#0f9d0f','<path d="M6 10l1-3.500h10L18 10M6 10a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0M7 12.500V18h10v-5.500"/>'),
logistik:B('#0f9aa3','<path d="M5.500 8h7v7h-7zM12.500 10.500h3l2 2.500v2h-5"/><circle cx="8.500" cy="16.500" r="1.300"/><circle cx="15" cy="16.500" r="1.300"/>'),
fb:B('#1877f2','<path d="M13.500 18v-5h2l.4-2.500h-2.400V9c0-.8.4-1.300 1.400-1.300h1.100V5.600c-.4 0-1.200-.1-2-.1-2 0-3 1.200-3 3.100v1.900H9v2.500h2v5z"/>')
});
const G0=[
 [ {n:'CRM',i:'crm',c:'#0097a7',w:2,href:'https://crm.aistim.icu'}, {n:'Erzap Trial',i:'erzap',c:'#1c7de0',w:2,href:'https://trial.erzap.com'}, {n:'Ototech',i:'oto',c:'#d9531e',w:2,href:'https://ototech.erzap.com'}, {n:'Shopee',i:'shopee',c:'#ee4d2d',w:2,href:'https://subaccount.shopee.com/shops'}, {n:'Midtrans',i:'midtrans',c:'#00518f',w:2,href:'https://dashboard.midtrans.com/'}, {n:'imin',i:'imin',c:'#6a3fc4',w:2,href:'https://kit.imin.sg/user/login'}, {n:'Edbunt',i:'edbunt',c:'#0f9d0f',w:2,href:'https://edbunt.com/'}, {n:'Logistik',i:'logistik',c:'#0f9aa3',w:2,href:'https://logistik.aistim.icu/login'}, {n:'Facebook',i:'fb',c:'#1877f2',w:2,href:'https://business.facebook.com/'} ]
];
const TILES_URL='https://raw.githubusercontent.com/devtim-lab/Aistim.board/main/data/tiles.json';
const SIG_URL=TILES_URL+'.sig';
const KEY='aistim-chat';
const okC=v=>typeof v==='string'&&/^#[0-9a-f]{3,8}$/i.test(v);
const okImg=v=>typeof v==='string'&&/^linear-gradient\([#0-9a-z%.,() -]+\)$/i.test(v);
const okN=v=>Number.isInteger(v)&&v>=1&&v<=6;
function valid(g){return Array.isArray(g)&&g.length&&g.length<=6&&g.every(x=>Array.isArray(x)&&x.length<=60&&x.every(t=>t&&typeof t.n==='string'&&t.n.length<=30&&okC(t.c)&&(t.i===undefined||I[t.i])&&(t.w===undefined||okN(t.w))&&(t.h===undefined||okN(t.h))&&(t.img===undefined||okImg(t.img))&&(t.href===undefined||/^https:\/\//.test(t.href))))}
const hm=t=>new Date(t).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
const BTN_OFF='grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-white/15 text-white hover:bg-white/25';
const BTN_ON='grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-[#6a3fc4] text-white hover:bg-[#7c52d6]';
const GROUP=['grid gap-1 auto-rows-[var(--u)] grid-cols-[repeat(6,var(--u))] shrink-0 md:grid-cols-[repeat(6,var(--u))]',
             'grid gap-1 auto-rows-[var(--u)] grid-cols-[repeat(6,var(--u))] shrink-0 md:grid-cols-[repeat(2,var(--u))]'];

document.addEventListener('alpine:init',()=>{
  Alpine.data('start',()=>({
    groups:G0, showChat:false, chatLabel:'Tampilkan chat', chatBtn:BTN_OFF, view:[], msgs:[], log:[], input:'', clock:'',
    async init(){
      try{const r=await chrome.storage.local.get('tilesV');if(valid(r.tilesV))this.groups=r.tilesV}catch(e){}
      this.setGroups(this.groups);
      try{this.log=JSON.parse(localStorage.getItem(KEY))||[]}catch(e){}
      if(!this.log.length)this.log=[{text:'Selamat datang di Aistim Chat!',me:false,t:Date.now()}];
      try{this.showChat=localStorage.getItem('aistim-chat-show')==='1'}catch(e){}
      this.chatLabel=this.showChat?'Sembunyikan chat':'Tampilkan chat';this.chatBtn=this.showChat?BTN_ON:BTN_OFF;
      this.sync();this.tick();setInterval(()=>this.tick(),10000);
      this.scroll();
      this.refresh();
    },
    async refresh(){
      try{
        const [res,sg]=await Promise.all([fetch(TILES_URL,{cache:'no-cache'}),fetch(SIG_URL,{cache:'no-cache'})]);
        if(!res.ok||!sg.ok)return;
        const buf=new Uint8Array(await res.arrayBuffer());
        if(!AistimVerify.cek('tiles.json',buf,await sg.text()))return; // tanda tangan admin tidak cocok: abaikan
        const g=JSON.parse(new TextDecoder().decode(buf));if(!valid(g)||JSON.stringify(g)===JSON.stringify(this.groups))return;
        try{await chrome.storage.local.set({tilesV:g})}catch(e){}
        this.setGroups(g);
      }catch(e){}
    },
    setGroups(g){
      this.groups=g;
      this.view=g.map((grp,gi)=>({cls:GROUP[gi===1?1:0],tiles:grp.map(t=>{
        let st='background:'+(t.img?t.img+','+t.c+';background-size:cover;background-position:center':t.c)+';';
        if(t.w)st+='grid-column:span '+t.w+';';
        if(t.h)st+='grid-row:span '+t.h+';';
        return {n:t.n,href:t.href||'#',target:t.href?'_blank':'_self',style:st,showIcon:!!t.i&&!t.img,icon:t.i?I[t.i]:''};
      })}));
    },
    sync(){this.msgs=this.log.map(m=>({text:m.text,cls:m.me?'self-end bg-[#0097a7]':'bg-white/20',meta:(m.me?'Anda':'Aistim')+' · '+hm(m.t)}))},
    save(){try{localStorage.setItem(KEY,JSON.stringify(this.log.slice(-100)))}catch(e){}},
    scroll(){this.$nextTick(()=>{const m=this.$refs.msgs;if(m)m.scrollTop=m.scrollHeight})},
    add(text,me){this.log.push({text,me,t:Date.now()});this.save();this.sync();this.scroll()},
    onInput(e){this.input=e.target.value},
    send(){
      const v=this.input.trim();if(!v)return;
      this.input='';this.$refs.inp.value='';this.add(v,true);
      setTimeout(()=>this.add(this.reply(v),false),500);
    },
    reply(q){q=q.toLowerCase();
      if(/halo|hai|^hi/.test(q))return'Halo! Ada yang bisa dibantu?';
      if(/jam|waktu/.test(q))return'Sekarang pukul '+hm(Date.now())+'.';
      if(/tanggal|hari/.test(q))return new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
      return'Pesan diterima. (Chat ini masih lokal, belum terhubung ke server.)'},
    toggleChat(){
      this.showChat=!this.showChat;
      this.chatLabel=this.showChat?'Sembunyikan chat':'Tampilkan chat';this.chatBtn=this.showChat?BTN_ON:BTN_OFF;
      try{localStorage.setItem('aistim-chat-show',this.showChat?'1':'0')}catch(e){}
      if(this.showChat)this.scroll();
    },
    clear(){this.log=[];this.save();this.sync()},
    wheel(e){
      if(e.target.closest('#msgs')||matchMedia('(max-width:767px)').matches)return;
      if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){this.$refs.main.scrollLeft+=e.deltaY;e.preventDefault()}
    },
    tick(){const n=new Date();this.clock=n.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})+' · '+n.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'})},
    async back(){
      try{const r=await chrome.storage.local.get('settings');await chrome.storage.local.set({settings:{...(r.settings||{}),tampilan:'board'}})}catch(x){}
      parent.postMessage({aistim:'board'},location.origin);
    },
  }));
});
