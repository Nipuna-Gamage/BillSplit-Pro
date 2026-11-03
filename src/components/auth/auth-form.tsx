"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { signIn, signUp, type AuthFormState } from "@/app/auth/actions";

type AuthFormProps = {
  mode: "login" | "signup";
  isSupabaseConfigured: boolean;
};

const initialState: AuthFormState = {};

export function AuthForm({ mode, isSupabaseConfigured }: AuthFormProps) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isSignup = mode === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  function validateSignup(event: FormEvent<HTMLFormElement>) {
    if (!isSignup) {
      return;
    }

    const form = event.currentTarget;
    const values = new FormData(form);
    const firstName = String(values.get("firstName") ?? "").trim();
    const lastName = String(values.get("lastName") ?? "").trim();
    const email = String(values.get("email") ?? "").trim();
    const password = String(values.get("password") ?? "");
    const confirmPassword = form.querySelector<HTMLInputElement>("#confirmPassword")?.value ?? "";
    const errors: Record<string, string> = {};

    if (!firstName) errors.firstName = "Enter your first name.";
    if (!lastName) errors.lastName = "Enter your last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (password.length < 8) errors.password = "Use at least 8 characters.";
    if (!confirmPassword) {
      errors.confirmPassword = "Confirm your password.";
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      event.preventDefault();
    }
  }

  function errorFor(field: string) {
    return validationErrors[field] ? (
      <span className="field-error" id={`${field}-error`} role="alert">{validationErrors[field]}</span>
    ) : null;
  }

  return (
    <main className="auth-screen">
      <section aria-labelledby="auth-title" className="auth-card">
        <Link className="auth-brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            <span /><span /><span /><span />
          </span>
          <span><strong>BillSplit</strong> <em>Pro</em></span>
        </Link>
        <p className="panel-kicker">{isSignup ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}</p>
        <h1 id="auth-title">{isSignup ? "Create an account" : "Sign in"}</h1>
        <p className="auth-description">
          {isSignup
            ? "Groups you create are yours to share with invited members."
            : "Sign in to access your saved groups and expenses."}
        </p>

        {!isSupabaseConfigured ? (
          <p className="form-error" role="alert">
            Authentication is unavailable because Supabase is not configured.
            Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            to enable sign-in and account creation.
          </p>
        ) : null}
        {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
        {state.message ? <p className="form-success" role="status">{state.message}</p> : null}

        <form action={formAction} className="auth-form" onSubmit={validateSignup}>
          {isSignup ? (
            <>
              <label className="form-field">
                <span>First name</span>
                <input aria-describedby={validationErrors.firstName ? "firstName-error" : undefined} autoComplete="given-name" name="firstName" required type="text" />
                {errorFor("firstName")}
              </label>
              <label className="form-field">
                <span>Last name</span>
                <input aria-describedby={validationErrors.lastName ? "lastName-error" : undefined} autoComplete="family-name" name="lastName" required type="text" />
                {errorFor("lastName")}
              </label>
            </>
          ) : null}
          <label className="form-field">
            <span>Email address</span>
            <input aria-describedby={validationErrors.email ? "email-error" : undefined} autoComplete="email" name="email" required type="email" />
            {errorFor("email")}
          </label>
          <label className="form-field">
            <span>Password</span>
            <input
              aria-label="Password"
              aria-describedby={validationErrors.password ? "password-error" : undefined}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={isSignup ? 8 : undefined}
              name="password"
              required
              type={showPassword ? "text" : "password"}
            />
            {isSignup ? (
              <button aria-pressed={showPassword} className="password-toggle" onClick={() => setShowPassword((shown) => !shown)} type="button">
                {showPassword ? "Hide password" : "Show password"}
              </button>
            ) : null}
            {errorFor("password")}
          </label>
          {isSignup ? (
            <label className="form-field">
              <span>Confirm password</span>
              <input aria-describedby={validationErrors.confirmPassword ? "confirmPassword-error" : undefined} aria-label="Confirm password" autoComplete="new-password" id="confirmPassword" required type={showConfirmPassword ? "text" : "password"} />
              <button aria-pressed={showConfirmPassword} className="password-toggle" onClick={() => setShowConfirmPassword((shown) => !shown)} type="button">
                {showConfirmPassword ? "Hide password" : "Show password"}
              </button>
              {errorFor("confirmPassword")}
            </label>
          ) : null}
          <button
            className="primary-action auth-submit"
            disabled={pending || !isSupabaseConfigured}
            type="submit"
          >
            {pending
              ? "Please wait…"
              : isSignup
                ? "Create account"
                : "Sign in"}
          </button>
        </form>
        {!isSignup ? (
          <p className="auth-switch">
            <Link href="/forgot-password">Forgot your password?</Link>
          </p>
        ) : null}
        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New to BillSplit Pro?"}{" "}
          <Link href={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </main>
  );
}
