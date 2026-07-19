# Validation sequence

Run checks from cheap to expensive.

## Static

1. Parse all six dictionaries and assert the four new team keys exist.
2. Parse `team.json`; assert 11 players, three kits, unique team id, and correct code.
3. Assert the base race has nine files and six variants each have two files.
4. Assert every PNG has the contract dimensions and expected alpha where applicable.
5. Assert the new team is present in both runtime indexes.
6. Run `git diff --check` and inspect `git status --short`.

## Build

Run `npm run build`. A successful build must compile, type-check, generate all routes, and stamp the service-worker cache.

## Browser match

Start the app on port 13000. Run:

```text
node script/verify-match-boot.mjs http://localhost:13000 "http://localhost:13000/match?red=<team-id>&blue=<existing-team>"
node script/verify-match-play.mjs http://localhost:13000 "http://localhost:13000/match?red=<team-id>&blue=<existing-team>&play=1"
```

Require: canvas, stadium, player renderers, running pitch, no browser errors, controlled-player movement, and visible control indicator.

## LAN

Start the Next.js page server and LAN relay. Require:

- `/api/health` returns 200
- `/lobby` returns 200 through the LAN address
- `/pad` returns 200 through the LAN address
- a WebSocket client connects to port 13001

The phone controller sends generic control frames, so successful match control plus relay connectivity verifies the new team uses the same input path.

## Git integrity

- Confirm the approved-art annotated tag resolves to the pre-integration commit.
- Confirm the final integration is one focused commit.
- Confirm the working tree is clean.
- Never push unless the user explicitly requests it.
