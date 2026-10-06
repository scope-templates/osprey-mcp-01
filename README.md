# Osprey

Osprey, an MCP server for a bird-sighting log. Sightings live in a small JSON file and the
server exposes three tools over the Model Context Protocol:

- `list_sightings` newest first, with an optional `species` filter and `limit`
- `add_sighting` records a sighting: `species`, `location`, optional `count`, `observedAt`, `notes`
- `sighting_stats` totals by species, individuals counted, locations, first and last observation

## Run locally

    npm install
    npm start          # Streamable HTTP transport at http://localhost:3000/mcp
    npm run stdio      # the same server over stdio, for clients that spawn it as a process

Health check: `curl localhost:3000/health` returns `{"ok":true}`.

An `initialize` request over HTTP:

    curl -s -X POST localhost:3000/mcp \
      -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
      -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'

## Environment

- `PORT` HTTP port (default 3000)
- `SIGHTINGS_FILE` path of the JSON store (default `data/birds.json` in the repo)
