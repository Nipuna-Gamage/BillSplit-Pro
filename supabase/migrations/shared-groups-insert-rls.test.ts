import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repairMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase",
    "migrations",
    "20261103193000_repair_shared_groups_insert_rls.sql",
  ),
  "utf8",
).replace(/\r\n/g, "\n");

describe("shared group insert RLS repair", () => {
  it("reasserts authenticated ownership checks without opening inserts", () => {
    expect(repairMigration).toMatch(
      /alter table public\.shared_groups enable row level security;/i,
    );
    expect(repairMigration).toMatch(
      /grant select,\s*insert on table public\.shared_groups to authenticated;/i,
    );
    expect(repairMigration).toMatch(
      /create policy "Users can create groups they own"\s+on public\.shared_groups\s+for insert\s+to authenticated\s+with check\s*\(\s*owner_id\s*=\s*\(select auth\.uid\(\)\)\s*\);/i,
    );
    expect(repairMigration).not.toMatch(
      /with check\s*\(\s*true\s*\)/i,
    );
  });
});
