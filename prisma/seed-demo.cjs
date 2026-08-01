/**
 * Seeds demo data for the redesign review: two teams, rosters with stats,
 * 6-slot formations, and a finished match with lineups + goals.
 *
 * Run: node prisma/seed-demo.cjs
 * (Safe to re-run: wipes app data, keeps users.)
 */
require("dotenv").config();
const { Pool } = require("pg");

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Reset app data (keep users).
  await pool.query('DELETE FROM "MatchEvent"');
  await pool.query('DELETE FROM "MatchTeam"');
  await pool.query('DELETE FROM "Match"');
  await pool.query('DELETE FROM "Formation"');
  await pool.query('DELETE FROM "Player"');
  await pool.query('DELETE FROM "Team"');
  await pool.query('UPDATE "User" SET "teamId" = NULL');

  const now = new Date();
  const iso = (d) => d.toISOString();

  // --- Teams ---
  const { rows: homeRows } = await pool.query(
    `INSERT INTO "Team" (name, logo, "createdAt", "updatedAt") VALUES ($1, NULL, $2, $2) RETURNING id`,
    ["Real Madrid Futsal", iso(now)]
  );
  const { rows: awayRows } = await pool.query(
    `INSERT INTO "Team" (name, logo, "createdAt", "updatedAt") VALUES ($1, NULL, $2, $2) RETURNING id`,
    ["FC Barcelona Futsal", iso(now)]
  );
  const homeId = homeRows[0].id;
  const awayId = awayRows[0].id;

  // --- Players ---
  const homeNames = [
    ["Carlos Ruiz", 1, "GOALKEEPER", 82, 40, 30, 62, 85],
    ["Diego Lopez", 2, "DEFENDER", 78, 70, 55, 72, 80],
    ["Marco Silva", 3, "DEFENDER", 76, 68, 50, 74, 82],
    ["Javier Moreno", 4, "WINGER", 84, 88, 82, 78, 45],
    ["Andres Gil", 5, "WINGER", 83, 90, 78, 75, 42],
    ["Pablo Herrera", 6, "PIVOT", 86, 80, 90, 85, 55],
  ];
  const awayNames = [
    ["Lucas Fernandez", 1, "GOALKEEPER", 80, 38, 28, 60, 84],
    ["Mateo Costa", 2, "DEFENDER", 77, 66, 52, 70, 79],
    ["Rafael Ortiz", 3, "DEFENDER", 75, 65, 48, 72, 81],
    ["Sergio Vidal", 4, "WINGER", 82, 87, 80, 76, 44],
    ["Enzo Ramirez", 5, "WINGER", 81, 89, 76, 74, 41],
    ["Luis Cabrera", 6, "PIVOT", 85, 78, 88, 83, 54],
  ];

  const homePlayerIds = [];
  const awayPlayerIds = [];

  for (const [name, jersey, position, rating, pace, shooting, passing, defending] of homeNames) {
    const { rows } = await pool.query(
      `INSERT INTO "Player" (name, jersey, position, photo, "teamId", rating, pace, shooting, passing, defending, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,NULL,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING id`,
      [name, jersey, position, homeId, rating, pace, shooting, passing, defending, iso(now)]
    );
    homePlayerIds.push(rows[0].id);
  }
  for (const [name, jersey, position, rating, pace, shooting, passing, defending] of awayNames) {
    const { rows } = await pool.query(
      `INSERT INTO "Player" (name, jersey, position, photo, "teamId", rating, pace, shooting, passing, defending, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,NULL,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING id`,
      [name, jersey, position, awayId, rating, pace, shooting, passing, defending, iso(now)]
    );
    awayPlayerIds.push(rows[0].id);
  }

  // --- Formations (6 slots) ---
  const homeFormation = [
    { slotId: "gk", x: 50, y: 90, position: "GOALKEEPER", playerId: homePlayerIds[0] },
    { slotId: "d1", x: 30, y: 62, position: "DEFENDER", playerId: homePlayerIds[1] },
    { slotId: "d2", x: 70, y: 62, position: "DEFENDER", playerId: homePlayerIds[2] },
    { slotId: "w1", x: 30, y: 35, position: "WINGER", playerId: homePlayerIds[3] },
    { slotId: "w2", x: 70, y: 35, position: "WINGER", playerId: homePlayerIds[4] },
    { slotId: "p", x: 50, y: 15, position: "PIVOT", playerId: homePlayerIds[5] },
  ];
  const awayFormation = [
    { slotId: "gk", x: 50, y: 90, position: "GOALKEEPER", playerId: awayPlayerIds[0] },
    { slotId: "d1", x: 30, y: 62, position: "DEFENDER", playerId: awayPlayerIds[1] },
    { slotId: "d2", x: 70, y: 62, position: "DEFENDER", playerId: awayPlayerIds[2] },
    { slotId: "w1", x: 30, y: 35, position: "WINGER", playerId: awayPlayerIds[3] },
    { slotId: "w2", x: 70, y: 35, position: "WINGER", playerId: awayPlayerIds[4] },
    { slotId: "p", x: 50, y: 15, position: "PIVOT", playerId: awayPlayerIds[5] },
  ];

  const { rows: homeFormRows } = await pool.query(
    `INSERT INTO "Formation" ("teamId", type, name, positions, "createdAt", "updatedAt") VALUES ($1,'PRESET','2-2-1 Diamond',$2,$3,$3) RETURNING id`,
    [homeId, JSON.stringify(homeFormation), iso(now)]
  );
  const { rows: awayFormRows } = await pool.query(
    `INSERT INTO "Formation" ("teamId", type, name, positions, "createdAt", "updatedAt") VALUES ($1,'PRESET','2-2-1 Diamond',$2,$3,$3) RETURNING id`,
    [awayId, JSON.stringify(awayFormation), iso(now)]
  );

  // --- Finished match (scheduled yesterday, finished) ---
  const scheduledAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const { rows: matchRows } = await pool.query(
    `INSERT INTO "Match" ("homeTeamId", "awayTeamId", "scheduledAt", venue, status, "homeScore", "awayScore", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,'Arena Futsal Hall','FINISHED',3,2,$4,$4) RETURNING id`,
    [homeId, awayId, iso(scheduledAt), iso(now)]
  );
  const matchId = matchRows[0].id;

  // MatchTeams (lineups) with formation
  await pool.query(
    `INSERT INTO "MatchTeam" ("matchId", "teamId", side, "formationId", positions, "createdAt", "updatedAt")
     VALUES ($1,$2,'HOME',$3,$4,$5,$5)`,
    [matchId, homeId, homeFormRows[0].id, JSON.stringify(homeFormation), iso(now)]
  );
  await pool.query(
    `INSERT INTO "MatchTeam" ("matchId", "teamId", side, "formationId", positions, "createdAt", "updatedAt")
     VALUES ($1,$2,'AWAY',$3,$4,$5,$5)`,
    [matchId, awayId, awayFormRows[0].id, JSON.stringify(awayFormation), iso(now)]
  );

  // Goals: home 3 (min 5, 23, 40), away 2 (min 12, 34)
  const goals = [
    { teamId: homeId, playerId: homePlayerIds[3], minute: 5 },
    { teamId: awayId, playerId: awayPlayerIds[4], minute: 12 },
    { teamId: homeId, playerId: homePlayerIds[5], minute: 23 },
    { teamId: awayId, playerId: awayPlayerIds[3], minute: 34 },
    { teamId: homeId, playerId: homePlayerIds[4], minute: 40 },
  ];
  for (const g of goals) {
    await pool.query(
      `INSERT INTO "MatchEvent" ("matchId", "teamId", type, minute, "playerId", "createdAt")
       VALUES ($1,$2,'GOAL',$3,$4,$5)`,
      [matchId, g.teamId, g.minute, g.playerId, iso(now)]
    );
  }

  // --- Upcoming match ---
  const upcoming = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const { rows: upRows } = await pool.query(
    `INSERT INTO "Match" ("homeTeamId", "awayTeamId", "scheduledAt", venue, status, "homeScore", "awayScore", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,'Central Arena','SCHEDULED',NULL,NULL,$4,$4) RETURNING id`,
    [awayId, homeId, iso(upcoming), iso(now)]
  );
  const upId = upRows[0].id;
  await pool.query(
    `INSERT INTO "MatchTeam" ("matchId", "teamId", side, "formationId", positions, "createdAt", "updatedAt")
     VALUES ($1,$2,'HOME',$3,$4,$5,$5)`,
    [upId, awayId, awayFormRows[0].id, JSON.stringify(awayFormation), iso(now)]
  );
  await pool.query(
    `INSERT INTO "MatchTeam" ("matchId", "teamId", side, "formationId", positions, "createdAt", "updatedAt")
     VALUES ($1,$2,'AWAY',$3,$4,$5,$5)`,
    [upId, homeId, homeFormRows[0].id, JSON.stringify(homeFormation), iso(now)]
  );

  console.log(`✅ Seeded 2 teams, 12 players, 2 formations, 2 matches (1 finished 3-2, 1 upcoming)`);
  await pool.end();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
