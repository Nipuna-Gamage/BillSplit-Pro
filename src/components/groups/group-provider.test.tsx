import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { GroupProvider, useGroups } from "./group-provider";

const mocks = vi.hoisted(() => ({
  client: {} as {
    auth: {
      getUser: ReturnType<typeof vi.fn>;
      onAuthStateChange: ReturnType<typeof vi.fn>;
    };
    from: ReturnType<typeof vi.fn>;
    channel: ReturnType<typeof vi.fn>;
    removeChannel: ReturnType<typeof vi.fn>;
  },
  insert: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: () => true,
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mocks.client,
}));

const authenticatedUser = {
  id: "authenticated-user-id",
  email: "owner@example.com",
};

function GroupCreationProbe() {
  const { createGroup, isLoading } = useGroups();
  const [message, setMessage] = useState("");

  async function handleCreate() {
    const result = await createGroup({
      name: "Test group",
      category: "Household",
      location: "",
    });
    setMessage(result.success ? "created" : result.error);
  }

  return (
    <>
      <button disabled={isLoading} onClick={handleCreate} type="button">
        Create test group
      </button>
      <output>{message}</output>
    </>
  );
}

function renderProvider() {
  return render(
    <GroupProvider>
      <GroupCreationProbe />
    </GroupProvider>,
  );
}

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({
    data: { user: authenticatedUser },
    error: null,
  });
  mocks.insert.mockResolvedValue({
    data: { updated_at: "2026-10-30T12:00:00.000Z" },
    error: null,
  });

  const groupsRead = {
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
  const groupInsert = {
    select: vi.fn().mockReturnThis(),
    single: mocks.insert,
  };
  const invitationsRead = {
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gt: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
  const sharedGroupsTable = {
    select: vi.fn().mockReturnValue(groupsRead),
    insert: vi.fn().mockReturnValue(groupInsert),
  };
  const invitationsTable = {
    select: vi.fn().mockReturnValue(invitationsRead),
  };
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };

  mocks.client = {
    auth: {
      getUser: mocks.getUser,
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn((table: string) =>
      table === "shared_groups" ? sharedGroupsTable : invitationsTable,
    ),
    channel: vi.fn().mockReturnValue(channel),
    removeChannel: vi.fn(),
  };
});

describe("Supabase group creation authorization", () => {
  it("uses the verified authenticated user as owner immediately before insertion", async () => {
    renderProvider();
    const createButton = await screen.findByRole("button", {
      name: "Create test group",
    });

    await waitFor(() => expect(createButton.hasAttribute("disabled")).toBe(false));
    fireEvent.click(createButton);

    await waitFor(() => expect(screen.getByText("created")).toBeTruthy());

    const insertPayload = mocks.client.from.mock.results
      .map((result) => result.value)
      .find((table) => table.insert)?.insert.mock.calls[0][0];
    const groupCreationAuthCheck = mocks.getUser.mock.invocationCallOrder.at(-1);
    const groupInsertCall = mocks.insert.mock.invocationCallOrder[0];

    expect(insertPayload.owner_id).toBe(authenticatedUser.id);
    expect(insertPayload.data.id).toMatch(
      new RegExp(`^${authenticatedUser.id}-`),
    );
    expect(groupCreationAuthCheck).toBeLessThan(groupInsertCall);
  });

  it("does not insert a group when no authenticated Supabase user exists", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    renderProvider();
    const createButton = await screen.findByRole("button", {
      name: "Create test group",
    });

    await waitFor(() => expect(createButton.hasAttribute("disabled")).toBe(false));
    fireEvent.click(createButton);

    expect(await screen.findByText(/sign in before saving workspace changes/i))
      .toBeTruthy();
    expect(mocks.client.from).not.toHaveBeenCalledWith("shared_groups");
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects an expired session immediately before insertion", async () => {
    mocks.getUser
      .mockResolvedValueOnce({
        data: { user: authenticatedUser },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

    renderProvider();
    const createButton = await screen.findByRole("button", {
      name: "Create test group",
    });

    await waitFor(() => expect(createButton.hasAttribute("disabled")).toBe(false));
    fireEvent.click(createButton);

    expect(
      await screen.findByText(/could not verify your current supabase session/i),
    ).toBeTruthy();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects a session whose user does not match the loaded workspace owner", async () => {
    mocks.getUser
      .mockResolvedValueOnce({
        data: { user: authenticatedUser },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          user: { id: "different-user-id", email: "other@example.com" },
        },
        error: null,
      });

    renderProvider();
    const createButton = await screen.findByRole("button", {
      name: "Create test group",
    });

    await waitFor(() => expect(createButton.hasAttribute("disabled")).toBe(false));
    fireEvent.click(createButton);

    expect(
      await screen.findByText(/could not verify your current supabase session/i),
    ).toBeTruthy();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
