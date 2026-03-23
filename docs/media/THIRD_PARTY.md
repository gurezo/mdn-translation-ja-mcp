# Third-party content and external repositories

This project **does not** bundle MDN documentation or translated page source from Mozilla. It is a **local MCP server** that may read or reference files **you** clone on your machine.

## Repositories you are expected to clone locally

When using workflows described in the README (e.g. aligning with [mdn/content](https://github.com/mdn/content) and [mdn/translated-content](https://github.com/mdn/translated-content)), clone those repositories yourself. Their content remains under their respective licenses and is **not** included in this repository.

| Resource | URL |
|----------|-----|
| MDN English source | https://github.com/mdn/content |
| MDN translated content (incl. `files/ja`) | https://github.com/mdn/translated-content |

## Translation community references

Guideline links used by this project (for example in MCP tools) may point to Mozilla Japan translation wiki pages, Google Sheets, or similar. Those materials are owned by their respective authors; see each linked page for terms of use.

## MCP protocol

This server implements the [Model Context Protocol](https://modelcontextprotocol.io/) using the [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) package; the exact version is pinned in `package-lock.json` and declared in `package.json`.
