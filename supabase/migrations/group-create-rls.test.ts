import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sharingMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase",
    "migrations",
    "20261022150000_add_group_sharing_and_invitations.sql",
  ),
  "utf8",
).replace(/\r\n/g, "\n");

describe("shared group creation RLS", () => {
  it("allows authenticated users to insert only groups they own", () => {
    expect(sharingMigration).toMatch(
      /grant select,\s*insert on table public\.shared_groups to authenticated;/i,
    );
    expect(sharingMigration).toMatch(
      /create policy "Users can create groups they own"\s+on public\.shared_groups\s+for insert\s+to authenticated\s+with check\s*\(\s*owner_id\s*=\s*\(select auth\.uid\(\)\)\s*\);/i,
    );
    expect(sharingMigration).not.toMatch(
      /on public\.shared_groups\s+for insert[\s\S]{0,300}with check\s*\(\s*true\s*\)/i,
    );
  });
});
