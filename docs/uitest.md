# UI Chart Test Guide

This guide starts the full local stack and verifies the AR aging chart render.

## Prerequisites

- Node.js 20+
- Docker Desktop running

## Quick start (one command)

From repo root:

```powershell
npm run dev:start
```

This starts ClickHouse first, then launches backend and UI dev servers.

## 1) Start ClickHouse

From repo root:

```powershell
docker compose -f docker/docker-compose.yml up -d
```

## 2) Install dependencies

From repo root:

```powershell
npm install
```

This installs root dependencies and the `ui` workspace dependencies.

## 3) Start backend API

Open terminal A at repo root:

```powershell
npm run dev
```

Expected API base URL:

- `http://localhost:3000`

Primary chart endpoint:

- `http://localhost:3000/api/charts/aging-by-bucket`

## 4) Start UI

Open terminal B at repo root:

```powershell
npm run ui:dev
```

Expected UI URL:

- `http://localhost:5173`

## 5) Test the chart render

1. Open `http://localhost:5173` in your browser.
2. You should see the AR Aging chart with bar labels.

## Optional API checks (PowerShell)

Health check:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing
```

Chart payload check:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/charts/aging-by-bucket" -UseBasicParsing
```

## Stop processes

- Backend/UI terminals: `Ctrl + C`
- ClickHouse:

```powershell
docker compose -f docker/docker-compose.yml down
```
