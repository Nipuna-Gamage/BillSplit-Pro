import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { SettingsPage } from "@/components/settings/settings-page";

export const metadata: Metadata = {
  title: "Settings | BillSplit Pro",
};

export default function Page() {
  return (
    <AppShell>
      <SettingsPage />
    </AppShell>
  );
}
