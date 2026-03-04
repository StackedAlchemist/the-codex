/* ============================================================
   QUEST LOG — Game Tracker JS
   IGDB API (via Twitch OAuth) · All platforms · localStorage
============================================================ */

/* ── State ── */
let log           = JSON.parse(localStorage.getItem("codex_games") || "[]");
let igdbClientId  = localStorage.getItem("igdb_client_id")     || "";
let igdbSecret    = localStorage.getItem("igdb_client_secret") || "";
let igdbToken     = localStorage.getItem("igdb_token")         || "";
let igdbTokenExp  = parseInt(localStorage.getItem("igdb_token_exp") || "0");
let currentGame   = null;
let currentRating = 0;
let currentStatus = "on-deck";
let logFilter     = "all";
let logSortBy     = "added";

/* ── Curated Picks ── */
const CURATED = [
  { name: "Elden Ring",               dev: "FromSoftware",        desc: "An open-world action RPG set in the Lands Between -- a collaboration between Miyazaki and George R.R. Martin. Brutal, beautiful, unforgettable.", tags: ["Action RPG","Open World","Souls-like","Fantasy"],    icon: "⚔️",  query: "Elden Ring" },
  { name: "Baldur's Gate 3",          dev: "Larian Studios",      desc: "A cinematic RPG of unprecedented depth. Every choice matters, every companion breathes, every playthrough reveals something new.", tags: ["RPG","Turn-Based","D&D","Co-op"],                    icon: "🎲",  query: "Baldurs Gate 3" },
  { name: "Civilization VI",          dev: "Firaxis Games",       desc: "Build an empire to stand the test of time. From ancient settlers to space-age dominance -- one more turn has never been more dangerous.", tags: ["Strategy","4X","Turn-Based","Historical"],          icon: "🏛️", query: "Civilization VI" },
  { name: "The Elder Scrolls V: Skyrim", dev: "Bethesda",         desc: "You are Dragonborn. Towering peaks, ancient dungeons, Norse-inspired mythology -- the RPG that defined a generation of open-world games.", tags: ["Open World","Action RPG","Fantasy","Exploration"], icon: "🐉",  query: "Skyrim" },
  { name: "The Witcher 3",            dev: "CD Projekt Red",      desc: "Geralt of Rivia hunts monsters across a vast morally complex world where every quest has weight and every choice echoes for hours.", tags: ["Open World","Action RPG","Dark Fantasy","Story"],  icon: "🐺",  query: "The Witcher 3" },
  { name: "Dark Souls III",           dev: "FromSoftware",        desc: "The culmination of the Dark Souls saga -- interconnected world design, punishing but fair combat, lore hidden in every item description.", tags: ["Action RPG","Souls-like","Challenging","Fantasy"], icon: "🕯️", query: "Dark Souls III" },
  { name: "Divinity: Original Sin 2", dev: "Larian Studios",      desc: "A tactical RPG masterpiece with remarkable co-op and a story about what it means to be a god -- or the thing that kills one.", tags: ["RPG","Turn-Based","Strategy","Fantasy"],            icon: "✨",  query: "Divinity Original Sin 2" },
  { name: "No Man's Sky",             dev: "Hello Games",         desc: "An infinite procedurally generated universe to explore, build, and survive. One of gaming's greatest redemption arcs -- now extraordinary.", tags: ["Open World","Sandbox","Exploration","Sci-Fi"],    icon: "🚀",  query: "No Mans Sky" },
  { name: "Starfield",                dev: "Bethesda",            desc: "Humanity's first steps into the stars. An open-world RPG across 1,000+ planets with Bethesda's signature exploration and storytelling.", tags: ["Open World","RPG","Sci-Fi","Exploration"],        icon: "⭐",  query: "Starfield" },
];

/* ── Upcoming ── */
const UPCOMING = [
  { title: "The Elder Scrolls VI",  dev: "Bethesda",              date: "TBA",       icon: "🏔️", desc: "The long-awaited sixth entry. Details remain scarce but anticipation is at an all-time high across all platforms." },
  { title: "Fable",                 dev: "Playground Games",      date: "2025",      icon: "🧚", desc: "A reimagining of the beloved British RPG series with a gorgeous open world and the franchise's signature wit." },
  { title: "Civilization VII",      dev: "Firaxis",               date: "Feb 2025",  icon: "🏛️", desc: "New age-based progression, revamped leaders, and the deepest 4X systems Firaxis has ever shipped." },
  { title: "Avowed",                dev: "Obsidian Entertainment", date: "Feb 2025", icon: "⚔️", desc: "First-person RPG in the Pillars of Eternity universe -- Obsidian's deep world-building meets visceral combat." },
  { title: "Monster Hunter Wilds",  dev: "Capcom",                date: "2025",      icon: "🦖", desc: "The next Monster Hunter with a living ecosystem across PS5, Xbox, and PC. The most ambitious Capcom world yet." },
  { title: "Path of Exile 2",       dev: "Grinding Gear Games",   date: "2025",      icon: "💀", desc: "A brutal action RPG sequel with a new campaign, revamped skill system, and the depth that made the original legendary." },
];

/* ── IGDB Token ── */
async function getIGDBToken() {
  if (igdbToken && Date.now() < igdbTokenExp - 60000) return igdbToken;
  if (!igdbClientId || !igdbSecret) return null;
  try {
    const res  = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${igdbClientId}&client_secret=${igdbSecret}&grant_type=client_credentials`,
      { method: "POST" }
    );
    const data = await res.json();
    if (!data.access_token) return null;
    igdbToken    = data.access_token;
    igdbTokenExp = Date.now() + (data.expires_in * 1000);
    localStorage.setItem("igdb_token",     igdbToken);
    localStorage.setItem("igdb_token_exp", String(igdbTokenExp));
    return igdbToken;
  } catch { return null; }
}

/* ── DOM refs ── */
const searchInput  = document.getElementById("gameSearch");
const searchBtn    = document.getElementById("searchBtn");
const searchResults= document.getElementById("searchResults");
const shelfGrid    = document.getElementById("shelfGrid");
const addGameBtn   = document.getElementById("addGameBtn");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose   = document.getElementById("modalClose");
const modalSave    = document.getElementById("modalSave");
const modalDelete  = document.getElementById("modalDelete");
const curatedGrid  = document.getElementById("curatedGrid");
const upcomingGrid = document.getElementById("upcomingGrid");
const apiClientId  = document.getElementById("apiClientId");
const apiClientSec = document.getElementById("apiClientSecret");
const apiKeySave   = document.getElementById("apiKeySave");
const apiStatus    = document.getElementById("apiStatus");

/* ── Cursor ── */
const dot = document.getElementById("cursorDot");
const ring= document.getElementById("cursorRing");
let mx=0,my=0,rx=0,ry=0;
document.addEventListener("mousemove", e=>{ mx=e.clientX; my=e.clientY; });
(function ac(){
  rx+=(mx-rx)*.1; ry+=(my-ry)*.1;
  if(dot){ dot.style.left=mx+"px"; dot.style.top=my+"px"; }
  if(ring){ ring.style.left=rx+"px"; ring.style.top=ry+"px"; }
  requestAnimationFrame(ac);
})();

/* ── Init ── */
document.addEventListener("DOMContentLoaded", ()=>{
  if(igdbClientId) apiClientId.value = igdbClientId;
  if(igdbSecret)   apiClientSec.value= igdbSecret;
  if(igdbToken && Date.now() < igdbTokenExp - 60000) setApiStatus(true);
  renderStats(); renderLog(); renderCurated(); renderUpcoming(); bindEvents();
});

/* ── Events ── */
function bindEvents(){
  searchBtn.addEventListener("click", doSearch);
  searchInput.addEventListener("keydown", e=>{ if(e.key==="Enter") doSearch(); });

  document.querySelectorAll(".qs-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{ searchInput.value=btn.dataset.q; doSearch(); });
  });

  apiKeySave.addEventListener("click", async()=>{
    igdbClientId = apiClientId.value.trim();
    igdbSecret   = apiClientSec.value.trim();
    if(!igdbClientId || !igdbSecret){ setApiStatus(false,"Enter both fields"); return; }
    localStorage.setItem("igdb_client_id", igdbClientId);
    localStorage.setItem("igdb_client_secret", igdbSecret);
    igdbToken=""; igdbTokenExp=0;
    localStorage.removeItem("igdb_token"); localStorage.removeItem("igdb_token_exp");
    apiKeySave.textContent="Connecting…";
    const token = await getIGDBToken();
    apiKeySave.textContent="Save & Connect";
    setApiStatus(!!token, token ? "" : "Invalid credentials — check your Client ID and Secret");
  });

  document.querySelectorAll(".sf-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".sf-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active"); logFilter=btn.dataset.filter; renderLog();
    });
  });

  document.getElementById("shelfSort").addEventListener("change", e=>{ logSortBy=e.target.value; renderLog(); });

  addGameBtn.addEventListener("click",()=>openModal(null));
  modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", e=>{ if(e.target===modalOverlay) closeModal(); });
  modalSave.addEventListener("click", saveGame);
  modalDelete.addEventListener("click", deleteGame);

  document.querySelectorAll(".status-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".status-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active"); currentStatus=btn.dataset.status;
    });
  });

  document.querySelectorAll(".star").forEach(star=>{
    star.addEventListener("click",      ()=>{ currentRating=parseInt(star.dataset.val); updateStars(currentRating); });
    star.addEventListener("mouseenter", ()=>updateStars(parseInt(star.dataset.val)));
    star.addEventListener("mouseleave", ()=>updateStars(currentRating));
  });
}

function setApiStatus(ok, msg=""){
  if(!apiStatus) return;
  apiStatus.className="api-status "+(ok?"ok":"err");
  apiStatus.textContent=ok?"✓ Connected to IGDB":(msg||"✕ Connection failed");
}

/* ── IGDB Search ── */
async function doSearch(){
  const q=searchInput.value.trim(); if(!q) return;
  searchResults.classList.remove("hidden");
  const token=await getIGDBToken();
  if(!token){
    searchResults.innerHTML=`<div class="search-loading">🔑 Enter your Twitch Client ID + Secret above.<br><br>Register free at <a href="https://dev.twitch.tv/console" target="_blank" style="color:var(--teal)">dev.twitch.tv/console</a> — covers PS5, Xbox, Nintendo & PC.</div>`;
    return;
  }
  searchResults.innerHTML=`<div class="search-loading">Scanning all platforms…</div>`;
  try {
    const body=`search "${q}"; fields name,cover.url,first_release_date,genres.name,rating,platforms.name,summary; limit 12;`;
    const res=await fetch("https://igdb-proxy.stackedalchemist.workers.dev/games",{
      method:"POST",
      headers:{ "Client-ID":igdbClientId, "Authorization":`Bearer ${token}`, "Content-Type":"text/plain" },
      body
    });
    const games=await res.json();
    if(!Array.isArray(games)) throw new Error("Unexpected response");
    renderResults(games);
  } catch(e) {
    searchResults.innerHTML=`<div class="search-loading">
      Search failed — check your credentials are saved correctly and try again.<br><br>
      <em style="font-size:.72em;opacity:.55">Error: ${e.message}</em>
    </div>`;
  }
}

function renderResults(games){
  if(!games.length){ searchResults.innerHTML=`<div class="search-loading">No results found.</div>`; return; }
  searchResults.innerHTML=games.map(g=>{
    const title    = g.name||"Unknown";
    const year     = g.first_release_date ? new Date(g.first_release_date*1000).getFullYear() : "";
    const rating   = g.rating ? `★ ${(g.rating/20).toFixed(1)}` : "";
    const genres   = (g.genres||[]).slice(0,2).map(x=>x.name).join(" · ");
    const platforms= (g.platforms||[]).slice(0,3).map(p=>p.name).join(", ");
    const rawCover = g.cover?.url||"";
    const cover    = rawCover ? rawCover.replace("t_thumb","t_cover_big").replace("//","https://") : "";
    const onLog    = log.some(x=>x.id===g.id);
    const coverHtml= cover
      ? `<img src="${escHtml(cover)}" alt="${escHtml(title)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=rc-no-cover>🎮</span>'" />`
      : `<span class="rc-no-cover">🎮</span>`;
    return `<div class="result-card">
      <div class="rc-cover">${coverHtml}</div>
      <div class="rc-title">${escHtml(title)}</div>
      <div class="rc-meta">${[year,genres].filter(Boolean).join(" · ")}</div>
      ${platforms?`<div class="rc-meta" style="font-size:.58rem;opacity:.65">${escHtml(platforms)}</div>`:""}
      ${rating?`<div class="rc-rating">${rating}</div>`:""}
      <button class="rc-add-btn ${onLog?"on-log":""}" data-id="${g.id}" data-title="${escHtml(title)}" data-cover="${escHtml(cover)}" data-genres="${escHtml(genres)}" data-platforms="${escHtml(platforms)}" data-year="${year}">
        ${onLog?"✓ In Log":"+ Add to Log"}
      </button></div>`;
  }).join("");

  searchResults.querySelectorAll(".rc-add-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id=parseInt(btn.dataset.id);
      const inLog=btn.classList.contains("on-log");
      if(inLog){ const g=log.find(x=>x.id===id); if(g) openModal(g); return; }
      openModal({ id, title:btn.dataset.title, cover:btn.dataset.cover, genres:btn.dataset.genres, platforms:btn.dataset.platforms, year:btn.dataset.year });
    });
  });
}

/* ── Modal ── */
function openModal(game){
  currentGame=game; currentRating=game?.rating||0; currentStatus=game?.status||"on-deck";
  document.getElementById("modalTitle").textContent=game?.title||"Add Game";
  document.getElementById("modalMeta").textContent=[game?.platforms,game?.genres,game?.year].filter(Boolean).join(" · ");
  document.getElementById("modalNotes").value=game?.notes||"";
  document.getElementById("modalHours").value=game?.hours||"";
  const cover=document.getElementById("modalCover");
  cover.innerHTML=game?.cover?`<img src="${escHtml(game.cover)}" alt="" style="width:100%;height:100%;object-fit:cover"/>`:"🎮";
  document.querySelectorAll(".status-btn").forEach(b=>b.classList.toggle("active",b.dataset.status===currentStatus));
  updateStars(currentRating);
  const inLog=game&&log.some(g=>g.id===game.id);
  modalDelete.classList.toggle("hidden",!inLog);
  modalSave.textContent=inLog?"Update Log":"Save to Log";
  modalOverlay.classList.remove("hidden");
}

function closeModal(){ modalOverlay.classList.add("hidden"); currentGame=null; }
function updateStars(val){ document.querySelectorAll(".star").forEach((s,i)=>s.classList.toggle("active",i<val)); }

function saveGame(){
  const title=currentGame?.title||document.getElementById("modalTitle").textContent||"Untitled";
  const existIdx=log.findIndex(g=>g.id===(currentGame?.id));
  const entry={
    id:       currentGame?.id||Date.now(),
    title, cover:currentGame?.cover||"", genres:currentGame?.genres||"",
    platforms:currentGame?.platforms||"", year:currentGame?.year||"",
    status:currentStatus, rating:currentRating,
    notes:document.getElementById("modalNotes").value,
    hours:document.getElementById("modalHours").value,
    addedAt:existIdx>=0?log[existIdx].addedAt:Date.now()
  };
  if(existIdx>=0) log[existIdx]=entry; else log.unshift(entry);
  persist(); closeModal(); renderLog(); renderStats();
}

function deleteGame(){
  if(!currentGame) return;
  log=log.filter(g=>g.id!==currentGame.id);
  persist(); closeModal(); renderLog(); renderStats();
}

function persist(){ localStorage.setItem("codex_games",JSON.stringify(log)); }

/* ── Render Log ── */
function renderLog(){
  let games=[...log];
  if(logFilter!=="all") games=games.filter(g=>g.status===logFilter);
  switch(logSortBy){
    case "title":  games.sort((a,b)=>a.title.localeCompare(b.title)); break;
    case "genre":  games.sort((a,b)=>(a.genres||"").localeCompare(b.genres||"")); break;
    case "rating": games.sort((a,b)=>(b.rating||0)-(a.rating||0)); break;
    default:       games.sort((a,b)=>b.addedAt-a.addedAt);
  }
  if(!games.length){
    shelfGrid.innerHTML=`<div class="empty-shelf"><span class="empty-rune">🎮</span><p>${logFilter==="all"?"Your quest log is empty. Search for a game or use + Add Game.":"No games with this status."}</p></div>`;
    return;
  }
  shelfGrid.innerHTML=games.map(g=>{
    const stars=renderStarString(g.rating||0,5);
    const coverHtml=g.cover
      ?`<img src="${escHtml(g.cover)}" alt="${escHtml(g.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=sc-no-cover>🎮</span>'" />`
      :`<span class="sc-no-cover">🎮</span>`;
    return `<div class="shelf-card" data-id="${g.id}">
      <div class="sc-cover">${coverHtml}<span class="sc-status-badge ${g.status}">${statusLabel(g.status)}</span></div>
      <div class="sc-info">
        <div class="sc-title">${escHtml(g.title)}</div>
        <div class="sc-meta">${escHtml(g.genres||"")}${g.hours?" · "+g.hours+"h":""}</div>
        <div class="sc-stars">${stars}</div>
      </div></div>`;
  }).join("");
  shelfGrid.querySelectorAll(".shelf-card").forEach(card=>{
    card.addEventListener("click",()=>{ const g=log.find(x=>String(x.id)===String(card.dataset.id)); if(g) openModal(g); });
  });
}

function renderStarString(r,max){ return Array.from({length:max},(_,i)=>`<span class="${i<r?"":"empty-star"}">★</span>`).join(""); }
function statusLabel(s){ return {"in-progress":"In Progress","on-deck":"On Deck","conquered":"Conquered","left-behind":"Left Behind"}[s]||s; }

/* ── Stats ── */
function renderStats(){
  document.getElementById("statTotal").textContent     =log.length;
  document.getElementById("statConquered").textContent =log.filter(g=>g.status==="conquered").length;
  document.getElementById("statProgress").textContent  =log.filter(g=>g.status==="in-progress").length;
  document.getElementById("statDeck").textContent      =log.filter(g=>g.status==="on-deck").length;
  document.getElementById("statLeft").textContent      =log.filter(g=>g.status==="left-behind").length;
}

/* ── Curated ── */
function renderCurated(){
  curatedGrid.innerHTML=CURATED.map(g=>`
    <div class="series-card">
      <div class="sc-series-name">${g.icon} ${g.name}</div>
      <div class="sc-series-dev">${g.dev}</div>
      <div class="sc-series-desc">${g.desc}</div>
      <div class="sc-series-tags">${g.tags.map(t=>`<span class="sc-series-tag">${t}</span>`).join("")}</div>
      <button class="sc-series-btn" data-q="${escHtml(g.query)}">Search & Add →</button>
    </div>`).join("");
  curatedGrid.querySelectorAll(".sc-series-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{ searchInput.value=btn.dataset.q; doSearch(); searchInput.scrollIntoView({behavior:"smooth",block:"center"}); });
  });
}

/* ── Upcoming ── */
function renderUpcoming(){
  upcomingGrid.innerHTML=UPCOMING.map(u=>`
    <div class="upcoming-card">
      <div class="uc-icon">${u.icon}</div>
      <div class="uc-body">
        <div class="uc-title">${u.title}</div>
        <div class="uc-dev">${u.dev}</div>
        <div class="uc-date">${u.date}</div>
        <div class="uc-desc">${u.desc}</div>
      </div></div>`).join("");
}

/* ── Util ── */
function escHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
