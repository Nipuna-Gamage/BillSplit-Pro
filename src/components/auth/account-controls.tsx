"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useGroups } from "@/components/groups/group-provider";
import { createClient } from "@/lib/supabase/client";

type AccountControlsProps = {
  placement: "header" | "sidebar";
  displayName: string;
};

function initials(name: string, email: string) {
  const words = (name || email || "NP").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toLocaleUpperCase() ?? "").join("");
}

function ProfileAvatar({
  name,
  email,
  avatarUrl,
  className,
}: {
  name: string;
  email: string;
  avatarUrl: string;
  className: string;
}) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState("");

  return (
    <span aria-hidden="true" className={className}>
      {avatarUrl && avatarUrl !== failedAvatarUrl ? (
        <Image
          alt=""
          className="profile-photo"
          height={36}
          onError={() => setFailedAvatarUrl(avatarUrl)}
          src={avatarUrl}
          unoptimized
          width={36}
        />
      ) : (
        initials(name, email)
      )}
    </span>
  );
}

export function AccountControls(props: AccountControlsProps) {
  const pathname = usePathname();

  return <AccountControlsContent key={pathname} {...props} />;
}

function AccountControlsContent({ placement, displayName }: AccountControlsProps) {
  const router = useRouter();
  const { userEmail, userAvatarUrl, isSupabaseMode } = useGroups();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isSignedIn = isSupabaseMode && Boolean(userEmail);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  async function handleSignOut() {
    setError("");
    setPending(true);

    try {
      const { error: signOutError } = await createClient().auth.signOut({ scope: "local" });

      if (signOutError) {
        setError(`Could not sign out. ${signOutError.message}`);
        return;
      }

      setIsMenuOpen(false);
      router.replace("/login");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? `Could not sign out. ${caught.message}`
          : "Could not sign out. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (placement === "header") {
    if (!isSignedIn) {
      return (
        <div className="account-controls">
          {!isSupabaseMode ? <span className="account-mode-label">Demo Mode</span> : null}
          <Link className="account-link" href="/login">Sign In</Link>
          <Link className="account-link account-link-primary" href="/signup">Create Account</Link>
        </div>
      );
    }

    return (
      <div className="header-profile" aria-label="Signed-in profile">
        <ProfileAvatar
          avatarUrl={userAvatarUrl}
          className="topbar-avatar"
          email={userEmail}
          name={displayName}
        />
        <span className="header-profile-name">{displayName}</span>
      </div>
    );
  }

  return (
    <div className="sidebar-account" ref={rootRef}>
      <button
        aria-controls={isMenuOpen ? "sidebar-account-menu" : undefined}
        aria-expanded={isMenuOpen}
        aria-label={`Account menu for ${displayName}`}
        className="sidebar-account-trigger"
        onClick={() => {
          setError("");
          setIsMenuOpen((open) => !open);
        }}
        ref={triggerRef}
        type="button"
      >
        <ProfileAvatar
          avatarUrl={userAvatarUrl}
          className="profile-avatar"
          email={userEmail}
          name={displayName}
        />
        <span className="profile-copy">
          <strong>{displayName}</strong>
          <span>Account</span>
        </span>
        <svg
          aria-hidden="true"
          className={`sidebar-account-chevron${isMenuOpen ? " is-open" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      {isMenuOpen ? (
        <div
          aria-label="Account menu"
          className="account-menu sidebar-account-menu"
          id="sidebar-account-menu"
          role="region"
        >
          <Link
            className="account-menu-link"
            href="/account"
            onClick={() => setIsMenuOpen(false)}
          >
            <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M5 21a7 7 0 0 1 14 0" />
            </svg>
            <span>My Account</span>
          </Link>
          <Link
            className="account-menu-link"
            href="/settings"
            onClick={() => setIsMenuOpen(false)}
          >
            <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.7-1.4-2.4L7.1 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2z" />
            </svg>
            <span>Settings</span>
          </Link>
          {isSignedIn ? (
            <>
              <div className="account-menu-divider" role="separator" />
              <button
                className="account-signout-button"
                disabled={pending}
                onClick={handleSignOut}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="account-signout-icon"
                  fill="none"
                  height={18}
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                  width={18}
                >
                  <path d="M10 17l5-5-5-5M15 12H3" />
                  <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
                </svg>
                <span>{pending ? "Signing out…" : "Sign Out"}</span>
              </button>
            </>
          ) : null}
          {error ? <span role="alert">{error}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
