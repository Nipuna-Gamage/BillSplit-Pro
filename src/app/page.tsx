"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell, Icon } from "@/components/app-shell";
import { useGroups } from "@/components/groups/group-provider";
import { calculateGroupBalances } from "@/lib/balances";
import { calculateDashboardUserBalance } from "@/lib/dashboard";
import { formatLkr } from "@/lib/expenses";
import type { GroupMember } from "@/lib/groups";

function AvatarStack({ members }: { members: GroupMember[] }) {
  const visibleMembers = members.slice(0, 3);

  return (
    <div aria-label={`${members.length} unique group members`} className="avatar-stack">
      {visibleMembers.map((member, index) => (
        <span
          aria-label={member.name}
          className={`avatar avatar-${["one", "two", "three"][index]}`}
          key={`${member.email}-${member.id}`}
          title={member.name}
        >
          {member.name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toLocaleUpperCase() ?? "")
            .join("")}
        </span>
      ))}
      {members.length > visibleMembers.length ? (
        <span className="avatar avatar-more">
          +{members.length - visibleMembers.length}
        </span>
      ) : null}
    </div>
  );
}

function getGreeting(hour: number) {
  return hour >= 12 && hour < 17
    ? "Good afternoon"
    : hour >= 17
      ? "Good evening"
      : "Good morning";
}

function formatDashboardDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  });
}

function formatDashboardTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Home() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const {
    groups,
    isLoading,
    isSupabaseMode,
    persistenceError,
    userEmail,
    userFirstName,
    userLastName,
    syncStatus,
  } = useGroups();
  useEffect(() => {
    const updateCurrentDate = () => setCurrentDate(new Date());

    updateCurrentDate();
    const intervalId = window.setInterval(updateCurrentDate, 1000);

    return () => window.clearInterval(intervalId);
  }, []);
  const currentUserMember = userEmail
    ? groups
        .flatMap((group) => group.members)
        .find(
          (member) =>
            member.email.trim().toLocaleLowerCase() ===
            userEmail.trim().toLocaleLowerCase(),
        )
    : undefined;
  const currentUserName = (
    [userFirstName, userLastName].filter(Boolean).join(" ") ||
    currentUserMember?.name
  ) ?? (userEmail
    ? userEmail.split("@")[0].replace(/[._-]+/g, " ")
    : "Nipuna Gamage");
  const firstName = currentUserName.split(/\s+/)[0] || "there";
  const allExpenses = groups.flatMap((group) =>
    group.expenses.map((expense) => ({
      ...expense,
      groupName: group.name,
      payerName:
        group.members.find((member) => member.id === expense.paidByMemberId)?.name ??
        "Group member",
    })),
  );
  const recentExpenses = [...allExpenses]
    .sort((first, second) => second.date.localeCompare(first.date))
    .slice(0, 3);
  const sharedSpendMinor = allExpenses.reduce(
    (total, expense) => total + expense.amountMinor,
    0,
  );
  const groupBalances = groups.map((group) => ({
    group,
    balances: calculateGroupBalances(
      group.members,
      group.expenses,
      group.settlements,
    ),
  }));
  const balanceRows = groupBalances.flatMap(({ group, balances }) =>
    balances.flatMap((balance) => {
      if (balance.balanceMinor === 0) {
        return [];
      }

      const member = group.members.find((item) => item.id === balance.memberId);

      return member
        ? [{ ...balance, memberName: member.name, groupName: group.name }]
        : [];
    }),
  );
  const { balanceMinor: currentUserBalanceMinor, groupCount: currentUserBalanceGroupCount } =
    calculateDashboardUserBalance(groups, userEmail, !isSupabaseMode);
  const uniqueMembers = Array.from(
    new Map(
      groups
        .flatMap((group) => group.members)
        .map((member) => [
          member.email.trim().toLocaleLowerCase() || member.id,
          member,
        ]),
    ).values(),
  );
  const topBalances = [...balanceRows]
    .sort(
      (first, second) =>
        Math.abs(second.balanceMinor) - Math.abs(first.balanceMinor),
    )
    .slice(0, 2);
  const greeting = currentDate ? getGreeting(currentDate.getHours()) : "Good morning";
  const dashboardDate = currentDate ? formatDashboardDate(currentDate) : "";
  const dashboardTime = currentDate ? formatDashboardTime(currentDate) : "";
  return (
    <AppShell>
      <div className="content">
          <div className="demo-notice" role="note">
            <span className="demo-indicator" />
            <span>
              <strong>{isSupabaseMode ? "Shared groups" : "Demo workspace"}</strong>
              <span className="demo-separator">·</span>
              {isSupabaseMode
                ? "Your groups and expenses are shared with their accepted members."
                : "Sample data only — nothing here is saved or real."}
            </span>
            <span className="demo-tag">{isSupabaseMode ? "SHARED" : "PREVIEW"}</span>
          </div>
          {isSupabaseMode ? (
            <p
              className={`sync-status sync-status-${syncStatus}`}
              role="status"
            >
              {syncStatus === "connected"
                ? "Live group updates are on."
                : syncStatus === "error"
                  ? "Live updates unavailable. Refresh to check for changes."
                  : "Connecting to live group updates…"}
            </p>
          ) : null}
          {persistenceError ? <p className="form-error" role="alert">{persistenceError}</p> : null}
          {isLoading ? <p className="form-success" role="status">Loading your groups…</p> : null}

          <section aria-labelledby="welcome-heading" className="welcome-row">
            <div>
              <p className="eyebrow">
                <time dateTime={currentDate?.toISOString()}>{dashboardDate}</time>
                {dashboardTime ? <span aria-hidden="true"> · </span> : null}
                <span aria-label={dashboardTime ? `Current time: ${dashboardTime}` : undefined}>
                  {dashboardTime}
                </span>
              </p>
              <h1 id="welcome-heading">{greeting}, {firstName} <span aria-hidden="true">✦</span></h1>
              <p className="welcome-copy">Here&apos;s what&apos;s happening with your shared expenses.</p>
            </div>
            <a className="period-select" href="#monthly-overview">
              <Icon className="period-icon" name="calendar" />
              <span>This month</span>
              <Icon className="period-chevron" name="chevronDown" />
            </a>
          </section>

          <section aria-label="Expense summary" className="summary-grid">
            <article className="summary-card summary-primary">
              <div className="summary-topline">
                <span className="summary-icon summary-icon-light">
                  <Icon name="wallet" />
                </span>
                <span className="summary-label">Your balance</span>
                <span className="balance-status">All groups</span>
              </div>
              <p className="summary-value">{formatLkr(Math.abs(currentUserBalanceMinor))}</p>
              <div className="summary-foot">
                <span className="balance-pill">
                  <Icon name={currentUserBalanceMinor < 0 ? "arrowDown" : "arrowUp"} />
                  {currentUserBalanceMinor > 0
                    ? "You are owed"
                    : currentUserBalanceMinor < 0
                      ? "You owe"
                      : "All settled"}
                </span>
                <span>across {currentUserBalanceGroupCount} groups</span>
              </div>
              <span aria-hidden="true" className="card-decoration card-decoration-one" />
              <span aria-hidden="true" className="card-decoration card-decoration-two" />
            </article>

            <article className="summary-card">
              <div className="summary-topline">
                <span className="summary-icon icon-teal">
                  <Icon name="receipt" />
                </span>
                <span className="summary-label">Total recorded expenses</span>
                <span className="summary-menu" aria-hidden="true">···</span>
              </div>
              <p className="summary-value summary-value-dark">{formatLkr(sharedSpendMinor)}</p>
              <div className="summary-foot">
                <span className="summary-subtle">
                  Across {isSupabaseMode ? "shared groups" : "demo groups"}
                </span>
                <span className="mini-bars" aria-hidden="true">
                  <i /><i /><i /><i /><i /><i /><i /><i /><i />
                </span>
              </div>
            </article>

            <article className="summary-card">
              <div className="summary-topline">
                <span className="summary-icon icon-lavender">
                  <Icon name="users" />
                </span>
                <span className="summary-label">Active groups</span>
                <span className="summary-menu" aria-hidden="true">···</span>
              </div>
              <p className="summary-value summary-value-dark">{groups.length} <span className="summary-unit">groups</span></p>
              <div className="summary-foot">
                <AvatarStack members={uniqueMembers} />
                <span className="summary-subtle">
                  {groups.reduce((total, group) => total + group.members.length, 0)} members total
                </span>
              </div>
            </article>
          </section>

          <section className="dashboard-grid">
            <article aria-labelledby="activity-heading" className="panel activity-panel" id="recent-activity">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">YOUR HOUSEHOLD</p>
                  <h2 id="activity-heading">Recent activity</h2>
                </div>
                <a className="text-link" href="#your-groups">
                  View all <Icon name="arrowRight" />
                </a>
              </div>
              <div className="activity-table">
                <div aria-hidden="true" className="activity-header">
                  <span>EXPENSE</span>
                  <span>GROUP</span>
                  <span>AMOUNT</span>
                </div>
                {recentExpenses.map((expense) => (
                  <div className="activity-row" key={expense.id}>
                    <div className="expense-cell">
                      <span className={`expense-icon expense-icon-${expense.category === "Internet" ? "lavender" : expense.category === "Electricity" ? "peach" : "mint"}`}>
                        <Icon name="receipt" />
                      </span>
                      <span className="expense-copy">
                        <strong>{expense.description}</strong>
                        <span>{expense.payerName} <i>·</i> {expense.date}</span>
                      </span>
                    </div>
                    <span className="group-cell">{expense.groupName}</span>
                    <strong className="amount-cell">{formatLkr(expense.amountMinor)}</strong>
                  </div>
                ))}
              </div>
              <a className="activity-mobile-link" href="#your-groups">
                See all activity <Icon name="arrowRight" />
              </a>
            </article>

            <article aria-labelledby="balances-heading" className="panel balance-panel" id="balances">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">AT A GLANCE</p>
                  <h2 id="balances-heading">Group balances</h2>
                </div>
                <button aria-label="Balance options" className="panel-menu" type="button">···</button>
              </div>
              {topBalances.length > 0 ? topBalances.map((balance, index) => (
                <div className="balance-person" key={`${balance.memberId}-${balance.groupName}`}>
                  <span className={`person-avatar person-avatar-${index === 0 ? "sage" : "rose"}`}>
                    {balance.memberName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}
                  </span>
                  <span className="person-copy">
                    <strong>{balance.memberName}</strong>
                    <span>{balance.groupName}</span>
                  </span>
                  <span className={`person-balance ${balance.balanceMinor > 0 ? "positive" : "negative"}`}>
                    {balance.balanceMinor > 0 ? "+" : "−"} {formatLkr(Math.abs(balance.balanceMinor))}
                  </span>
                </div>
              )) : (
                <p className="balance-empty">
                  Everyone is settled up in {isSupabaseMode ? "your groups" : "the demo groups"}.
                </p>
              )}
              <div className="balance-summary">
                <span className="balance-summary-icon">
                  <Icon name="activity" />
                </span>
                <span>
                  <strong>Keep things balanced</strong>
                  <span>
                    Based on equal splits of {isSupabaseMode ? "group expenses" : "demo expenses"}
                  </span>
                </span>
              </div>
            </article>

            <article aria-labelledby="monthly-heading" className="panel monthly-panel" id="monthly-overview">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">SPENDING SNAPSHOT</p>
                  <h2 id="monthly-heading">Monthly overview</h2>
                </div>
                <span className="chart-period">Last 6 months <Icon name="chevronDown" /></span>
              </div>
              <div
                aria-label="Demo monthly shared spending: May 28 thousand, June 35 thousand, July 31 thousand, August 42 thousand, September 37 thousand, October 49 thousand LKR"
                className="chart"
                role="img"
              >
                <div aria-hidden="true" className="chart-scale">
                  <span>50k</span><span>35k</span><span>20k</span><span>0</span>
                </div>
                <div aria-hidden="true" className="chart-bars">
                  <div className="chart-column"><span style={{ height: "48%" }} /><small>May</small></div>
                  <div className="chart-column"><span style={{ height: "61%" }} /><small>Jun</small></div>
                  <div className="chart-column"><span style={{ height: "54%" }} /><small>Jul</small></div>
                  <div className="chart-column"><span style={{ height: "73%" }} /><small>Aug</small></div>
                  <div className="chart-column"><span style={{ height: "66%" }} /><small>Sep</small></div>
                  <div className="chart-column chart-column-current"><span style={{ height: "86%" }} /><small>Oct</small></div>
                </div>
              </div>
            </article>

            <article aria-labelledby="groups-heading" className="panel groups-panel" id="your-groups">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">YOUR SPACES</p>
                  <h2 id="groups-heading">Your groups</h2>
                </div>
                <Link aria-label="View all groups" className="panel-arrow" href="/groups">
                  <Icon name="arrowRight" />
                </Link>
              </div>
              <div className="group-list">
                {groups.map((group, index) => (
                  <Link className="group-row" href={`/groups/${group.id}`} key={group.id}>
                    <span className={`group-mark ${["group-green", "group-blue", "group-yellow"][index % 3]}`}>
                      <Icon name="home" />
                    </span>
                    <span className="group-copy">
                      <strong>{group.name}</strong>
                      <span>{group.members.length} {group.members.length === 1 ? "member" : "members"}</span>
                    </span>
                    <span className="group-amount">
                      <strong>
                        {formatLkr(
                          group.expenses.reduce(
                            (total, expense) => total + expense.amountMinor,
                            0,
                          ),
                        )}
                      </strong>
                      <span>this month</span>
                    </span>
                    <Icon className="group-chevron" name="arrowRight" />
                  </Link>
                ))}
              </div>
            </article>
          </section>

          <footer className="page-footer">
            <span>BillSplit Pro <span className="footer-dot">·</span> A clearer way to share.</span>
            <span>Demo workspace <span className="footer-dot">·</span> LKR</span>
          </footer>
        </div>
    </AppShell>
  );
}
