/* Team-exclusive full-charge shot visuals. Keeps physics and goalkeeper logic untouched. */
(function () {
  "use strict";

  var ROOT = "/animal-cup/fx/team-shots/";
  var SPECIAL_SHOTS = {
    england:    { key: "lionheart",     audio: "shot_england",     accent: 0xffc93d, spin: 4.2, pulse: 31, duration: 1.08 },
    france:     { key: "tricolour",     audio: "shot_france",      accent: 0x75a7ff, spin: 5.6, pulse: 36, duration: 1.12 },
    germany:    { key: "thunder_gear",  audio: "shot_germany",     accent: 0xffc21c, spin: 7.4, pulse: 44, duration: 1.02 },
    spain:      { key: "solar_fan",     audio: "shot_spain",       accent: 0xffd33d, spin: 6.2, pulse: 39, duration: 1.10 },
    portugal:   { key: "navigator",     audio: "shot_portugal",    accent: 0x35cf8d, spin: 4.8, pulse: 33, duration: 1.16 },
    brazil:     { key: "canopy_samba",  audio: "shot_brazil",      accent: 0xf7da35, spin: 7.0, pulse: 47, duration: 1.08 },
    argentina:  { key: "celeste_sun",   audio: "shot_argentina",   accent: 0x78d8ff, spin: 5.2, pulse: 35, duration: 1.14 },
    usa:        { key: "liberty_meteor",audio: "shot_usa",         accent: 0xffffff, spin: 8.0, pulse: 42, duration: 1.04 },
    cape_verde: { key: "atlantic_turtle",audio:"shot_cape_verde",  accent: 0x49bfff, spin: 3.8, pulse: 29, duration: 1.20 },
    norway:     { key: "fjord_aurora",  audio: "shot_norway",      accent: 0x5de8ff, spin: 3.4, pulse: 27, duration: 1.22 },
    japan:      { key: "sakura_wind",   audio: "shot_japan",       accent: 0xff9ed5, spin: 4.4, pulse: 34, duration: 1.18 },
    china:      { key: "fire",          audio: "fire_shot",        accent: 0xffb126, spin: 5.0, pulse: 34, duration: 1.15 },
  };
  var state = { active: false, age: 0, duration: 1.15, profile: null };
  var teamIds = { red: null, blue: null };
  var installed = false;

  function teamIdFor(player) {
    var pitch = window.__matchGame && window.__matchGame.pitch;
    if (!pitch || !player || !player.team) return null;
    return player.team === pitch.redTeam ? teamIds.red :
      player.team === pitch.blueTeam ? teamIds.blue : null;
  }

  function hide(parts) {
    parts.aura.visible = false;
    parts.impact.visible = false;
    parts.sparks.visible = false;
  }

  function install() {
    if (installed || !window.__matchGame || !window.__matchGame.stadium) return;
    var PIXI = window.require("pixi");
    var renderer = window.__matchGame.stadium.ballRenderer;
    if (!renderer || !renderer.sprite || !renderer.air) return;
    installed = true;

    var originalAir = { texture: renderer.air.texture, blendMode: renderer.air.blendMode };
    var parts = {
      aura: new PIXI.Sprite(PIXI.Texture.fromImage("/animal-cup/fx/fire-aura.png")),
      impact: new PIXI.Sprite(PIXI.Texture.fromImage("/animal-cup/fx/fire-impact.png")),
      sparks: new PIXI.Sprite(PIXI.Texture.fromImage("/animal-cup/fx/fire-sparks.png")),
    };
    var textures = {};
    Object.keys(SPECIAL_SHOTS).forEach(function (team) {
      textures[team] = team === "china" ? {
        trail: PIXI.Texture.fromImage("/animal-cup/fx/fire-trail.png"),
        impact: PIXI.Texture.fromImage("/animal-cup/fx/fire-impact.png"),
      } : {
        trail: PIXI.Texture.fromImage(ROOT + team + "-trail.png"),
        impact: PIXI.Texture.fromImage(ROOT + team + "-impact.png"),
      };
    });
    [parts.aura, parts.impact, parts.sparks].forEach(function (sprite) {
      sprite.anchor.set(.5, .5);
      sprite.blendMode = PIXI.BLEND_MODES.ADD;
    });
    parts.aura.width = parts.aura.height = 42;
    parts.impact.width = parts.impact.height = 72;
    parts.sparks.width = parts.sparks.height = 62;
    renderer.sprite.addChildAt(parts.aura, 0);
    renderer.sprite.addChild(parts.impact);
    renderer.sprite.addChild(parts.sparks);
    hide(parts);
    var fxApi = { state: state, parts: parts, profiles: SPECIAL_SHOTS, textures: textures };
    renderer.__teamShotFx = fxApi;
    renderer.__fireShotFx = fxApi;

    window.require("player").Player.onKick.connect(function (player, target, direction, force) {
      var team = teamIdFor(player);
      var profile = SPECIAL_SHOTS[team];
      if (!player.user || force < 17.2 || !profile) return;
      window.dispatchEvent(new CustomEvent("ab-shot", {
        detail: { type: profile.key, audio: profile.audio, power: force, team: team },
      }));
    });

    var originalRender = renderer.render.bind(renderer);
    renderer.render = function (frame, ball) {
      originalRender(frame, ball);
      var speed = Math.sqrt(
        ball.velocity.x * ball.velocity.x +
        ball.velocity.y * ball.velocity.y +
        ball.velocity.z * ball.velocity.z
      );
      if (!state.active) {
        renderer.air.texture = originalAir.texture;
        renderer.air.blendMode = originalAir.blendMode;
        return hide(parts);
      }

      state.age += Math.max(0, frame.elapsed || 0);
      if (state.age >= state.duration || ball.inHands >= 0) {
        state.active = false;
        renderer.air.texture = originalAir.texture;
        renderer.air.blendMode = originalAir.blendMode;
        return hide(parts);
      }

      var profile = state.profile;
      var fadeStart = state.duration * .68;
      var fade = state.age < fadeStart ? 1 : Math.max(0, 1 - (state.age - fadeStart) / (state.duration - fadeStart));
      renderer.air.texture = textures[profile.team].trail;
      renderer.air.blendMode = PIXI.BLEND_MODES.ADD;
      renderer.air.alpha = Math.min(1, Math.max(.45, (speed - 3) / 11)) * fade;

      parts.aura.visible = true;
      parts.aura.alpha = (.66 + Math.sin(state.age * profile.pulse) * .14) * fade;
      parts.aura.rotation += (frame.elapsed || 0) * profile.spin;
      var pulse = 1 + Math.sin(state.age * profile.pulse) * .08;
      parts.aura.width = parts.aura.height = 42 * pulse;

      parts.impact.visible = state.age < .18;
      parts.impact.alpha = Math.max(0, 1 - state.age / .18);
      parts.impact.width = parts.impact.height = 36 + state.age * 200;

      parts.sparks.visible = state.age < .32;
      parts.sparks.alpha = Math.max(0, 1 - state.age / .32);
      parts.sparks.rotation += (frame.elapsed || 0) * (profile.spin + 2);
      parts.sparks.width = parts.sparks.height = 42 + state.age * 80;
    };
  }

  window.addEventListener("ab-match-started", function (event) {
    teamIds.red = event.detail && event.detail.red;
    teamIds.blue = event.detail && event.detail.blue;
    install();
  });
  window.addEventListener("ab-shot", function (event) {
    var profile = event.detail && SPECIAL_SHOTS[event.detail.team];
    if (!profile || event.detail.type !== profile.key) return;
    install();
    var fx = window.__matchGame.stadium.ballRenderer.__teamShotFx;
    profile.team = event.detail.team;
    state.profile = profile;
    state.duration = profile.duration;
    state.active = true;
    state.age = 0;
    fx.parts.aura.texture = fx.textures[profile.team].impact;
    fx.parts.impact.texture = fx.parts.aura.texture;
    fx.parts.sparks.tint = profile.accent;
  });
})();
