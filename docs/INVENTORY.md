# Legacy implementation inventory (pre–stdio MCP)

This document records the HTTP/SSE stack that Issue #1 removes, and the migration targets for the stdio MCP server.

## Current entrypoint and dependencies

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

## Migration targets

| Area | Target |
|------|--------|
| Transport | MCP over **stdio** (local process; no HTTP port) |
| Cursor | `mcp.json` with `command` / `args` (not `url`) |
| Rules / guidelines | Exposed as MCP **tools** or **resources** (to be expanded after bootstrap) |
| MDN page content | **Not** vendored in this repo; users clone [mdn/content](https://github.com/mdn/content) and [mdn/translated-content](https://github.com/mdn/translated-content) locally (see README) |

## Compatibility

**None.** Issue #1 is a breaking reboot; HTTP clients and the previous Cursor URL configuration will not work after migration.
