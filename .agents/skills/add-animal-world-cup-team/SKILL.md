---
name: add-animal-world-cup-team
description: Produce and integrate a complete new national animal team into the Animal World Cup repository. Use when asked to add, prototype, replace, or finish a playable team, including art direction, mascot and kit production, Pixi runtime attachments, teammate variants, flag, portrait, audio, localization, runtime bundles, LAN/online compatibility, validation, and reversible Git version control.
---

# Add an Animal World Cup Team

Add one team without altering the identity or behavior of existing teams. Treat art approval, asset production, runtime integration, and verification as separate checkpoints.

## Start with a contract

Inspect the repository before editing. Confirm the current branch is clean enough to isolate the feature and locate:

- `app/data/teams.js`
- `app/i18n/dict/`
- `app/match/MatchAudio.jsx`
- `app/audio/SoundBank.js`
- `public/match-runtime-min/data/teams/`
- `public/match-runtime-min/data/player/races/`
- `public/match-runtime-min/__dirlist.json`
- `public/match-runtime-min/__data-bundle.json`

State these inputs before production:

- stable team id in lowercase snake case
- three-letter team code
- country and continent
- animal species and character rationale
- home, away, and goalkeeper palettes
- non-championship crest rule
- gameplay trait copy
- audio direction

Ask only when an unresolved choice would materially change the identity. Otherwise select a culturally and ecologically defensible proposal and present it for approval.

## Preserve a reversible baseline

1. Work on a `codex/` feature branch.
2. Commit approved concept art and its manifest before runtime integration.
3. Create an annotated tag at the approved pre-integration commit, such as `<team-id>-art-approved-v1`.
4. Put the full playable-team integration in a later atomic commit.
5. Never rewrite or delete the baseline tag during iteration.

Do not stage unrelated user changes. Ensure every changed line or asset is directly required by the new team.

## Use two approval gates

### Gate 1: art direction

Produce a direction board containing:

- one consistent animal mascot
- home, away, and goalkeeper looks
- palette and crest logic
- front-facing selection portrait
- a chroma-key source sheet suitable for extraction

Do not slice or register the team until the user approves the mascot and all three kits. Preserve rejected or superseded directions with versioned filenames.

### Gate 2: runtime production

After approval, create a checklist and produce every item in the runtime contract. Read [references/asset-contract.md](references/asset-contract.md) before slicing or generating runtime files.

## Produce art safely

Use the image generation skill for raster concept art or teammate variants. Inspect every local edit target before editing. Generate transparent candidates on a flat chroma key, remove the key locally, and validate alpha and dimensions.

Maintain these invariants:

- preserve the approved species, face, watercolor style, outline, and kit colors
- avoid championship stars unless they accurately represent titles
- keep national flag symbols on the flag; do not automatically copy them to the jersey
- make crests legible at 56x52 shirt size
- keep each sprite isolated, complete, and free of shadows or background texture

Create six teammate head variants by changing only natural markings, brows, eyes, and expression. Do not add hats, hair, accessories, or different species unless explicitly approved.

## Build runtime assets

Prefer a deterministic project script over manual repeated slicing. Parameterize source paths, team id, palettes, and output paths when generalizing beyond one team.

For this repository, use `script/build-cape-verde-assets.mjs` as the proven structural reference. Do not copy Cape Verde identity values into another team. Reuse only:

- chroma-key removal and largest-component extraction
- fixed attachment resizing
- team JSON cloning and path normalization
- flag rendering pattern when appropriate
- runtime directory and embedded bundle regeneration

Generate the base race, six head variants, three kit directories, flag, portrait, `team.json`, and runtime English name. Validate every required file and exact pixel dimension.

## Add audio

Reuse common kicks, whistles, crowd ambience, UI sounds, and music. Add one team-specific goal sting for parity with existing teams.

Choose an honest animal/team signature. Do not invent a lion-like roar for a quiet species. Combine habitat sound, restrained animal texture, and celebration when that is more accurate.

Register the id in `MatchAudio.jsx`, preload it in `SoundBank.js`, and preserve generic goal-cheer fallback behavior. Prefer MP3 for generated services; WAV is acceptable for a small deterministic local sound if the loader selects the correct extension.

## Register the playable team

Make only the minimum registrations:

1. Add the id, code, and palette to `PLAYABLE_TEAMS`.
2. Install the selection portrait.
3. Add name, animal, kit, and trait in all six dictionaries: `en`, `zh`, `pt`, `fr`, `es`, `ja`.
4. Register the goal sound.
5. Add the runtime team and race directories.
6. Regenerate `__dirlist.json` and `__data-bundle.json` without adding backup or generated-index files to the public root listing.
7. Regenerate the service-worker cache version through the existing build.

Do not add speculative gameplay mechanics. Keep rating and roster roles compatible with the existing engine.

## Verify the result

Read [references/validation.md](references/validation.md) and run every applicable layer. At minimum verify:

- clean JSON and complete localization keys
- 11-player team data and three kits
- base race plus six variants
- runtime indexes contain the new team
- production build succeeds
- a real match boots with the new team
- a controlled new-team player moves and shows indicators
- lobby and phone pad return HTTP 200
- LAN WebSocket relay accepts a connection

Treat obsolete test selectors as test debt, not evidence that the new team failed. Report them separately and replace them only when authorized or required for reliable coverage.

## Finish and hand off

Update the production checklist to reflect only checks actually completed. Commit the integration with a conventional message such as:

`feat(team): add playable <country> <animal-plural>`

Report:

- team contents and distinctive identity
- production/build/browser/LAN results
- feature commit hash
- approved baseline tag and its commit
- local and LAN experience URLs if services remain running
- any genuine limitation, especially generated-audio quality or untested online deployment

