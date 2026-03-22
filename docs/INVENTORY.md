# Legacy implementation inventory (pre–stdio MCP)

This document records the **REST + SSE** stack that Issue #1 removes, and how it relates to **today’s** transports.

## Distinction: old REST/SSE vs MCP Streamable HTTP

| | Old stack (removed) | Current (2025–) |
|---|---------------------|-----------------|
| Purpose | Ad-hoc **REST** JSON (`/api/rules`, etc.) and **SSE** events | **MCP** over **stdio** or **Streamable HTTP** (`POST /mcp` per MCP spec) |
| Cursor `mcp.json` | Was URL + paths to `/api/*` (no longer valid) | `command`/`args` (stdio) **or** `type: "http"` + `url` …`/mcp` (see [README.md](../README.md)) |

The **legacy REST/SSE server** described below is **not** the same as `npm run start:http` (MCP Streamable HTTP).

## Current entrypoint and dependencies (historical record)

| Item | Location / detail |
|------|-------------------|
| Entry | `server.js` |
| HTTP framework | Express (`express`) |
| Middleware | `cors`, `body-parser` |
| Dev | `nodemon` for `npm run dev` |

## HTTP API surface (removed)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/events` | Server-Sent Events (heartbeat, broadcast) |
| GET | `/api/rules` | JSON of translation guideline URLs (editorial, l10n, glossary, spreadsheet) |
| POST | `/api/validate` | Basic text validation; also emits SSE `validation` events |

## Documentation to replace

| Item | Current behavior |
|------|------------------|
| `README.md` | Documents `http://localhost:3000`, Cursor config as URL + endpoint paths |

## Migration targets (Issue #1 era)

| Area | Target |
|------|--------|
| Transport | MCP over **stdio** (local process; no HTTP port) **or** MCP **Streamable HTTP** (`src/http.ts`, `npm run start:http`) |
| Cursor | `mcp.json` with `command` / `args` **or** `type` / `url` for Streamable HTTP |
| Rules / guidelines | Exposed as MCP **tools** or **resources** (to be expanded after bootstrap) |
| MDN page content | **Not** vendored in this repo; users clone [mdn/content](https://github.com/mdn/content) and [mdn/translated-content](https://github.com/mdn/translated-content) locally (see README) |

## Compatibility (legacy REST clients only)

**None** for the old `/api/*` HTTP API. Issue #1 removed that surface; those clients must use MCP tools instead.
