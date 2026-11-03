import { AppShell } from "@/components/app-shell";
import { AccountPage } from "@/components/account/account-page";

export const metadata = { title: "Account | BillSplit Pro" };

export default function Page() {
  return <AppShell><AccountPage /></AppShell>;
}
