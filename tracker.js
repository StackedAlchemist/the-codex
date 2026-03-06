/* ============================================================
   THE CODEX — Landing Page JS
   Cursor, stat counters pulled from localStorage
============================================================ */

/* ── Cursor ── */
const dot  = document.getElementById("cursorDot");
const ring = document.getElementById("cursorRing");
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; });

(function animCursor() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  if (dot)  { dot.style.left  = mx + "px"; dot.style.top  = my + "px"; }
  if (ring) { ring.style.left = rx + "px"; ring.style.top = ry + "px"; }
  requestAnimationFrame(animCursor);
})();

document.querySelectorAll("a, button").forEach(el => {
  el.addEventListener("mouseenter", () => { if(dot) dot.style.transform = "translate(-50%,-50%) scale(2)"; });
  el.addEventListener("mouseleave", () => { if(dot) dot.style.transform = "translate(-50%,-50%) scale(1)"; });
});

/* ── Load stats from localStorage ── */
function loadStats() {
  const books = JSON.parse(localStorage.getItem("codex_books") || "[]");
  const games = JSON.parse(localStorage.getItem("codex_games") || "[]");

  const booksRead     = books.filter(b => b.status === "conquered").length;
  const booksProgress = books.filter(b => b.status === "in-progress").length;
  const booksDeck     = books.filter(b => b.status === "on-deck").length;

  const gamesComp   = games.filter(g => g.status === "conquered").length;
  const gamesActive = games.filter(g => g.status === "in-progress").length;
  const gamesDeck   = games.filter(g => g.status === "on-deck").length;

  animCount("booksRead",     booksRead);
  animCount("booksProgress", booksProgress);
  animCount("booksDeck",     booksDeck);
  animCount("gamesComp",     gamesComp);
  animCount("gamesActive",   gamesActive);
  animCount("gamesDeck",     gamesDeck);
}

function animCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  if (target === 0) { el.textContent = "0"; return; }
  let current = 0;
  const step = Math.max(1, Math.floor(target / 20));
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 40);
}

document.addEventListener("DOMContentLoaded", loadStats);
