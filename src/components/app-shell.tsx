"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { AccountControls } from "@/components/auth/account-controls";
import { useGroups } from "@/components/groups/group-provider";
import type { GroupMember } from "@/lib/groups";

type IconName =
  | "activity"
  | "arrowDown"
  | "arrowRight"
  | "arrowUp"
  | "calendar"
  | "chevronDown"
  | "grid"
  | "home"
  | "receipt"
  | "search"
  | "settings"
  | "users"
  | "wallet";

const icons: Record<IconName, ReactNode> = {
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  arrowDown: (
    <>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7-7" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>
  ),
  chevronDown: <path d="m7 10 5 5 5-5" />,
  grid: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-7 9 7" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  receipt: (
    <>
      <path d="M4 3h16v18l-4-2-4 2-4-2-4 2z" />
      <path d="M8 8h8M8 12h8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.7-1.4-2.4L7.1 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2z" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v16H6a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2" />
      <path d="M3 7h17v5h-4a2 2 0 0 0 0 4h4" />
      <path d="M16 14h.01" />
    </>
  ),
};

const navigation = [
  { label: "Overview", href: "/", icon: "grid" as const, matches: (path: string, hash: string) => path === "/" && !hash },
  { label: "Groups", href: "/groups", icon: "users" as const, matches: (path: string) => path.startsWith("/groups") },
  { label: "Expenses", href: "/#recent-activity", icon: "receipt" as const, matches: (path: string, hash: string) => path === "/" && hash === "#recent-activity" },
  { label: "Balances", href: "/#balances", icon: "wallet" as const, matches: (path: string, hash: string) => path === "/" && hash === "#balances" },
  { label: "Monthly Report", href: "/#monthly-overview", icon: "calendar" as const, matches: (path: string, hash: string) => path === "/" && hash === "#monthly-overview" },
  { label: "Settings", href: "/settings", icon: "settings" as const, matches: (path: string) => path.startsWith("/settings") },
];

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {icons[name]}
    </svg>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function NavigationLinks({
  mobile = false,
  balanceCount,
  pathname,
  hash,
}: {
  mobile?: boolean;
  balanceCount: number;
  pathname: string;
  hash: string;
}) {
  return (
    <nav aria-label={mobile ? "Mobile navigation" : "Main navigation"} className={mobile ? "mobile-nav" : "side-nav"}>
      {navigation.map((item) => {
        const active = item.matches(pathname, hash);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`nav-link${active ? " nav-link-active" : ""}`}
            href={item.href}
            key={item.label}
          >
            <Icon className="nav-icon" name={item.icon} />
            <span>{item.label}</span>
            {item.label === "Balances" && !mobile ? <span className="nav-count">{balanceCount}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function currentUserName(
  userEmail: string,
  userFirstName: string,
  userLastName: string,
  groups: { members: GroupMember[] }[],
) {
  const profileName = [userFirstName, userLastName].filter(Boolean).join(" ");
  if (profileName) {
    return profileName;
  }

  const member = userEmail
    ? groups.flatMap((group) => group.members).find(
        (item) => item.email.trim().toLocaleLowerCase() === userEmail.trim().toLocaleLowerCase(),
      )
    : undefined;

  return member?.name ?? (userEmail ? userEmail.split("@")[0].replace(/[._-]+/g, " ") : "Nipun Perera");
}

function HeaderBreadcrumb({
  pathname,
  groups,
}: {
  pathname: string;
  groups: { id: string; name: string }[];
}) {
  const groupId = pathname.startsWith("/groups/")
    ? decodeURIComponent(pathname.split("/")[2] ?? "")
    : "";
  const group = groups.find((item) => item.id === groupId);
  const isGroupsPage = pathname.startsWith("/groups");
  const isGroupDetailPage = Boolean(groupId);

  if (isGroupDetailPage) {
    return (
      <nav aria-label="Breadcrumb" className="topbar-context">
        <Link className="breadcrumb-link" href="/">Overview</Link>
        <span className="breadcrumb-divider">/</span>
        <Link className="breadcrumb-link" href="/groups">Groups</Link>
        <span className="breadcrumb-divider">/</span>
        <span aria-current="page" className="breadcrumb-current">{group?.name ?? "Group"}</span>
      </nav>
    );
  }

  if (isGroupsPage) {
    return (
      <nav aria-label="Breadcrumb" className="topbar-context">
        <Link className="breadcrumb-link" href="/">Overview</Link>
        <span className="breadcrumb-divider">/</span>
        <span aria-current="page" className="breadcrumb-current">Groups</span>
      </nav>
    );
  }

  const section = pathname.startsWith("/settings") ? "Settings" : "Overview";

  return (
    <div className="topbar-context">
      <span className="breadcrumb-muted">Workspace</span>
      <span className="breadcrumb-divider">/</span>
      <span className="breadcrumb-current">{section}</span>
    </div>
  );
}

function AppShellContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const { groups, isSupabaseMode, userEmail, userFirstName, userLastName } = useGroups();
  const name = currentUserName(userEmail, userFirstName, userLastName, groups);
  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);
  const balanceCount = groups.reduce(
    (total, group) => total + group.members.filter((member) => member.role !== "Admin").length,
    0,
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link aria-label="BillSplit Pro home" className="brand" href="/">
          <BrandMark />
          <span><strong>BillSplit</strong><span className="brand-light">Pro</span></span>
        </Link>
        <div className="workspace-switcher">
          <span className="workspace-avatar">M</span>
          <span className="workspace-copy">
            <span className="workspace-label">WORKSPACE</span>
            <strong>{groups[0]?.name ?? "Your workspace"}</strong>
          </span>
          <Icon className="workspace-chevron" name="chevronDown" />
        </div>
        <span className="nav-section-label">MENU</span>
        <NavigationLinks balanceCount={balanceCount} hash={hash} pathname={pathname} />
        <div className="sidebar-bottom">
          <div className="profile">
            <span className="profile-avatar">{userEmail ? userEmail.slice(0, 2).toLocaleUpperCase() : "NP"}</span>
            <span className="profile-copy"><strong>{name}</strong><span>{isSupabaseMode ? "Account" : "Home admin"}</span></span>
            <Icon className="workspace-chevron" name="chevronDown" />
          </div>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div className="mobile-brand"><BrandMark /><span><strong>BillSplit</strong><span className="brand-light">Pro</span></span></div>
          <HeaderBreadcrumb groups={groups} pathname={pathname} />
          <div className="topbar-actions">
            <div className="search-box"><Icon className="search-icon" name="search" /><input aria-label="Search expenses" placeholder="Search anything..." /><kbd>⌘ K</kbd></div>
            <button aria-label="Notifications" className="icon-button notification-button" type="button"><span className="notification-dot" /><svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg></button>
            <AccountControls />
          </div>
        </header>
        {children}
      </main>
      <NavigationLinks balanceCount={balanceCount} hash={hash} mobile pathname={pathname} />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <AppShellContent>{children}</AppShellContent>
    </Suspense>
  );
}
