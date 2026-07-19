# Cape Verde playable-team production checklist

Target id: `cape_verde`  
Team code: `CPV`  
Approved mascot: Atlantic loggerhead sea turtle  
Approved kits: navy home, volcanic-sand away, charcoal goalkeeper  
Approved crest: golden volcanic island with white Atlantic waves; no championship stars

## 1. Approved source artwork

- [x] Character and three-kit direction board (`cape-verde-art-direction-v2.png`)
- [x] Full-resolution portrait source (`cape-verde-portrait-v2.png`)
- [x] 512x512 transparent selection portrait (`cape-verde-portrait-512-v2.png`)
- [x] 4x4 character and kit source sheet (`cape-verde-parts-sheet-chroma-v2.png`)

## 2. Runtime character artwork

The match renderer animates fixed image attachments; animation motion is shared,
but the turtle artwork must be cut and fitted to those attachment sizes.

- [x] Base race: `head.png` (81x77)
- [x] Base race: `head_back.png` (81x77)
- [x] Base race: `neck.png` (20x18)
- [x] Base race: `arm_left.png` (14x11)
- [x] Base race: `arm_right.png` (15x17)
- [x] Base race: `hand_left.png` (25x28)
- [x] Base race: `hand_right.png` (23x38)
- [x] Base race: `knee.png` (8x9)
- [x] Base race attachment metadata: `race.json`
- [x] Six teammate head variants: `cape_verde_v1` through `cape_verde_v6`, each with `head.png` and `race.json`

The six variants can stay visibly related while changing shell markings, brow,
eye shape, muzzle spots, or age cues. This avoids eleven identical players.

## 3. Runtime kit artwork

Prepare three directories: `home`, `away`, and `goalkeeper`.

For each kit:

- [x] `shirt_front.png` (56x52)
- [x] `shirt_back.png` (56x52)
- [x] `sleeve_left.png` (14x22)
- [x] `sleeve_right.png` (23x18)
- [x] `shorts.png` (55x8)
- [x] `shorts_leg_left.png` (12x16)
- [x] `shorts_leg_right.png` (12x16)
- [x] `socks.png` (11x14)
- [x] `socks_left.png` (11x14)
- [x] `socks_right.png` (11x14)
- [x] `shoes_left.png` (16x6)
- [x] `shoes_right.png` (16x6)

Goalkeeper additionally requires:

- [x] `hand_left.png` (26x24)
- [x] `hand_right.png` (26x25)

Shared number and plain fallback textures can be reused from the existing runtime.

## 4. Team identity and data

- [x] Cape Verde flag (`flag.png`, 512x256)
- [x] Runtime team definition (`team.json`): rating, code, continent, kit attachments, colours, and 11-player roles
- [x] Runtime English team name (`languages/en.json`)
- [x] Selection roster entry: id `cape_verde`, code `CPV`, and navy/white/red palette
- [x] Selection portrait installed at `public/animal-cup/portraits/cape_verde.png`
- [x] Localized name, animal, kit, and trait in English, Chinese, Portuguese, French, Spanish, and Japanese
- [x] Proposed trait copy: calm island counter-attack / endurance
- [x] Runtime directory index and embedded data bundle regenerated

## 5. Audio

Shared and already available; no new files required:

- [x] Kick, pass, shot, ball bounce, post hit
- [x] Kickoff, foul, and full-time whistles
- [x] Crowd ambience, generic goal cheer, and background music
- [x] UI click and selection sounds

Cape Verde-specific parity asset:

- [x] `cheer_turtle.wav`: a locally generated short goal sting combining Atlantic surf impact,
      a restrained low turtle-like vocal texture, and stadium celebration
- [x] Register `cape_verde: "cheer_turtle"` in the goal-audio mapping
- [x] Preload the new sound through the existing mobile-unlock audio path

Avoid a cartoon roar: sea turtles are not naturally roaring animals. The sound
should read as an island/ocean team signature rather than a false wildlife call.

## 6. Integration and verification

- [x] Add Cape Verde as the ninth selectable team without changing the existing eight
- [x] Verify home, away, and goalkeeper kits load at gameplay scale
- [x] Verify the match roster renders with six head variants
- [x] Verify portrait, flag, and all six localized team descriptions are present
- [x] Verify goal celebration loads `cheer_turtle.wav` through the existing fallback-safe sound bank
- [x] Verify keyboard/touch control path, LAN join page, and phone relay
- [x] Verify Cape Verde can start and play a full match against an existing team
- [x] Run static i18n, match-boot, match-play, production build, and LAN smoke checks

## Production order

1. Slice and fit the base turtle and three kits.
2. Produce six head variants and the Cape Verde flag.
3. Generate team data and localized copy.
4. Produce and register the turtle goal sting.
5. Regenerate runtime indexes/bundle, integrate the ninth team, and test all modes.
