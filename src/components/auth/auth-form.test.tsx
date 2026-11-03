import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "./auth-form";

vi.mock("next/link", () => ({ default: "a" }));
vi.mock("@/app/auth/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

afterEach(cleanup);

describe("authentication forms", () => {
  it("explains missing Supabase configuration and disables login", () => {
    render(<AuthForm mode="login" isSupabaseConfigured={false} />);

    expect(screen.getByRole("alert").textContent).toContain(
      "Authentication is unavailable because Supabase is not configured.",
    );
    expect(screen.getByRole("button", { name: "Sign in" }).hasAttribute("disabled"))
      .toBe(true);
    expect(screen.getByRole("link", { name: "Create an account" }).getAttribute("href"))
      .toBe("/signup");
  });

  it("allows registration when Supabase is configured and links back to login", () => {
    render(<AuthForm mode="signup" isSupabaseConfigured />);

    expect(screen.queryByRole("alert")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Create account" }).hasAttribute("disabled"),
    ).toBe(false);
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href"))
      .toBe("/login");
    expect(screen.getByLabelText("First name")).toBeTruthy();
    expect(screen.getByLabelText("Last name")).toBeTruthy();
    expect(screen.getByLabelText("Confirm password")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows individual signup validation errors and does not submit", async () => {
    render(<AuthForm mode="signup" isSupabaseConfigured />);

    fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form")!);

    expect(screen.getByText("Enter your first name.")).toBeTruthy();
    expect(screen.getByText("Enter your last name.")).toBeTruthy();
    expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
    expect(screen.getByText("Use at least 8 characters.")).toBeTruthy();
    expect(screen.getByText("Confirm your password.")).toBeTruthy();
  });

  it("toggles password visibility accessibly", () => {
    render(<AuthForm mode="signup" isSupabaseConfigured />);

    const password = screen.getByLabelText("Password");
    expect(password.getAttribute("type")).toBe("password");
    fireEvent.click(screen.getAllByRole("button", { name: "Show password" })[0]);
    expect(password.getAttribute("type")).toBe("text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeTruthy();
  });
});
