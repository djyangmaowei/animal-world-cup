/* Full-charge fire-shot visuals. Keeps physics and goalkeeper logic untouched. */
(function () {
  "use strict";

  var SPECIAL_SHOTS = { china: "fire" };
  var state = { active: false, age: 0, duration: 1.15 };
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

    var originalAir = {
      texture: renderer.air.texture,
      blendMode: renderer.air.blendMode,
    };
    var parts = {
      aura: new PIXI.Sprite(PIXI.Texture.fromImage("/animal-cup/fx/fire-aura.png")),
      impact: new PIXI.Sprite(PIXI.Texture.fromImage("/animal-cup/fx/fire-impact.png")),
      sparks: new PIXI.Sprite(PIXI.Texture.fromImage("/animal-cup/fx/fire-sparks.png")),
      trail: PIXI.Texture.fromImage("/animal-cup/fx/fire-trail.png"),
    };
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
    renderer.__fireShotFx = { state: state, parts: parts };

    window.require("player").Player.onKick.connect(function (player, target, direction, force) {
      var shotType = SPECIAL_SHOTS[teamIdFor(player)];
      if (!player.user || force < 17.2 || !shotType) return;
      window.dispatchEvent(new CustomEvent("ab-shot", {
        detail: { type: shotType, power: force, team: teamIdFor(player) },
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

      var fade = state.age < .78 ? 1 : Math.max(0, 1 - (state.age - .78) / .37);
      renderer.air.texture = parts.trail;
      renderer.air.blendMode = PIXI.BLEND_MODES.ADD;
      renderer.air.alpha = Math.min(1, Math.max(.45, (speed - 3) / 11)) * fade;

      parts.aura.visible = true;
      parts.aura.alpha = (.72 + Math.sin(state.age * 42) * .15) * fade;
      parts.aura.rotation += (frame.elapsed || 0) * 5;
      var pulse = 1 + Math.sin(state.age * 34) * .08;
      parts.aura.width = parts.aura.height = 42 * pulse;

      parts.impact.visible = state.age < .18;
      parts.impact.alpha = Math.max(0, 1 - state.age / .18);
      parts.impact.width = parts.impact.height = 36 + state.age * 200;

      parts.sparks.visible = state.age < .32;
      parts.sparks.alpha = Math.max(0, 1 - state.age / .32);
      parts.sparks.rotation += (frame.elapsed || 0) * 7;
      parts.sparks.width = parts.sparks.height = 42 + state.age * 80;
    };
  }

  window.addEventListener("ab-match-started", function (event) {
    teamIds.red = event.detail && event.detail.red;
    teamIds.blue = event.detail && event.detail.blue;
    install();
  });
  window.addEventListener("ab-shot", function (event) {
    if (!event.detail || event.detail.type !== "fire") return;
    install();
    state.active = true;
    state.age = 0;
  });
})();
