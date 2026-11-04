import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { AccountPage } from "./account-page";

const mocks = vi.hoisted(() => ({
  useGroups: vi.fn(),
  createClient: vi.fn(),
  getUser: vi.fn(),
  resend: vi.fn(),
  updateUser: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("next/link", () => ({ default: "a" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/components/groups/group-provider", () => ({
  useGroups: mocks.useGroups,
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: mocks.createClient,
}));

function mockClient() {
  return {
    auth: {
      getUser: mocks.getUser,
      resend: mocks.resend,
      updateUser: mocks.updateUser,
    },
    from: () => ({
      update: (value: unknown) => {
        mocks.updateProfile(value);
        return { eq: vi.fn().mockResolvedValue({ error: null }) };
      },
    }),
  };
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createClient.mockImplementation(mockClient);
  mocks.useGroups.mockReturnValue({
    groups: [],
    isLoading: false,
    isSupabaseMode: true,
    persistenceError: "",
    userEmail: "nipuna@example.com",
    userFirstName: "Nipuna",
    userLastName: "Gamage",
  });
  mocks.getUser.mockResolvedValue({
    data: {
      user: {
        id: "user-1",
        email: "nipuna@example.com",
        created_at: "2026-01-02T00:00:00.000Z",
        email_confirmed_at: "2026-01-03T00:00:00.000Z",
      },
    },
    error: null,
  });
});

describe("account page", () => {
  it("prerenders without creating a Supabase client even in configured mode", () => {
    mocks.createClient.mockImplementation(() => {
      throw new Error("Supabase is not configured");
    });

    expect(renderToString(<AccountPage />)).toContain("Your account".toUpperCase());
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("renders demo mode without Supabase configuration or account requests", () => {
    mocks.useGroups.mockReturnValue({
      groups: [],
      isLoading: false,
      isSupabaseMode: false,
      persistenceError: "",
      userEmail: "",
      userFirstName: "",
      userLastName: "",
    });
    mocks.createClient.mockImplementation(() => {
      throw new Error("Supabase is not configured");
    });

    render(<AccountPage />);

    expect(screen.getByText("Demo mode")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Update password" }).hasAttribute("disabled")).toBe(true);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("displays the authenticated profile and supports editing names", async () => {
    render(<AccountPage />);

    expect(screen.getByRole("heading", { name: "Account" })).toBeTruthy();
    expect(screen.getAllByText("Nipuna Gamage").length).toBeGreaterThan(0);
    expect(screen.getAllByText("nipuna@example.com").length).toBeGreaterThan(0);
    expect(await screen.findByText("Verified")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Nipun" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mocks.updateProfile).toHaveBeenCalledWith({
        display_name: "Nipun Gamage",
        first_name: "Nipun",
        last_name: "Gamage",
      });
    });
    expect(await screen.findByText("Your profile was updated.")).toBeTruthy();
  });

  it("shows an unverified state from Supabase Auth", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "nipuna@example.com",
          created_at: "2026-01-02T00:00:00.000Z",
          email_confirmed_at: null,
        },
      },
      error: null,
    });

    render(<AccountPage />);

    expect(await screen.findByText("Not verified")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Verify email" })).toBeTruthy();
  });
});
