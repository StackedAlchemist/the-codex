# 📖 The Codex — Books & Games Tracker

> *"Every tome conquered. Every quest logged. Your legend, recorded."*

A split-screen tracker for books and games. The Codex lets you search for real books via the Open Library API and real games via the IGDB API, then track your reading and gaming progress with status, ratings, and personal notes.

**[🔮 View Live Demo](https://stackedalchemist.github.io/stacked-alchemist/the-codex/)**

---

## ✦ Features

**Books (Tome Keeper)**
- Live search powered by the [Open Library API](https://openlibrary.org/developers/api)
- Track status: On Deck, In Progress, Conquered
- Add star ratings (1–5) and personal notes
- Filter and sort your shelf

**Games (Quest Log)**
- Live search powered by the [IGDB API](https://api-docs.igdb.com/) via Cloudflare Worker proxy
- Search by platform: PS5, Xbox, Nintendo, PC
- Track status: On Deck, In Progress, Conquered, Abandoned
- Add ratings and notes
- Upcoming releases feed

**Shared**
- Split-screen landing page with live stats
- Data persists via localStorage
- Responsive design

---

## 🛠 Tech Stack

| Technology | Usage |
|---|---|
| HTML5 / CSS3 / JavaScript | Core structure, styles, and logic |
| Open Library API | Book search and metadata |
| IGDB API | Game search and metadata |
| Cloudflare Workers | Proxy server for IGDB OAuth (keeps credentials server-side) |
| localStorage | Tracking data persistence |

---

## 🚀 Running Locally

```bash
git clone https://github.com/StackedAlchemist/stacked-alchemist.git
cd Portfolio/the-codex
```

**Book search** works immediately — no API key needed (Open Library is public).

**Game search** requires a Cloudflare Worker proxy:

1. Create a free account at [cloudflare.com](https://cloudflare.com)
2. Create a new Worker and paste in the proxy script
3. Add your IGDB `Client-ID` and `Authorization` token as environment variables
4. Update the `WORKER_URL` constant in `games.js` with your Worker's URL

To get IGDB credentials:
1. Register at [dev.twitch.tv](https://dev.twitch.tv/console)
2. Create an application to get a `Client-ID` and `Client-Secret`
3. Generate an OAuth token via Twitch's token endpoint

---

## ⚠ Data Storage Notice

> The archives are bound to this vessel. Data persists in local memory only — switching devices or clearing your browser cache will release the binding.

All tracking data is saved to **localStorage**. No account required, but data does not sync across devices.

---

## 📁 File Structure

```
the-codex/
├── index.html       # Split-screen landing page
├── tracker.css      # Landing page styles
├── tracker.js       # Landing page stats logic
├── books.html       # Book tracker
├── books.css        # Book tracker styles
├── books.js         # Open Library API + tracking logic
├── games.html       # Game tracker
├── games.css        # Game tracker styles
└── games.js         # IGDB API + tracking logic
```

---

*Built by [Billy Williams](https://stackedalchemist.github.io/stacked-alchemist/) — Stacked Alchemist*
