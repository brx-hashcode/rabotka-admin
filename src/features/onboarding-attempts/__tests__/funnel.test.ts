import { describe, expect, it } from "vitest";
import {
  biggestLeak,
  deltaLabel,
  funnelSteps,
  periodWindows,
  reachedLabel,
  stageLabel,
  stagesFor,
  stoppedStageFor,
} from "../stage-labels";

const stats = {
  started: 10,
  funnel: [
    { stage: "CODE_SENT" as const, count: 10 },
    { stage: "PHONE_VERIFIED" as const, count: 8 },
    { stage: "DOCUMENTS" as const, count: 3 },
    { stage: "CONFIRMATION" as const, count: 2 },
    { stage: "COMPLETED" as const, count: 2 },
  ],
};

describe("funnelSteps", () => {
  it("gives each step its share of the start and what it lost", () => {
    const steps = funnelSteps(stats);
    expect(steps.map((s) => s.reached)).toEqual([10, 8, 3, 2, 2]);
    expect(steps[2]).toMatchObject({ ofStart: 0.3, lostBefore: 5 });
    expect(steps[2].lostBeforeRate).toBeCloseTo(5 / 8);
    expect(steps[0].lostBefore).toBe(0);
  });

  it("survives an empty period", () => {
    const steps = funnelSteps({ started: 0, funnel: [] });
    expect(steps.every((s) => s.reached === 0 && s.ofStart === 0)).toBe(true);
  });
});

describe("biggestLeak", () => {
  it("points at the step that loses the most people", () => {
    expect(biggestLeak(funnelSteps(stats))?.stage).toBe("DOCUMENTS");
  });

  it("is null when nobody was lost", () => {
    expect(
      biggestLeak(
        funnelSteps({
          started: 2,
          funnel: [
            { stage: "CODE_SENT", count: 2 },
            { stage: "PHONE_VERIFIED", count: 2 },
            { stage: "DOCUMENTS", count: 2 },
            { stage: "CONFIRMATION", count: 2 },
            { stage: "COMPLETED", count: 2 },
          ],
        }),
      ),
    ).toBeNull();
  });
});

describe("stoppedStageFor", () => {
  it("says people lost reaching a step stopped at the one before", () => {
    expect(stoppedStageFor("DOCUMENTS")).toBe("PHONE_VERIFIED");
  });
});

describe("periodWindows", () => {
  const now = new Date("2026-10-22T12:00:00Z");

  it("pairs a window with the one just before it", () => {
    const { current, previous } = periodWindows("7d", now);
    expect(current.startedFrom).toBe("2026-10-15T12:00:00.000Z");
    expect(previous).toEqual({
      startedFrom: "2026-10-08T12:00:00.000Z",
      startedTo: "2026-10-15T12:00:00.000Z",
    });
  });

  it("has nothing to compare « Tout » with", () => {
    expect(periodWindows("all", now)).toEqual({ current: {}, previous: null });
  });
});

describe("deltaLabel", () => {
  it.each([
    [5, 3, "+2"],
    [3, 5, "−2"],
    [4, 4, "="],
  ])("%i vs %i → %s", (cur, prev, label) => {
    expect(deltaLabel(cur, prev)).toBe(label);
  });

  it("says nothing without a previous window", () => {
    expect(deltaLabel(4, undefined)).toBeNull();
  });
});

describe("business sign-ups", () => {
  // A business confirms its email, then creates its account in one go.
  const business = {
    started: 13,
    funnel: [
      { stage: "CODE_SENT" as const, count: 13 },
      { stage: "PHONE_VERIFIED" as const, count: 8 },
      { stage: "DOCUMENTS" as const, count: 6 },
      { stage: "CONFIRMATION" as const, count: 6 },
      { stage: "COMPLETED" as const, count: 6 },
    ],
  };

  it("has three steps, with no step between the email and the account", () => {
    const stages = stagesFor("business");
    const steps = funnelSteps(business, stages);
    expect(steps.map((s) => s.stage)).toEqual(["CODE_SENT", "PHONE_VERIFIED", "COMPLETED"]);
    expect(steps[2]).toMatchObject({ reached: 6, lostBefore: 2 });
    expect(stoppedStageFor("COMPLETED", stages)).toBe("PHONE_VERIFIED");
  });

  it("speaks of an email, not WhatsApp or a phone", () => {
    expect(stageLabel("CODE_SENT", "business")).toBe("Code e-mail");
    expect(reachedLabel("PHONE_VERIFIED", "business")).toBe("E-mail vérifié");
    expect(stageLabel("CODE_SENT", "whatsapp")).toBe("Code WhatsApp");
    expect(reachedLabel("PHONE_VERIFIED", "all")).toBe("Numéro ou e-mail vérifié");
    expect(stageLabel("DOCUMENTS", "all")).toBe("Pièces d'identité");
  });
});
