#!/usr/bin/env node
import { chromium } from "playwright-core";
import { PLAYABLE_TEAMS } from "../app/data/teams.js";

const baseUrl = process.argv[2] || "http://localhost:13000";
const browser = await chromium.launch({ channel: "chrome", headless: false });
const results = [];
const errors = [];

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error" && !/audio|favicon/i.test(message.text())) errors.push(message.text());
  });

  for (const { id } of PLAYABLE_TEAMS) {
    const opponent = id === "france" ? "england" : "france";
    await page.goto(`${baseUrl}/match?red=${id}&blue=${opponent}&play=1`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      const game = window.__matchGame;
      return game?.pitch?.matchStarted && !game.pitch.ballOutOfPlay && game.stadium?.ballRenderer?.__teamShotFx;
    }, null, { timeout: 45000 });

    await page.evaluate(() => {
      const game = window.__matchGame;
      const user = window.require("users").list[0];
      const player = game.pitch.redTeam.fieldPlayers[0];
      if (user.team !== game.pitch.redTeam) user.changeTeam(game.pitch.redTeam);
      if (user.player !== player) user.takeControl(player);
      game.pitch.ball.placeAtPosition(player.position.x, player.position.y, 0);
      player.trap(game.pitch.ball);
      player.states.change(window.require("players/states").HumanDribble);
      window.__touchInput.active = true;
      window.__touchInput.vx = 0;
      window.__touchInput.vy = 0;
      window.__touchInput.shoot = false;
      window.__teamShotEvent = null;
      window.addEventListener("ab-shot", (event) => { window.__teamShotEvent = event.detail; }, { once: true });
    });
    await page.waitForTimeout(120);
    await page.evaluate(() => { window.__touchInput.shoot = true; });
    await page.waitForTimeout(2050);
    await page.evaluate(() => { window.__touchInput.shoot = false; });
    await page.waitForTimeout(600);

    results.push(await page.evaluate((team) => {
      const fx = window.__matchGame.stadium.ballRenderer.__teamShotFx;
      return {
        team,
        eventTeam: window.__teamShotEvent?.team,
        eventType: window.__teamShotEvent?.type,
        configuredType: fx.profiles[team]?.key,
        activeType: fx.state.profile?.key,
        visible: fx.parts.aura.visible,
      };
    }, id));
  }

  const ok = errors.length === 0 && results.length === PLAYABLE_TEAMS.length && results.every((result) =>
    result.eventTeam === result.team && result.eventType === result.configuredType &&
    result.activeType === result.configuredType && result.visible
  );
  console.log(JSON.stringify({ ok, teams: results.length, results, errors }, null, 2));
  process.exitCode = ok ? 0 : 1;
} finally {
  await browser.close();
}
