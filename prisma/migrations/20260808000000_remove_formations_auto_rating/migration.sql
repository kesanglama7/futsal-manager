-- DropForeignKey
ALTER TABLE "MatchTeam" DROP CONSTRAINT "MatchTeam_formationId_fkey";

-- AlterTable
ALTER TABLE "MatchTeam" DROP COLUMN "formationId";

-- DropTable
DROP TABLE "Formation";

-- DropEnum
DROP TYPE "FORMATION_TYPE";

-- Backfill player ratings from the four stats (derived rating).
UPDATE "Player"
SET "rating" = GREATEST(1, LEAST(99, ROUND((pace + shooting + passing + defending) / 4.0)::int));
