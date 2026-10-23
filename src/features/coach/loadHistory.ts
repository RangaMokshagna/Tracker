import { getAllRuns, getRunSplits } from "../../services/sqlite";
import type { Run } from "./types";

/** Reads saved sessions, not demo history. Identity/route data never leaves this adapter. */
export async function loadCoachHistory(account: string): Promise<Run[]> {
  const rows = (await getAllRuns()).filter(
    (row) =>
      row.userId === account &&
      row.finishedAt &&
      row.distanceMeters > 0 &&
      row.durationSeconds > 0,
  );
  const history: Run[] = [];
  for (let offset = 0; offset < rows.length; offset += 20) {
    const batch = await Promise.all(
      rows.slice(offset, offset + 20).map(async (row) => {
        const splits = await getRunSplits(row.id).catch(() => []);
        return {
          id: row.id,
          startedAt: row.startedAt,
          distanceKm: row.distanceMeters / 1000,
          durationMin: row.durationSeconds / 60,
          splits: splits.map((split) => ({
            distanceKm: split.distanceMeters / 1000,
            durationMin: split.durationSeconds / 60,
          })),
        };
      }),
    );
    history.push(...batch);
  }
  return history;
}
