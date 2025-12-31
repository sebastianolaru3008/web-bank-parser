# Web Bank Parser

Full-stack app to parse and analyze bank statements with rule-based categorization and predictions. Single-origin setup: the frontend and backend are served from http://localhost:3000 with Nginx proxying `/api` to the backend.

## Highlights

- PDF parsing (primary), including encrypted PDFs with password prompt in the UI
- CSV/XLSX parsing fallback for exports
- Rule-based categorization with wildcard patterns (`*`), editable from the UI
- Predictions: detects installments (e.g., "Rata n din m"), separates Active vs Completed, and sums next month’s total
- Modern UI: upload-only landing, two-tab Analysis (Parsed/Predictions), CSV export
- Internationalization: English/Romanian switcher (persists), locale-aware amount formatting
- Theme toggle (light/dark, persists)
- Stable transaction IDs for reliable item references

## Architecture

- Frontend: SvelteKit (Vite dev server)
- Backend: Node.js (Express)
- Proxy: Nginx (single origin, `/` → frontend, `/api` → backend)
- Containers: Docker + docker-compose

## Quick Start (Docker)

From the repo root:

```sh
docker compose up --build -d
```

- App: http://localhost:3000
- API: available under the same origin at `/api/*` (proxied)

The frontend uses `PUBLIC_API_BASE=/api` (set in docker-compose) to call the backend.

## Features in the UI

- Upload PDF (with optional password) and parse
- Analysis → Parsed tab: filter/search, totals per category, export CSV
- Analysis → Predictions tab: Active vs Completed installments, completion bars, next month total
- Rules page: view/add/remove wildcard rules, per-language (EN/RO) rules store
- Language and theme controls in the header (persisted via localStorage)

## API

- GET `/api/rules?lang=en|ro` → returns rules loaded from CSV
- POST `/api/rules` JSON `{ lang, pattern, category }` → adds a rule and persists CSV
- DELETE `/api/rules?lang=en|ro&pattern=...` → removes a rule and persists CSV
- POST `/api/parse` (multipart form)
  - `file`: required PDF/CSV/XLSX
  - `lang`: `en` (default) or `ro` (categorization rules selector)
  - `password`: optional (for encrypted PDFs)

Response includes `items` with `id`, `date`, `description`, `amount`, `category`, plus `totals` per category.

Notes:
- Backend internal health endpoint is `/health` (not proxied by Nginx). Use the UI or `/api/rules` as a connectivity check.

## Local Dev (without Docker)

Backend:

```sh
cd backend
npm install
npm run dev
```

Frontend:

```sh
cd frontend
npm install
npm run dev
```

Set `PUBLIC_API_BASE` in `frontend/.env` if you want to point to a different backend (e.g., `PUBLIC_API_BASE=http://localhost:8080`).

## Rules Storage

- CSV files live in `backend/data/rules/{en,ro}.csv`
- Docker Compose mounts this directory writable so changes from the UI persist
- Patterns support `*` wildcards; the backend converts them to regex for matching

## Parsing Notes

- PDFs: robust text extraction, with a PDF.js fallback for password-protected files
- Description capture: adjacent lines without date/amount are appended to preserve merchant details (POS/location/IDs)
- CSV/XLSX: auto-detects columns for date/description/amount; adjust `detectColumns()` in `backend/src/parser.js` if needed

## License

MIT (see LICENSE)