"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useGroups } from "@/components/groups/group-provider";
import { createClient } from "@/lib/supabase/client";

type AccountUser = {
  id: string;
  email: string;
  createdAt: string;
  emailConfirmedAt: string | null;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toLocaleUpperCase();
}

function formatAccountDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
  }).format(date);
}

export function AccountPage() {
  const {
    groups,
    isLoading,
    isSupabaseMode,
    persistenceError,
    userEmail,
    userFirstName,
    userLastName,
    currency,
  } = useGroups();
  const [accountUser, setAccountUser] = useState<AccountUser | null>(null);
  const [pageError, setPageError] = useState("");
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(userFirstName);
  const [lastName, setLastName] = useState(userLastName);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profilePending, setProfilePending] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      if (!isSupabaseMode) {
        setIsAccountLoading(false);
        return;
      }

      const { data, error } = await createClient().auth.getUser();
      if (!active) {
        return;
      }

      if (error) {
        setPageError(`Could not load your account. ${error.message}`);
        setIsAccountLoading(false);
        return;
      }

      if (!data.user) {
        setPageError("Your session has expired. Sign in again to view your account.");
        setIsAccountLoading(false);
        return;
      }

      setAccountUser({
        id: data.user.id,
        email: data.user.email ?? userEmail,
        createdAt: data.user.created_at,
        emailConfirmedAt: data.user.email_confirmed_at ?? null,
      });
      setIsAccountLoading(false);
    }

    void loadAccount();
    return () => {
      active = false;
    };
  }, [isSupabaseMode, userEmail]);

  const displayName = [userFirstName, userLastName].filter(Boolean).join(" ")
    || userEmail.split("@")[0]?.replace(/[._-]+/g, " ")
    || "Demo account";
  const email = accountUser?.email || userEmail;
  const emailStatus = accountUser?.emailConfirmedAt
    ? "Verified"
    : accountUser
      ? "Not verified"
      : "Verification pending";

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseMode) return;
    setProfileError("");
    setProfileMessage("");
    const nextFirstName = firstName.trim();
    const nextLastName = lastName.trim();

    if (!nextFirstName || !nextLastName) {
      setProfileError("First name and last name are required.");
      return;
    }

    setProfilePending(true);
    const { error } = await createClient()
      .from("profiles")
      .update({
        first_name: nextFirstName,
        last_name: nextLastName,
        display_name: `${nextFirstName} ${nextLastName}`,
      })
      .eq("id", accountUser?.id ?? "");

    if (error) {
      setProfileError(`Could not save your profile. ${error.message}`);
    } else {
      setProfileMessage("Your profile was updated.");
      setIsEditing(false);
    }
    setProfilePending(false);
  }

  async function resendVerification() {
    if (!isSupabaseMode) return;
    setVerificationPending(true);
    setVerificationError("");
    setVerificationMessage("");
    if (!email) {
      setVerificationError("No account email is available.");
      setVerificationPending(false);
      return;
    }

    const { error } = await createClient().auth.resend({ type: "signup", email });
    if (error) {
      setVerificationError(`Could not send a verification email. ${error.message}`);
    } else {
      setVerificationMessage("A verification email was requested. Check your inbox if delivery is configured.");
    }
    setVerificationPending(false);
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseMode) return;
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordError("Use a password with at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordPending(true);
    const { error } = await createClient().auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordError(`Could not update your password. ${error.message}`);
    } else {
      setPasswordMessage("Your password was updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordPending(false);
  }

  return (
    <div className="settings-screen">
      <div className="settings-content account-page-content">
        <div className="settings-heading">
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h1>Account</h1>
          <p>Manage your profile, verification, security, and workspace access.</p>
        </div>

        {pageError || persistenceError ? (
          <p className="form-error" role="alert">{pageError || persistenceError}</p>
        ) : null}
        {isAccountLoading || isLoading ? <p className="form-success" role="status">Loading your account…</p> : null}

        <section aria-labelledby="account-profile-title" className="settings-panel">
          <div className="settings-panel-heading">
            <div><p className="panel-kicker">PROFILE</p><h2 id="account-profile-title">Personal information</h2></div>
          </div>
          <div className="account-profile-hero">
            <span aria-hidden="true" className="account-profile-avatar">{initials(displayName)}</span>
            <div><strong>{displayName}</strong><span>{email || "No email address connected"}</span></div>
            <span className={`settings-status${email ? " settings-status-active" : ""}`}>{email ? "Connected" : "Demo mode"}</span>
          </div>
          {!isEditing ? (
            <>
              <dl className="account-details-list">
                <div><dt>First name</dt><dd>{userFirstName || "Not provided"}</dd></div>
                <div><dt>Last name</dt><dd>{userLastName || "Not provided"}</dd></div>
                <div><dt>Full name</dt><dd>{displayName}</dd></div>
                <div><dt>Registered email</dt><dd>{email || "Not connected"}</dd></div>
                <div><dt>Account created</dt><dd>{accountUser ? formatAccountDate(accountUser.createdAt) : "Not available"}</dd></div>
              </dl>
              <div className="settings-actions">
                {email ? <button className="primary-action" onClick={() => { setFirstName(userFirstName); setLastName(userLastName); setIsEditing(true); }} type="button">Edit profile</button> : null}
              </div>
            </>
          ) : (
            <form className="account-edit-form" onSubmit={saveProfile}>
              <label className="form-field"><span>First name</span><input autoComplete="given-name" onChange={(event) => setFirstName(event.target.value)} value={firstName} /></label>
              <label className="form-field"><span>Last name</span><input autoComplete="family-name" onChange={(event) => setLastName(event.target.value)} value={lastName} /></label>
              {profileError ? <p className="form-error" role="alert">{profileError}</p> : null}
              <div className="settings-actions">
                <button className="primary-action" disabled={profilePending} type="submit">{profilePending ? "Saving…" : "Save changes"}</button>
                <button className="settings-secondary-action" onClick={() => { setFirstName(userFirstName); setLastName(userLastName); setIsEditing(false); }} type="button">Cancel</button>
              </div>
            </form>
          )}
          {profileMessage ? <p className="form-success" role="status">{profileMessage}</p> : null}
        </section>

        <section aria-labelledby="verification-title" className="settings-panel">
          <div className="settings-panel-heading">
            <div><p className="panel-kicker">EMAIL SECURITY</p><h2 id="verification-title">Email verification</h2></div>
          </div>
          <div className="account-verification-row">
            <span className={`account-status-dot${emailStatus === "Verified" ? " account-status-dot-verified" : ""}`} />
            <div><strong>{emailStatus}</strong><span>{emailStatus === "Verified" ? "Your email is verified with Supabase Auth." : "Verification status comes from Supabase Auth."}</span></div>
          </div>
          {emailStatus !== "Verified" && email ? <button className="settings-secondary-action" disabled={verificationPending} onClick={() => void resendVerification()} type="button">{verificationPending ? "Sending…" : "Verify email"}</button> : null}
          {verificationMessage ? <p className="form-success" role="status">{verificationMessage}</p> : null}
          {verificationError ? <p className="form-error" role="alert">{verificationError}</p> : null}
        </section>

        <section aria-labelledby="security-title" className="settings-panel">
          <div className="settings-panel-heading">
            <div><p className="panel-kicker">SECURITY</p><h2 id="security-title">Change password</h2></div>
          </div>
          <form className="account-edit-form" onSubmit={changePassword}>
            <label className="form-field"><span>New password</span><input autoComplete="new-password" minLength={8} onChange={(event) => setNewPassword(event.target.value)} required type="password" value={newPassword} /></label>
            <label className="form-field"><span>Confirm new password</span><input autoComplete="new-password" onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} /></label>
            {passwordError ? <p className="form-error" role="alert">{passwordError}</p> : null}
            {passwordMessage ? <p className="form-success" role="status">{passwordMessage}</p> : null}
            <button className="primary-action" disabled={passwordPending || !email} type="submit">{passwordPending ? "Updating…" : "Update password"}</button>
          </form>
        </section>

        <section aria-labelledby="workspace-title" className="settings-panel">
          <div className="settings-panel-heading">
            <div><p className="panel-kicker">WORKSPACE</p><h2 id="workspace-title">Shared spaces</h2></div>
          </div>
          <div className="account-stat-grid"><div><strong>{groups.length}</strong><span>{groups.length === 1 ? "Group" : "Groups"}</span></div><div><strong>{groups.reduce((total, group) => total + group.members.length, 0)}</strong><span>Members</span></div></div>
          <div className="settings-actions"><Link className="primary-action" href="/groups">Manage groups</Link><Link className="settings-secondary-action" href="/settings">Open settings</Link></div>
        </section>

        <section aria-labelledby="account-actions-title" className="settings-panel">
          <div className="settings-panel-heading">
            <div><p className="panel-kicker">ACCOUNT ACTIONS</p><h2 id="account-actions-title">Password recovery</h2></div>
          </div>
          <div className="settings-detail-row">
            <div>
              <strong>Password reset</strong>
              <span>Request a password reset for your account.</span>
            </div>
            <Link className="settings-inline-link" href="/forgot-password">Reset password <span aria-hidden="true">→</span></Link>
          </div>
        </section>

        <footer className="settings-footer"><span>BillSplit Pro <span aria-hidden="true">·</span> A clearer way to share.</span><span>{isSupabaseMode ? "Shared workspace" : "Demo workspace"} <span aria-hidden="true">·</span> {currency}</span></footer>
      </div>
    </div>
  );
}
