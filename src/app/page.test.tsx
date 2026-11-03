import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GroupProvider } from "@/components/groups/group-provider";
import Home from "./page";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/",
}));

function renderHome() {
  return render(
    <GroupProvider>
      <Home />
    </GroupProvider>,
  );
}

describe("home page", () => {
  it.each([
    ["04:59", "Good morning"],
    ["05:00", "Good morning"],
    ["11:59", "Good morning"],
    ["12:00", "Good afternoon"],
    ["16:59", "Good afternoon"],
    ["17:00", "Good evening"],
    ["23:59", "Good evening"],
  ])("renders the %s greeting", (time, greeting) => {
    vi.useFakeTimers();
    const [hours, minutes] = time.split(":").map(Number);
    vi.setSystemTime(new Date(2026, 10, 3, hours, minutes, 16));
    renderHome();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: new RegExp(`${greeting}, nipun`, "i"),
      }),
    ).toBeTruthy();
    expect(screen.getByText("Tuesday, November 3, 2026")).toBeTruthy();
  });

  it("clearly identifies the dashboard data as a demo", () => {
    renderHome();

    expect(screen.getByRole("note").textContent).toContain(
      "Sample data only — nothing here is saved or real.",
    );
  });

  it("shows the current user's calculated balance from demo expenses", () => {
    renderHome();

    expect(
      within(screen.getByRole("region", { name: "Expense summary" })).getByText(
        "LKR 2,940.00",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Based on equal splits of demo expenses")).toBeTruthy();
  });

  it("provides labeled desktop and mobile navigation", () => {
    renderHome();

    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeTruthy();
    expect(
      within(
        screen.getByRole("navigation", { name: "Main navigation" }),
      )
        .getByRole("link", { name: "Expenses" })
        .getAttribute("href"),
    ).toBe("/#recent-activity");
    expect(
      within(screen.getByRole("navigation", { name: "Main navigation" }))
        .getByRole("link", { name: "Settings" })
        .getAttribute("href"),
    ).toBe("/settings");
    expect(
      within(screen.getByRole("navigation", { name: "Mobile navigation" }))
        .getByRole("link", { name: "Settings" })
        .getAttribute("href"),
    ).toBe("/settings");
  });

  it("labels the search field for assistive technology", () => {
    renderHome();

    expect(screen.getByRole("textbox", { name: "Search expenses" })).toBeTruthy();
  });
});
