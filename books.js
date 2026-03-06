/* ============================================================
   TOME KEEPER — Book Tracker JS
   Open Library API · localStorage shelf · No API key needed
============================================================ */

/* ── State ── */
let shelf       = JSON.parse(localStorage.getItem("codex_books") || "[]");
let currentBook = null;   // book being added/edited in modal
let currentRating = 0;
let currentStatus = "on-deck";
let shelfFilter = "all";
let shelfSortBy = "added";

/* ── Curated Series ── */
const FEATURED_SERIES = [
  {
    name: "The Stormlight Archive",
    author: "Brandon Sanderson",
    desc: "An epic fantasy series set on the storm-ravaged world of Roshar. Knights Radiant, ancient spren, and the secret of the Voidbringers -- Sanderson's magnum opus.",
    tags: ["Epic Fantasy", "Cosmere", "Magic Systems", "War"],
    icon: "⚡",
    query: "Stormlight Archive Brandon Sanderson"
  },
  {
    name: "Mistborn",
    author: "Brandon Sanderson",
    desc: "What if the prophesied hero failed? A world of ash and mist, where allomancers swallow metals to fuel extraordinary powers and a thousand-year empire must fall.",
    tags: ["Epic Fantasy", "Cosmere", "Heist", "Magic Systems"],
    icon: "🌫",
    query: "Mistborn Brandon Sanderson"
  },
  {
    name: "The Ripple System",
    author: "Kyle Kirrin",
    desc: "Corporate burnout Ned Altimer enters a brutal LitRPG world where grinding levels, shadeslinging abilities, and survival instinct are all that stand between him and death.",
    tags: ["LitRPG", "GameLit", "Fantasy", "Progression"],
    icon: "🎮",
    query: "Shadeslinger Kyle Kirrin"
  },
  {
    name: "Expeditionary Force",
    author: "Craig Alanson",
    desc: "Sergeant Joe Bishop gets pulled into an interstellar war alongside a rogue AI named Skippy who might be the most powerful -- and most insufferable -- being in the galaxy.",
    tags: ["Military Sci-Fi", "Space Opera", "Humor", "Action"],
    icon: "🚀",
    query: "Expeditionary Force Craig Alanson"
  },
  {
    name: "The Hunger Games",
    author: "Suzanne Collins",
    desc: "In the ruins of North America, twelve districts send two tributes each to fight to the death on live television. Katniss Everdeen volunteers for her sister -- and changes everything.",
    tags: ["Dystopian", "YA", "Action", "Survival"],
    icon: "🏹",
    query: "Hunger Games Suzanne Collins"
  },
  {
    name: "The Cosmere Universe",
    author: "Brandon Sanderson",
    desc: "An interconnected universe spanning dozens of worlds, where Shards of Adonalsium shape reality and a mysterious figure called Hoid walks between every story.",
    tags: ["Epic Fantasy", "Connected Universe", "World-Building"],
    icon: "🌌",
    query: "Cosmere Brandon Sanderson"
  }
];

/* ── Curated Upcoming ── */
const UPCOMING_BOOKS = [
  { title: "Wind and Truth",          author: "Brandon Sanderson", date: "Out Now",        icon: "⚡", desc: "Book Five of the Stormlight Archive. The first arc of the saga reaches its conclusion." },
  { title: "Sunlit Man",              author: "Brandon Sanderson", date: "Out Now",        icon: "☀️", desc: "A standalone Cosmere novel featuring Nomad, a man who must keep moving or burn." },
  { title: "Shadeslinger Book 7",     author: "Kyle Kirrin",       date: "TBA 2025",       icon: "🎮", desc: "The Ripple System continues as Ned pushes deeper into increasingly deadly territory." },
  { title: "Columbus Day (new ed.)",  author: "Craig Alanson",     date: "Available",      icon: "🚀", desc: "The Expeditionary Force saga that started it all -- humanity's first brutal contact." },
  { title: "Elantris (Reread pick)",  author: "Brandon Sanderson", date: "Cosmere Entry",  icon: "✨", desc: "Sanderson's debut novel -- a city of the damned and a prince who should be dead." },
  { title: "The Final Empire",        author: "Brandon Sanderson", date: "Cosmere Entry",  icon: "🌫", desc: "Mistborn Book 1 -- where a thousand-year empire of ash meets its first real challenge." },
];

/* ── DOM ── */
const searchInput   = document.getElementById("bookSearch");
const searchBtn     = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");
const shelfGrid     = document.getElementById("shelfGrid");
const emptyShelf    = document.getElementById("emptyShelf");
const addBookBtn    = document.getElementById("addBookBtn");
const modalOverlay  = document.getElementById("modalOverlay");
const modalClose    = document.getElementById("modalClose");
const modalSave     = document.getElementById("modalSave");
const modalDelete   = document.getElementById("modalDelete");
const seriesGrid    = document.getElementById("seriesGrid");
const upcomingGrid  = document.getElementById("upcomingGrid");

/* ── Cursor ── */
const dot = document.getElementById("cursorDot");
const ring = document.getElementById("cursorRing");
let mx=0,my=0,rx=0,ry=0;
document.addEventListener("mousemove", e => { mx=e.clientX; my=e.clientY; });
(function ac(){ rx+=(mx-rx)*.1; ry+=(my-ry)*.1;
  if(dot){dot.style.left=mx+"px";dot.style.top=my+"px";}
  if(ring){ring.style.left=rx+"px";ring.style.top=ry+"px";}
  requestAnimationFrame(ac);
})();

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
  renderStats();
  renderShelf();
  renderSeries();
  renderUpcoming();
  bindEvents();
});

/* ── Events ── */
function bindEvents() {
  searchBtn.addEventListener("click", doSearch);
  searchInput.addEventListener("keydown", e => { if(e.key==="Enter") doSearch(); });

  document.querySelectorAll(".qs-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      searchInput.value = btn.dataset.q;
      doSearch();
    });
  });

  document.querySelectorAll(".sf-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sf-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      shelfFilter = btn.dataset.filter;
      renderShelf();
    });
  });

  document.getElementById("shelfSort").addEventListener("change", e => {
    shelfSortBy = e.target.value;
    renderShelf();
  });

  addBookBtn.addEventListener("click", () => openModal(null));
  modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", e => { if(e.target === modalOverlay) closeModal(); });
  modalSave.addEventListener("click", saveBook);
  modalDelete.addEventListener("click", deleteBook);

  // Status buttons in modal
  document.querySelectorAll(".status-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".status-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentStatus = btn.dataset.status;
    });
  });

  // Star rating
  document.querySelectorAll(".star").forEach(star => {
    star.addEventListener("click", () => {
      currentRating = parseInt(star.dataset.val);
      updateStars(currentRating);
    });
    star.addEventListener("mouseenter", () => updateStars(parseInt(star.dataset.val)));
    star.addEventListener("mouseleave", () => updateStars(currentRating));
  });
}

/* ── Open Library Search ── */
async function doSearch() {
  const q = searchInput.value.trim();
  if (!q) return;
  searchResults.classList.remove("hidden");
  searchResults.innerHTML = `<div class="search-loading">Searching the archives…</div>`;
  try {
    const res  = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12&fields=key,title,author_name,first_publish_year,cover_i,isbn`);
    const data = await res.json();
    renderResults(data.docs || []);
  } catch {
    searchResults.innerHTML = `<div class="search-loading">Search failed — check your connection.</div>`;
  }
}

function renderResults(docs) {
  if (!docs.length) {
    searchResults.innerHTML = `<div class="search-loading">No results found. Try a different query.</div>`;
    return;
  }
  searchResults.innerHTML = docs.map(doc => {
    const title   = doc.title || "Unknown Title";
    const author  = (doc.author_name || ["Unknown"])[0];
    const year    = doc.first_publish_year || "";
    const cover   = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null;
    const onShelf = shelf.some(b => b.key === doc.key);
    const coverHtml = cover
      ? `<img src="${cover}" alt="${title}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=rc-no-cover>📖</span>'" />`
      : `<span class="rc-no-cover">📖</span>`;
    return `
      <div class="result-card" data-key="${doc.key}">
        <div class="rc-cover">${coverHtml}</div>
        <div class="rc-title">${title}</div>
        <div class="rc-author">${author}</div>
        ${year ? `<div class="rc-year">${year}</div>` : ""}
        <button class="rc-add-btn ${onShelf ? "on-shelf" : ""}" data-key="${doc.key}" data-title="${escHtml(title)}" data-author="${escHtml(author)}" data-cover="${cover||""}" data-year="${year}">
          ${onShelf ? "✓ On Shelf" : "+ Add to Shelf"}
        </button>
      </div>
    `;
  }).join("");

  searchResults.querySelectorAll(".rc-add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("on-shelf")) {
        const book = shelf.find(b => b.key === btn.dataset.key);
        if (book) openModal(book);
        return;
      }
      openModal({
        key:    btn.dataset.key,
        title:  btn.dataset.title,
        author: btn.dataset.author,
        cover:  btn.dataset.cover,
        year:   btn.dataset.year
      });
    });
  });
}

/* ── Modal ── */
function openModal(book) {
  currentBook   = book;
  currentRating = book?.rating || 0;
  currentStatus = book?.status || "on-deck";

  document.getElementById("modalTitle").textContent  = book?.title  || "Add Book Manually";
  document.getElementById("modalAuthor").textContent = book?.author || "";
  document.getElementById("modalNotes").value        = book?.notes  || "";
  document.getElementById("modalPage").value         = book?.page   || "";

  const cover = document.getElementById("modalCover");
  if (book?.cover) {
    cover.innerHTML = `<img src="${book.cover}" alt="${book.title}" style="width:100%;height:100%;object-fit:cover" />`;
  } else {
    cover.innerHTML = "📖";
  }

  // Status
  document.querySelectorAll(".status-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.status === currentStatus);
  });

  updateStars(currentRating);

  // Show/hide delete
  const isOnShelf = book && shelf.some(b => b.key === book.key);
  modalDelete.classList.toggle("hidden", !isOnShelf);
  modalSave.textContent = isOnShelf ? "Update Shelf" : "Save to Shelf";

  modalOverlay.classList.remove("hidden");
}

function closeModal() { modalOverlay.classList.add("hidden"); currentBook = null; }

function updateStars(val) {
  document.querySelectorAll(".star").forEach((s, i) => {
    s.classList.toggle("active", i < val);
  });
}

function saveBook() {
  if (!currentBook) return;
  const existing = shelf.findIndex(b => b.key === currentBook.key);
  const entry = {
    ...currentBook,
    status:  currentStatus,
    rating:  currentRating,
    notes:   document.getElementById("modalNotes").value,
    page:    document.getElementById("modalPage").value,
    addedAt: existing >= 0 ? shelf[existing].addedAt : Date.now()
  };
  if (existing >= 0) shelf[existing] = entry;
  else shelf.unshift(entry);
  persist();
  closeModal();
  renderShelf();
  renderStats();
  refreshResultButtons();
}

function deleteBook() {
  if (!currentBook) return;
  shelf = shelf.filter(b => b.key !== currentBook.key);
  persist();
  closeModal();
  renderShelf();
  renderStats();
  refreshResultButtons();
}

function persist() { localStorage.setItem("codex_books", JSON.stringify(shelf)); }

/* ── Shelf Render ── */
function renderShelf() {
  let books = [...shelf];
  if (shelfFilter !== "all") books = books.filter(b => b.status === shelfFilter);

  switch (shelfSortBy) {
    case "title":  books.sort((a,b) => a.title.localeCompare(b.title)); break;
    case "author": books.sort((a,b) => (a.author||"").localeCompare(b.author||"")); break;
    case "rating": books.sort((a,b) => (b.rating||0) - (a.rating||0)); break;
    default:       books.sort((a,b) => b.addedAt - a.addedAt);
  }

  if (!books.length) {
    shelfGrid.innerHTML = `<div class="empty-shelf" id="emptyShelf"><span class="empty-rune">📖</span><p>${shelfFilter === "all" ? "Your shelf is empty. Search for a book above." : "No books with this status."}</p></div>`;
    return;
  }

  shelfGrid.innerHTML = books.map(b => {
    const stars = renderStarString(b.rating||0, 5);
    const coverHtml = b.cover
      ? `<img src="${b.cover}" alt="${escHtml(b.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=sc-no-cover>📖</span>'" />`
      : `<span class="sc-no-cover">📖</span>`;
    return `
      <div class="shelf-card" data-key="${b.key}">
        <div class="sc-cover">
          ${coverHtml}
          <span class="sc-status-badge ${b.status}">${statusLabel(b.status)}</span>
        </div>
        <div class="sc-info">
          <div class="sc-title">${escHtml(b.title)}</div>
          <div class="sc-author">${escHtml(b.author||"")}</div>
          <div class="sc-stars">${stars}</div>
        </div>
      </div>`;
  }).join("");

  shelfGrid.querySelectorAll(".shelf-card").forEach(card => {
    card.addEventListener("click", () => {
      const book = shelf.find(b => b.key === card.dataset.key);
      if (book) openModal(book);
    });
  });
}

function renderStarString(rating, max) {
  return Array.from({length: max}, (_,i) =>
    `<span class="${i < rating ? "" : "empty-star"}">★</span>`
  ).join("");
}

function statusLabel(s) {
  return { "in-progress": "In Progress", "on-deck": "On Deck", "conquered": "Conquered", "left-behind": "Left Behind" }[s] || s;
}

/* ── Stats ── */
function renderStats() {
  document.getElementById("statTotal").textContent     = shelf.length;
  document.getElementById("statConquered").textContent = shelf.filter(b=>b.status==="conquered").length;
  document.getElementById("statProgress").textContent  = shelf.filter(b=>b.status==="in-progress").length;
  document.getElementById("statDeck").textContent      = shelf.filter(b=>b.status==="on-deck").length;
  document.getElementById("statLeft").textContent      = shelf.filter(b=>b.status==="left-behind").length;
}

/* ── Series ── */
function renderSeries() {
  seriesGrid.innerHTML = FEATURED_SERIES.map(s => `
    <div class="series-card">
      <div class="sc-series-name">${s.icon} ${s.name}</div>
      <div class="sc-series-author">${s.author}</div>
      <div class="sc-series-desc">${s.desc}</div>
      <div class="sc-series-tags">${s.tags.map(t=>`<span class="sc-series-tag">${t}</span>`).join("")}</div>
      <button class="sc-series-btn" data-q="${escHtml(s.query)}">Search This Series →</button>
    </div>
  `).join("");

  seriesGrid.querySelectorAll(".sc-series-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      searchInput.value = btn.dataset.q;
      doSearch();
      searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

/* ── Upcoming ── */
function renderUpcoming() {
  upcomingGrid.innerHTML = UPCOMING_BOOKS.map(u => `
    <div class="upcoming-card">
      <div class="uc-icon">${u.icon}</div>
      <div class="uc-body">
        <div class="uc-title">${u.title}</div>
        <div class="uc-author">${u.author}</div>
        <div class="uc-date">${u.date}</div>
        <div class="uc-desc">${u.desc}</div>
      </div>
    </div>
  `).join("");
}

/* ── Refresh add buttons after shelf change ── */
function refreshResultButtons() {
  document.querySelectorAll(".rc-add-btn").forEach(btn => {
    const onShelf = shelf.some(b => b.key === btn.dataset.key);
    btn.classList.toggle("on-shelf", onShelf);
    btn.textContent = onShelf ? "✓ On Shelf" : "+ Add to Shelf";
  });
}

/* ── Util ── */
function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
