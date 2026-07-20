#!/usr/bin/env node
import { chromium } from "playwright-core";

const baseUrl = process.argv[2] || "http://localhost:13000";
const browser = await chromium.launch({ channel: "chrome", headless: false });
const errors = [];

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error" && !/audio|favicon/i.test(message.text())) errors.push(message.text());
  });
  await page.goto(`${baseUrl}/match?red=china&blue=england&play=1`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__matchGame?.stadium?.ballRenderer?.__fireShotFx, null, { timeout: 45000 });
  await page.waitForFunction(() => {
    const game = window.__matchGame;
    return game?.pitch?.matchStarted && !game.pitch.ballOutOfPlay;
  }, null, { timeout: 30000 });

  async function giveBallToPlayer(index) {
    await page.evaluate((playerIndex) => {
      const game = window.__matchGame;
      const user = window.require("users").list[0];
      const player = game.pitch.redTeam.fieldPlayers[playerIndex];
      if (user.team !== game.pitch.redTeam) user.changeTeam(game.pitch.redTeam);
      if (user.player !== player) user.takeControl(player);
      game.pitch.ball.placeAtPosition(player.position.x, player.position.y, 0);
      player.trap(game.pitch.ball);
      player.states.change(window.require("players/states").HumanDribble);
      window.__touchInput.active = true;
      window.__touchInput.vx = 0;
      window.__touchInput.vy = 0;
      window.__touchInput.shoot = false;
      window.__fireShotEvents = [];
      window.__maxTestBallSpeed = 0;
      if (!window.__trackTestBallSpeed) {
        window.__trackTestBallSpeed = true;
        const track = () => {
          const velocity = window.__matchGame?.pitch?.ball?.velocity;
          if (velocity) window.__maxTestBallSpeed = Math.max(
            window.__maxTestBallSpeed,
            Math.hypot(velocity.x, velocity.y, velocity.z),
          );
          requestAnimationFrame(track);
        };
        requestAnimationFrame(track);
      }
      window.addEventListener("ab-shot", (event) => window.__fireShotEvents.push(event.detail), { once: true });
    }, index);
  }

  await giveBallToPlayer(0);
  await page.waitForTimeout(120);
  await page.evaluate(() => { window.__touchInput.shoot = true; });
  await page.waitForTimeout(80);
  await page.evaluate(() => { window.__touchInput.shoot = false; });
  await page.waitForTimeout(500);
  const normal = await page.evaluate(() => ({
    events: window.__fireShotEvents.length,
    active: window.__matchGame.stadium.ballRenderer.__fireShotFx.state.active,
    maxSpeed: window.__maxTestBallSpeed,
  }));

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.__matchGame?.stadium?.ballRenderer?.__fireShotFx, null, { timeout: 45000 });
  await page.waitForFunction(() => {
    const game = window.__matchGame;
    return game?.pitch?.matchStarted && !game.pitch.ballOutOfPlay;
  }, null, { timeout: 30000 });
  await giveBallToPlayer(0);
  await page.waitForTimeout(120);
  await page.evaluate(() => { window.__touchInput.shoot = true; });
  await page.waitForTimeout(300);
  const chargeStage = await page.evaluate(() => {
    const player = window.require("users").list[0].player;
    return {
      state: player?.states?.current?.name || String(player?.states?.current),
      time: player?.states?.time,
      hasBall: !!player?.hasBall,
      shoot: !!player?.controller?.shoot?.isActive,
    };
  });
  await page.waitForTimeout(1750);
  const releaseStage = await page.evaluate(() => {
    const player = window.require("users").list[0].player;
    return {
      state: player?.states?.current?.name || String(player?.states?.current),
      time: player?.states?.time,
      hasBall: !!player?.hasBall,
      shoot: !!player?.controller?.shoot?.isActive,
      speed: window.__matchGame.pitch.ball.speed,
      maxSpeed: window.__maxTestBallSpeed,
    };
  });
  await page.evaluate(() => { window.__touchInput.shoot = false; });
  await page.waitForTimeout(600);
  const chargedRuntime = await page.evaluate(() => {
    const fx = window.__matchGame.stadium.ballRenderer.__fireShotFx;
    return { events: window.__fireShotEvents, active: fx.state.active, aura: fx.parts.aura.visible, maxSpeed: window.__maxTestBallSpeed };
  });
  const charged = { ...chargedRuntime, chargeStage, releaseStage };
  await page.screenshot({ path: "/tmp/animal-cup-fire-shot.png" });
  await page.waitForTimeout(1400);
  const ended = await page.evaluate(() => {
    const fx = window.__matchGame.stadium.ballRenderer.__fireShotFx;
    return { active: fx.state.active, aura: fx.parts.aura.visible };
  });

  const ok = normal.events === 0 && !normal.active && charged.events.length === 1 &&
    charged.events[0].type === "fire" && charged.active && charged.aura &&
    !ended.active && !ended.aura && errors.length === 0;
  console.log(JSON.stringify({ ok, normal, charged, ended, errors }, null, 2));
  process.exitCode = ok ? 0 : 1;
} finally {
  await browser.close();
}
