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

- [ ] Base race: `head.png` (81x77)
- [ ] Base race: `head_back.png` (81x77)
- [ ] Base race: `neck.png` (20x18)
- [ ] Base race: `arm_left.png` (14x11)
- [ ] Base race: `arm_right.png` (15x17)
- [ ] Base race: `hand_left.png` (25x28)
- [ ] Base race: `hand_right.png` (23x38)
- [ ] Base race: `knee.png` (8x9)
- [ ] Base race attachment metadata: `race.json`
- [ ] Six teammate head variants: `cape_verde_v1` through `cape_verde_v6`, each with `head.png` and `race.json`

The six variants can stay visibly related while changing shell markings, brow,
eye shape, muzzle spots, or age cues. This avoids eleven identical players.

## 3. Runtime kit artwork

Prepare three directories: `home`, `away`, and `goalkeeper`.

For each kit:

- [ ] `shirt_front.png` (56x52)
- [ ] `shirt_back.png` (56x52)
- [ ] `sleeve_left.png` (14x22)
- [ ] `sleeve_right.png` (23x18)
- [ ] `shorts.png` (55x8)
- [ ] `shorts_leg_left.png` (12x16)
- [ ] `shorts_leg_right.png` (12x16)
- [ ] `socks.png` (11x14)
- [ ] `socks_left.png` (11x14)
- [ ] `socks_right.png` (11x14)
- [ ] `shoes_left.png` (16x6)
- [ ] `shoes_right.png` (16x6)

Goalkeeper additionally requires:

- [ ] `hand_left.png` (26x24)
- [ ] `hand_right.png` (26x25)

Shared number and plain fallback textures can be reused from the existing runtime.

## 4. Team identity and data

- [ ] Cape Verde flag (`flag.png`, 512x256)
- [ ] Runtime team definition (`team.json`): rating, code, continent, kit attachments, colours, and 11-player roles
- [ ] Runtime English team name (`languages/en.json`)
- [ ] Selection roster entry: id `cape_verde`, code `CPV`, and navy/white/red palette
- [ ] Selection portrait installed at `public/animal-cup/portraits/cape_verde.png`
- [ ] Localized name, animal, kit, and trait in English, Chinese, Portuguese, French, Spanish, and Japanese
- [ ] Proposed trait copy: calm island counter-attack / endurance
- [ ] Runtime directory index and embedded data bundle regenerated

## 5. Audio

Shared and already available; no new files required:

- [x] Kick, pass, shot, ball bounce, post hit
- [x] Kickoff, foul, and full-time whistles
- [x] Crowd ambience, generic goal cheer, and background music
- [x] UI click and selection sounds

Cape Verde-specific parity asset:

- [ ] `cheer_turtle.mp3`: a short goal sting combining Atlantic surf impact,
      a restrained low turtle-like vocal texture, and stadium celebration
- [ ] Register `cape_verde: "cheer_turtle"` in the goal-audio mapping
- [ ] Preload the new sound and verify playback after the first mobile gesture

Avoid a cartoon roar: sea turtles are not naturally roaring animals. The sound
should read as an island/ocean team signature rather than a false wildlife call.

## 6. Integration and verification

- [ ] Add Cape Verde as the ninth selectable team without changing the existing eight
- [ ] Verify home, away, and goalkeeper kits in motion at gameplay scale
- [ ] Verify all eleven players render, including six head variants
- [ ] Verify portrait, flag, name, animal, kit, and trait in every supported language
- [ ] Verify goal celebration uses `cheer_turtle.mp3`, with generic cheer fallback
- [ ] Verify keyboard, touch, LAN phone controller, and online room selection
- [ ] Verify both sides can select Cape Verde and complete a full match
- [ ] Run internationalization, match-boot, match-play, build, and LAN smoke checks

## Production order

1. Slice and fit the base turtle and three kits.
2. Produce six head variants and the Cape Verde flag.
3. Generate team data and localized copy.
4. Produce and register the turtle goal sting.
5. Regenerate runtime indexes/bundle, integrate the ninth team, and test all modes.
