# Runtime asset contract

## Character race

Base directory: `public/match-runtime-min/data/player/races/<team-id>/`

| File | Size |
|---|---:|
| `head.png` | 81x77 |
| `head_back.png` | 81x77 |
| `neck.png` | 20x18 |
| `arm_left.png` | 14x11 |
| `arm_right.png` | 15x17 |
| `hand_left.png` | 25x28 |
| `hand_right.png` | 23x38 |
| `knee.png` | 8x9 |
| `race.json` | attachment metadata |

Add `<team-id>_v1` through `<team-id>_v6`. Each variant contains `head.png` and `race.json`; non-head attachment paths point back to the base race.

## Team identity

Base directory: `public/match-runtime-min/data/teams/<team-id>/`

- `flag.png`: 512x256
- `team.json`: rating, code, continent, kits, 11 roles, numbers, and race assignments
- `languages/en.json`: runtime display name

## Each kit

Create `home`, `away`, and `goalkeeper` directories.

| File | Size |
|---|---:|
| `shirt_front.png` | 56x52 |
| `shirt_back.png` | 56x52 |
| `sleeve_left.png` | 14x22 |
| `sleeve_right.png` | 23x18 |
| `shorts.png` | 55x8 |
| `shorts_leg_left.png` | 12x16 |
| `shorts_leg_right.png` | 12x16 |
| `socks.png` | 11x14 |
| `socks_left.png` | 11x14 |
| `socks_right.png` | 11x14 |
| `shoes_left.png` | 16x6 |
| `shoes_right.png` | 16x6 |

The goalkeeper also requires `hand_left.png` at 26x24 and `hand_right.png` at 26x25.

## Display and language

- Install a transparent 512x512 portrait at `public/animal-cup/portraits/<team-id>.png`.
- Add `team.<team-id>.name`, `.animal`, `.kit`, and `.trait` to all six app dictionaries.
- Add the team to `PLAYABLE_TEAMS` with a three-color palette.

## Audio

- Add one `cheer_<animal>` asset under `public/animal-cup/audio/`.
- Register the team-to-sound mapping and warm/preload list.
- Keep generic `goal_cheer` fallback.

