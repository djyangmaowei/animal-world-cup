# Cape Verde team art checkpoint

Status: source-art review; not integrated into the playable team list.

## Art direction

- Team id (proposed): `cape_verde`
- Code: `CPV`
- Mascot: Atlantic loggerhead sea turtle
- Character idea: calm, resilient, endurance-focused island counter-attacker
- Home: Atlantic navy, white chest band, thin red stripe, ten golden stars
- Away: volcanic-sand white, navy shoulders, red trim
- Goalkeeper: volcanic charcoal, gold panels, blue gloves

## Produced source art

- `cape-verde-art-direction.png` -- character identity and three-kit direction board
- `cape-verde-portrait-chroma.png` -- original portrait source on green screen
- `cape-verde-portrait.png` -- transparent full-resolution portrait
- `cape-verde-portrait-512.png` -- transparent 512x512 selectable-team portrait candidate
- `cape-verde-parts-sheet-chroma.png` -- 4x4 source sheet for race and kit component extraction

## Runtime assets required after approval

### Display

- 512x512 transparent team portrait
- Cape Verde flag texture
- localized team name, animal, kit and trait strings

### Turtle race attachments

- `head.png` (81x77)
- `head_back.png` (81x77)
- `neck.png` (20x18)
- `arm_left.png` (14x11)
- `arm_right.png` (15x17)
- `hand_left.png` (25x28)
- `hand_right.png` (23x38)
- `knee.png` (8x9)
- `race.json`

### Each kit: home, away, goalkeeper

- `shirt_front.png` (56x52)
- `shirt_back.png` (56x52)
- `sleeve_left.png` (14x22)
- `sleeve_right.png` (23x18)
- `shorts.png` (55x8)
- `shorts_leg_left.png` and `shorts_leg_right.png` (12x16)
- `socks.png`, `socks_left.png`, `socks_right.png` (11x14)
- `shoes_left.png` and `shoes_right.png` (16x6)
- goalkeeper gloves: `hand_left.png` (26x24), `hand_right.png` (26x25)

### Team data

- `team.json`
- `languages/en.json`
- runtime bundle and directory-list entries
- playable-team entry and localized UI strings

## Approval gate

Do not slice, install, bundle, or register the new team until the art direction,
character identity, and three kits are approved.
