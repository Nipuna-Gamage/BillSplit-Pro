import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const profileMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase",
    "migrations",
    "20261103220000_add_profile_names.sql",
  ),
  "utf8",
).replace(/\r\n/g, "\n");

describe("profile name migration", () => {
  it("adds names and populates new profiles from auth metadata", () => {
    expect(profileMigration).toMatch(
      /add column if not exists first_name text/i,
    );
    expect(profileMigration).toMatch(
      /add column if not exists last_name text/i,
    );
    expect(profileMigration).toMatch(
      /new\.raw_user_meta_data->>'first_name'/i,
    );
    expect(profileMigration).toMatch(
      /insert into public\.profiles \(id, display_name, first_name, last_name\)/i,
    );
  });
});
