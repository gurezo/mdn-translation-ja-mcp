# Third-party content and external repositories

This project **does not** bundle MDN documentation or translated page source from Mozilla. It is a **local MCP server** that may read or reference files **you** clone on your machine.

## Repositories you are expected to clone locally

When using workflows described in the README (e.g. aligning with [mdn/content](https://github.com/mdn/content) and [mdn/translated-content](https://github.com/mdn/translated-content)), clone those repositories yourself. Their content remains under their respective licenses and is **not** included in this repository.

| Resource | URL |
|----------|-----|
| MDN English source | https://github.com/mdn/content |
| MDN translated content (incl. `files/ja`) | https://github.com/mdn/translated-content |

## Translation community references

Guideline content in `.agents/skills/*/references/` is derived from Mozilla Japan translation community resources. Those materials are owned by their respective authors; see each linked page for terms of use.

| Resource | URL |
|----------|-----|
| Editorial Guideline | https://github.com/mozilla-japan/translation/wiki/Editorial-Guideline |
| L10N Guideline | https://github.com/mozilla-japan/translation/wiki/L10N-Guideline |
| Mozilla L10N Glossary | https://github.com/mozilla-japan/translation/wiki/Mozilla-L10N-Glossary |
| Japanese style spreadsheet | https://docs.google.com/spreadsheets/d/1y-hC-xMXawCgcYZwJDnvuSlAOTgMRLLyqXurpYkJbYE/edit#gid=0 |

Guideline links used by MCP tools may also point to the above sources. MCP mechanical checks use `src/shared/data/prohibited-expressions.json`.

## MCP protocol

This server implements the [Model Context Protocol](https://modelcontextprotocol.io/) using the [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) package; the exact version is pinned in `package-lock.json` and declared in `package.json`.
