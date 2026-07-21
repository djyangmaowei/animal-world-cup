# National-team hidden shot effects

Every playable team owns one unique full-charge shot identity. Themes use positive natural, geographic, craft, color, and sporting references; they avoid politics, military imagery, official crests, and claims about championships.

| Team | Effect key | Art direction | Sound character |
| --- | --- | --- | --- |
| England | `lionheart` | Crimson and gold lion-mane wind | Rounded roar-like bass and bright finish |
| France | `tricolour` | Flowing cobalt, white, and red comet ribbon | Elegant high shimmer |
| Germany | `thunder_gear` | Black-gold angular lightning gear | Heavy mechanical thunder |
| Spain | `solar_fan` | Scarlet-gold folding-fan sunburst | Warm, quick solar flare |
| Portugal | `navigator` | Emerald-crimson compass ocean curl | Rolling maritime rush |
| Brazil | `canopy_samba` | Yellow-green tropical leaf rhythm | Fast, lively layered pulse |
| Argentina | `celeste_sun` | Sky-blue and gold radiant sun ribbon | Clear rising solar tone |
| USA | `liberty_meteor` | Navy, red, and white single-star meteor | Broad cinematic impact |
| Cape Verde | `atlantic_turtle` | Atlantic current and turtle-shell geometry | Deep ocean sweep |
| Norway | `fjord_aurora` | Cyan aurora and crystalline frost | Low impact with icy shimmer |
| Japan | `sakura_wind` | Pale sakura petals on indigo wind | Light, precise bell-like finish |
| China | `fire` | Existing orange-red friendly fire | Existing full-charge fire sound |

## Production files

- `trails-atlas-chroma.png` and `impacts-atlas-chroma.png`: built-in image-generation outputs on removable green.
- `trails-atlas.png` and `impacts-atlas.png`: locally keyed transparent production atlases.
- `script/build-team-shot-fx.mjs`: deterministic atlas crop and runtime export for the eleven new effects; China's atlas cells remain concept references only.
- `script/build-team-shot-audio.mjs`: deterministic WAV synthesis for the eleven new effects.
- Runtime sprites: `public/animal-cup/fx/team-shots/<team>-trail.png` and `<team>-impact.png`.
- Runtime sounds: `public/animal-cup/audio/shot_<team>.wav`; China retains `fire_shot.wav`.

Final image prompts requested a 4×3 sprite atlas in playable-team order, polished hand-painted cartoon VFX, isolated cells, no text or official marks, on a flat `#00ff00` chroma-key background. The built-in image-generation path was used, followed by the imagegen skill's local chroma-key removal helper.
