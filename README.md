# web-bank-parser

> ⚠️ This is a WIP project; expect breaking changes. Ignore for now the README and code structure.

Full-stack web app to parse and categorize bank records using wildcard rules.

## Stack

- Frontend: SvelteKit (Vite)
- Backend: Node.js (Express)
- Dev Containers: Docker + docker-compose

## Dev (Docker)

# From web-bank-parser/
docker compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080/health

The frontend talks to the backend via PUBLIC_API_BASE (set in compose).

## Endpoints

- GET /health – simple health check
- GET /api/rules?lang=en|ro – get rules loaded from CSV
- POST /api/parse – multipart form with fields:
  - file: CSV/XLS(X) bank export
  - lang: en (default) or ro

Response includes parsed items with date, description, amount, category and totals per category.

## Local Dev (without Docker)

Backend:
cd backend
npm install
npm run dev

Frontend:
cd frontend
npm install
npm run dev

Configure PUBLIC_API_BASE in an .env file under frontend/ if needed, e.g.:

PUBLIC_API_BASE=http://localhost:8080

## Notes

- Rules CSVs are in backend/data/rules/{en,ro}.csv and use * wildcards.
- Parser supports CSV and Excel; it attempts to auto-detect columns for description and amount.
- Adjust column detection in backend/src/parser.js if your export format differs.