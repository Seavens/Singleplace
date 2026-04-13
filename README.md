# Singleplace Template

A lightweight Roblox TS + Flamework singleplace template with the core backend systems already set up.

It includes:

- Flamework bootstrapping for `client`, `server`, and `shared`
- reactive player data state via Charm
- server-to-client data replication
- player load tracking
- session time saving
- login streak handling
- Studio-only test hooks for validating the data flow while building

## Stack

- `roblox-ts`
- `Flamework`
- `Rojo`
- `Lapis`
- `Charm`
- `Squash`

## Project Structure

```text
src/
  client/
    data/
    test/
  server/
    data/
    players/
    test/
  shared/
    core/
    data/
    utils/
```

## Getting Started

```bash
npm install
npm run build
npm run serve
```

## Development

- `npm run watch` watches and rebuilds TypeScript output
- `npm run serve` starts the Rojo server
- If you're using VS Code, the included tasks expose quick `Watch` and `Serve` runners from the command palette or terminal task picker

## What This Template Handles

`src/server/data`

- default player data
- schema validation
- optional migrations
- document load/unload lifecycle

`src/server/players`

- player added/loaded/removing signals
- session time accumulation
- login streak updates

`src/shared/data`

- normalized data helpers
- client/server state access
- replication payload types

## Notes

- `USE_MOCK_DATA` is enabled automatically in Studio, so local testing does not hit persistent DataStore-backed data.
- The files under `src/client/test` and `src/server/test` are Studio-only validation helpers and can be removed once you no longer want the debug prints.