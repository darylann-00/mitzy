import { describe, it, expect } from "vitest";
import { taskStatus, becameDueAfterPlan } from "./taskLogic";

const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

describe("taskStatus — recurring tasks", () => {
  const baseTask = { id: "t1", intervalDays: 365, windowDays: 21, oneTime: false };

  it("uses windowDays for coming-up when reminderLeadDays is not set", () => {
    const task = { ...baseTask, reminderLeadDays: undefined };
    // 350 days since done on a 365-day interval = 15 days remaining, inside windowDays(21)
    const entry = { lastDone: daysAgo(350) };
    expect(taskStatus(task, { t1: entry })).toBe("coming-up");
  });

  it("falls back to ok when remaining days exceed windowDays and there's no reminderLeadDays", () => {
    const task = { ...baseTask, reminderLeadDays: undefined };
    // 300 days since done = 65 days remaining, outside windowDays(21)
    const entry = { lastDone: daysAgo(300) };
    expect(taskStatus(task, { t1: entry })).toBe("ok");
  });

  it("uses reminderLeadDays instead of windowDays when set", () => {
    const task = { ...baseTask, reminderLeadDays: 45 };
    // 320 days since done = 45 days remaining — inside reminderLeadDays(45) but outside windowDays(21)
    const entry = { lastDone: daysAgo(320) };
    expect(taskStatus(task, { t1: entry })).toBe("coming-up");
  });

  it("still reports due once the interval has actually elapsed, regardless of lead time", () => {
    const task = { ...baseTask, reminderLeadDays: 45 };
    const entry = { lastDone: daysAgo(366) };
    expect(taskStatus(task, { t1: entry })).toBe("due");
  });
});

describe("taskStatus — one-time tasks", () => {
  const baseTask = { id: "t2", oneTime: true, windowDays: 30 };

  it("falls back to a 7-day window when neither reminderLeadDays nor windowDays is set", () => {
    const task = { id: "t3", oneTime: true };
    const entry = { dueDate: daysFromNow(6) };
    expect(taskStatus(task, { t3: entry })).toBe("coming-up");

    const entryTooFar = { dueDate: daysFromNow(8) };
    expect(taskStatus(task, { t3: entryTooFar })).toBe("unknown");
  });

  it("uses windowDays as the lead time when reminderLeadDays is not set", () => {
    const entry = { dueDate: daysFromNow(25) };
    expect(taskStatus(baseTask, { t2: entry })).toBe("coming-up");
  });

  it("uses reminderLeadDays over windowDays when both are set", () => {
    const task = { ...baseTask, reminderLeadDays: 60 };
    const entry = { dueDate: daysFromNow(50) };
    expect(taskStatus(task, { t2: entry })).toBe("coming-up");
  });

  it("reports due once the due date has passed", () => {
    const entry = { dueDate: daysAgo(1) };
    expect(taskStatus(baseTask, { t2: entry })).toBe("due");
  });

  it("falls back to the task definition's dueDate when the record has none (life event bundles)", () => {
    const task = { ...baseTask, dueDate: daysFromNow(20) };
    expect(taskStatus(task, {})).toBe("coming-up");

    const overdueTask = { ...baseTask, dueDate: daysAgo(2) };
    expect(taskStatus(overdueTask, {})).toBe("due");
  });

  it("prefers a user-set record dueDate over the task definition default", () => {
    const task = { ...baseTask, dueDate: daysAgo(2) };
    const entry = { dueDate: daysFromNow(90) };
    expect(taskStatus(task, { t2: entry })).toBe("unknown");
  });
});

describe("becameDueAfterPlan — weekly plan 'came up' check", () => {
  it("excludes tasks already overdue when the plan was confirmed", () => {
    // due 7 days ago, plan confirmed today
    expect(becameDueAfterPlan(-7, new Date().toISOString())).toBe(false);
  });

  it("excludes tasks due the same day the plan was confirmed", () => {
    expect(becameDueAfterPlan(0, new Date().toISOString())).toBe(false);
  });

  it("includes tasks that became due after the plan was confirmed", () => {
    // due today, plan confirmed 3 days ago
    const confirmed = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(becameDueAfterPlan(0, confirmed)).toBe(true);
  });

  it("returns false with no due information or no confirmation", () => {
    expect(becameDueAfterPlan(null, new Date().toISOString())).toBe(false);
    expect(becameDueAfterPlan(0, null)).toBe(false);
  });
});
