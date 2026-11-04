import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createElement,
  type MouseEvent as ReactMouseEvent,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountControls } from "./account-controls";

const mocks = vi.hoisted(() => ({
  useGroups: vi.fn(),
  signOut: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  pathname: "/",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
    onClick,
  }: {
    href: string;
    className?: string;
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
  }) => createElement(
    "a",
    {
      href,
      className,
      onClick: (event) => {
        event.preventDefault();
        onClick?.(event as ReactMouseEvent<HTMLAnchorElement>);
      },
    },
    children,
  ),
}));
vi.mock("next/image", () => ({
  default: (props: {
    src: string;
    alt: string;
    height: number;
    width: number;
    className: string;
    onError: () => void;
  }) => createElement("img", props),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
  usePathname: () => mocks.pathname,
}));
vi.mock("@/components/groups/group-provider", () => ({
  useGroups: mocks.useGroups,
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: mocks.signOut } }),
}));

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.pathname = "/";
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.useGroups.mockReturnValue({
    isSupabaseMode: true,
    userEmail: "member@example.com",
    userAvatarUrl: "",
  });
});

describe("account controls", () => {
  it("keeps sign-in and registration links in the header while signed out", () => {
    mocks.useGroups.mockReturnValue({
      isSupabaseMode: false,
      userEmail: "",
      userAvatarUrl: "",
    });

    render(<AccountControls displayName="Demo User" placement="header" />);

    expect(screen.getByRole("link", { name: "Sign In" }).getAttribute("href"))
      .toBe("/login");
    expect(screen.getByRole("link", { name: "Create Account" }).getAttribute("href"))
      .toBe("/signup");
  });

  it("shows only the avatar and full name in the header", () => {
    render(<AccountControls displayName="Member Example" placement="header" />);

    expect(screen.getByText("Member Example")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /account menu/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /my account/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /sign out/i })).toBeNull();
  });

  it("shows an avatar initials fallback and opens the sidebar account actions", () => {
    render(<AccountControls displayName="Member Example" placement="sidebar" />);

    expect(screen.getByText("Member Example")).toBeTruthy();
    expect(screen.getByText("ME")).toBeTruthy();
    expect(screen.getByText("Account")).toBeTruthy();

    const trigger = screen.getByRole("button", { name: "Account menu for Member Example" });
    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("region", { name: "Account menu" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /my account/i }).getAttribute("href"))
      .toBe("/account");
    expect(screen.getByRole("link", { name: "Settings" }).getAttribute("href"))
      .toBe("/settings");
    expect(screen.getByRole("separator")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeTruthy();
  });

  it("uses the profile photo when Supabase metadata provides one", () => {
    mocks.useGroups.mockReturnValue({
      isSupabaseMode: true,
      userEmail: "member@example.com",
      userAvatarUrl: "https://example.com/member.png",
    });

    const { container } = render(
      <AccountControls displayName="Member Example" placement="header" />,
    );

    expect(container.querySelector(".profile-photo")?.getAttribute("src"))
      .toBe("https://example.com/member.png");
  });

  it("closes the menu on outside click, route change, and Escape", async () => {
    const view = render(<AccountControls displayName="Member Example" placement="sidebar" />);
    const trigger = screen.getByRole("button", { name: "Account menu for Member Example" });

    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("region", { name: "Account menu" })).toBeNull();

    fireEvent.click(trigger);
    mocks.pathname = "/groups";
    view.rerender(<AccountControls displayName="Member Example" placement="sidebar" />);
    await waitFor(() => expect(screen.queryByRole("region", { name: "Account menu" })).toBeNull());

    mocks.pathname = "/";
    view.rerender(<AccountControls displayName="Member Example" placement="sidebar" />);
    expect(screen.queryByRole("region", { name: "Account menu" })).toBeNull();

    const routeTrigger = screen.getByRole("button", { name: "Account menu for Member Example" });
    fireEvent.click(routeTrigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("region", { name: "Account menu" })).toBeNull();
    expect(document.activeElement).toBe(routeTrigger);
  });

  it("closes after navigating to My Account", () => {
    render(<AccountControls displayName="Member Example" placement="sidebar" />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu for Member Example" }));
    fireEvent.click(screen.getByRole("link", { name: /my account/i }));

    expect(screen.queryByRole("region", { name: "Account menu" })).toBeNull();
  });

  it("shows a loading state and redirects after successful sign out", async () => {
    let finishSignOut: (result: { error: null }) => void = () => undefined;
    mocks.signOut.mockReturnValue(new Promise((resolve) => { finishSignOut = resolve; }));

    render(<AccountControls displayName="Member Example" placement="sidebar" />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu for Member Example" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));

    expect(screen.getByRole("button", { name: "Signing out…" }).hasAttribute("disabled"))
      .toBe(true);
    finishSignOut({ error: null });

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/login");
      expect(mocks.refresh).toHaveBeenCalled();
    });
  });

  it("shows Supabase sign-out errors without redirecting", async () => {
    mocks.signOut.mockResolvedValue({ error: { message: "Session could not be revoked" } });

    render(<AccountControls displayName="Member Example" placement="sidebar" />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu for Member Example" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));

    expect((await screen.findByRole("alert")).textContent)
      .toContain("Could not sign out. Session could not be revoked");
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("shows unexpected sign-out failures without redirecting", async () => {
    mocks.signOut.mockRejectedValue(new Error("Network unavailable"));

    render(<AccountControls displayName="Member Example" placement="sidebar" />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu for Member Example" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));

    expect((await screen.findByRole("alert")).textContent)
      .toContain("Could not sign out. Network unavailable");
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
