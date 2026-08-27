import { describe, expect, it } from "vitest";
import { resolveDrop } from "../resolve-drop";
import type { ClaimsByStatus } from "#/hooks/use-claims-board";
import type {
  AdminClaimItem,
  AdminClaimStatus,
} from "#/lib/api/claims-controller";

const STATUSES: AdminClaimStatus[] = [
  "CREATED",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
];

function claim(id: string, status: AdminClaimStatus): AdminClaimItem {
  return {
    id,
    title: id,
    description: "",
    status,
    attachmentUrls: [],
    profileId: "p1",
    profileName: null,
    profileEmail: null,
    profileAvatarUrl: null,
    assignedUserId: null,
    assignedUserName: null,
    assignedUserEmail: null,
    createdByUserId: null,
    createdByUserName: null,
    createdByUserEmail: null,
    createdByProfileId: null,
    createdByProfileName: null,
    position: 0,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  };
}

function board(): ClaimsByStatus {
  return {
    CREATED: [claim("a", "CREATED"), claim("b", "CREATED"), claim("c", "CREATED")],
    IN_PROGRESS: [claim("d", "IN_PROGRESS")],
    COMPLETED: [],
    REJECTED: [],
  };
}

const ids = (list: AdminClaimItem[]) => list.map((c) => c.id);

describe("resolveDrop", () => {
  it("moves a card down within its column", () => {
    const result = resolveDrop(board(), STATUSES, "a", "c");

    expect(result).not.toBeNull();
    expect(ids(result!.board.CREATED)).toEqual(["b", "c", "a"]);
    expect(result!.status).toBe("CREATED");
    expect(result!.index).toBe(2);
  });

  it("moves a card up within its column", () => {
    const result = resolveDrop(board(), STATUSES, "c", "a");

    expect(ids(result!.board.CREATED)).toEqual(["c", "a", "b"]);
    expect(result!.index).toBe(0);
  });

  it("drops onto another column above the card it landed on", () => {
    const result = resolveDrop(board(), STATUSES, "a", "d");

    expect(ids(result!.board.CREATED)).toEqual(["b", "c"]);
    expect(ids(result!.board.IN_PROGRESS)).toEqual(["a", "d"]);
    expect(result!.status).toBe("IN_PROGRESS");
    expect(result!.index).toBe(0);
    expect(result!.board.IN_PROGRESS[0].status).toBe("IN_PROGRESS");
  });

  it("drops onto an empty column", () => {
    const result = resolveDrop(board(), STATUSES, "b", "COMPLETED");

    expect(ids(result!.board.CREATED)).toEqual(["a", "c"]);
    expect(ids(result!.board.COMPLETED)).toEqual(["b"]);
    expect(result!.index).toBe(0);
  });

  it("drops on a column's empty space, landing at the end", () => {
    const result = resolveDrop(board(), STATUSES, "d", "CREATED");

    expect(ids(result!.board.CREATED)).toEqual(["a", "b", "c", "d"]);
    expect(result!.index).toBe(3);
  });

  it("sends the card to the end when dropped on its own column's empty space", () => {
    const result = resolveDrop(board(), STATUSES, "a", "CREATED");

    expect(ids(result!.board.CREATED)).toEqual(["b", "c", "a"]);
    expect(result!.index).toBe(2);
  });

  it("returns null when the card is dropped back where it started", () => {
    expect(resolveDrop(board(), STATUSES, "a", "a")).toBeNull();
  });

  it("returns null for a card that is not on the board", () => {
    expect(resolveDrop(board(), STATUSES, "ghost", "a")).toBeNull();
    expect(resolveDrop(board(), STATUSES, "a", "ghost")).toBeNull();
  });

  it("leaves the original board untouched", () => {
    const original = board();
    resolveDrop(original, STATUSES, "a", "d");

    expect(ids(original.CREATED)).toEqual(["a", "b", "c"]);
    expect(ids(original.IN_PROGRESS)).toEqual(["d"]);
  });
});
