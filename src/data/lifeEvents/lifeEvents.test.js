import { describe, it, expect } from "vitest";
import { tasksForIntake as babyTasks } from "./newBaby";
import { DIVORCE, tasksForIntake as divorceTasks, retroactiveCandidates as divorceRetro } from "./divorce";
import { LOSS_OF_LOVED_ONE, tasksForIntake as lossTasks, retroactiveCandidates as lossRetro, retroactivePhases as lossRetroPhases } from "./lossOfLovedOne";
import { MARRIAGE, tasksForIntake as marriageTasks, retroactiveCandidates as marriageRetro } from "./marriage";
import { NAME_CHANGE, tasksForIntake as nameChangeTasks, retroactiveCandidates as nameChangeRetro } from "./nameChange";
import { LIFE_EVENT_DEFS } from "./index";
import { computeDueDate, MIN_LEAD_DAYS } from "./eventDates";

const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

describe("registry", () => {
  it("every def carries the fields the generic layers rely on", () => {
    Object.values(LIFE_EVENT_DEFS).forEach(def => {
      expect(def.id).toBeTruthy();
      expect(def.label).toBeTruthy();
      expect(Array.isArray(def.phases)).toBe(true);
      expect(typeof def.tasksForIntake).toBe("function");
      expect(typeof def.retroactiveCandidates).toBe("function");
      def.bundle.forEach(t => expect(def.phases).toContain(t.phase));
    });
  });

  it("every bundle task has a why so the task detail view isn't just generic filler", () => {
    Object.values(LIFE_EVENT_DEFS).forEach(def => {
      def.bundle.forEach(t => {
        expect(t.why, `${def.id}/${t.id} is missing why`).toBeTruthy();
      });
    });
  });

  it("sad events suppress celebration; happy ones do not", () => {
    expect(DIVORCE.suppressCelebration).toBe(true);
    expect(LOSS_OF_LOVED_ONE.suppressCelebration).toBe(true);
    expect(LIFE_EVENT_DEFS['new-baby'].suppressCelebration).toBeFalsy();
    expect(MARRIAGE.suppressCelebration).toBeFalsy();
  });
});

describe("marriage", () => {
  const base = { date: daysFromNow(120), combiningFinances: true, hasInsuranceOrRetirement: true };

  it("includes before-the-day tasks for a future wedding, with the license due ahead of it", () => {
    const tasks = marriageTasks(base);
    const license = tasks.find(t => t.id === 'marriage-license');
    expect(license).toBeTruthy();
    expect(license.dueDate).toBe(daysFromNow(99)); // wedding − 21 days
  });

  it("skips license and prenup entirely when the wedding already happened", () => {
    const ids = marriageTasks({ ...base, date: daysAgo(10) }).map(t => t.id);
    expect(ids).not.toContain('marriage-license');
    expect(ids).not.toContain('prenup');
    expect(ids).toContain('add-spouse-insurance');
  });

  it("gates joint accounts and beneficiaries on intake answers", () => {
    const ids = marriageTasks({ ...base, combiningFinances: false, hasInsuranceOrRetirement: false }).map(t => t.id);
    expect(ids).not.toContain('joint-accounts');
    expect(ids).not.toContain('update-beneficiaries');
  });

  it('treats an unresolved "not sure yet" answer as not-yet-true, not as a yes', () => {
    // A loose truthy check would let this through since 'unsure' is a
    // non-empty string — passesGates must compare with === true.
    const ids = marriageTasks({ ...base, combiningFinances: 'unsure' }).map(t => t.id);
    expect(ids).not.toContain('joint-accounts');
  });

  it("no longer bundles a name-change task — that's its own life event", () => {
    const ids = MARRIAGE.bundle.map(t => t.id);
    expect(ids).not.toContain('name-change');
  });

  it("offers the after-wedding retro checklist only once the wedding is 30+ days past", () => {
    expect(marriageRetro(base)).toHaveLength(0);
    expect(marriageRetro({ ...base, date: daysAgo(10) })).toHaveLength(0);
    const retro = marriageRetro({ ...base, date: daysAgo(60) });
    expect(retro.length).toBeGreaterThan(0);
    expect(retro.every(t => t.phase === 'AFTER')).toBe(true);
  });
});

describe("name change", () => {
  it("paces the two ID-record tasks (CORE) ahead of everything else (REST)", () => {
    const tasks = nameChangeTasks({ date: daysFromNow(10) });
    const byId = Object.fromEntries(tasks.map(t => [t.id, t.dueDate]));
    expect(byId['update-ssn-card'] < byId['update-bank-accounts']).toBe(true);
    expect(byId['update-drivers-license'] < byId['update-passport']).toBe(true);
  });

  it("works from a past start date too", () => {
    const tasks = nameChangeTasks({ date: daysAgo(5) });
    expect(tasks.length).toBe(NAME_CHANGE.bundle.length);
  });

  it("widens the retro checklist the longer ago the user started", () => {
    expect(nameChangeRetro({ date: daysAgo(5) })).toHaveLength(0);
    expect(nameChangeRetro({ date: daysAgo(20) }).every(t => t.phase === 'CORE')).toBe(true);
    const wide = nameChangeRetro({ date: daysAgo(60) });
    expect(new Set(wide.map(t => t.phase))).toEqual(new Set(['CORE', 'REST']));
  });

  it("drops tasks the user marked already done", () => {
    const ids = nameChangeTasks({ date: daysAgo(60), alreadyDone: ['update-ssn-card'] }).map(t => t.id);
    expect(ids).not.toContain('update-ssn-card');
  });
});

describe("computeDueDate", () => {
  it("adds the offset to the anchor date", () => {
    expect(computeDueDate(daysFromNow(100), 10)).toBe(daysFromNow(110));
  });

  it("clamps past results to the minimum lead so catch-up tasks aren't overdue on day one", () => {
    expect(computeDueDate(daysAgo(300), 10)).toBe(daysFromNow(MIN_LEAD_DAYS));
  });

  it("returns null without an anchor or offset", () => {
    expect(computeDueDate(null, 10)).toBeNull();
    expect(computeDueDate(daysFromNow(10), undefined)).toBeNull();
  });
});

describe("new baby — due dates", () => {
  const answers = { dueDate: daysFromNow(230), conceptionPath: 'pregnancy', hasLifeInsurance: true, hasRetirement: true };

  it("assigns every generated task a due date", () => {
    const tasks = babyTasks(answers);
    expect(tasks.length).toBeGreaterThan(0);
    tasks.forEach(t => expect(t.dueDate).toBeTruthy());
  });

  it("orders due dates by phase (T1 before T3 before POST)", () => {
    const tasks = babyTasks(answers);
    const byId = Object.fromEntries(tasks.map(t => [t.id, t.dueDate]));
    expect(byId['choose-hospital'] < byId['install-car-seat']).toBe(true);
    expect(byId['install-car-seat'] < byId['ssn']).toBe(true);
  });

  it("clamps earlier-phase tasks for a user joining in T3", () => {
    const late = babyTasks({ ...answers, dueDate: daysFromNow(30) });
    const chooseOb = late.find(t => t.id === 'choose-ob');
    expect(chooseOb.dueDate).toBe(daysFromNow(MIN_LEAD_DAYS));
  });
});

describe("divorce", () => {
  const base = { stage: 'starting', hasKids: true, sharedFinances: true, hasInsuranceOrRetirement: true };

  it("includes kid tasks only when the profile has kids", () => {
    const withKids = divorceTasks(base).map(t => t.id);
    expect(withKids).toContain('parenting-plan');
    const noKids = divorceTasks({ ...base, hasKids: false }).map(t => t.id);
    expect(noKids).not.toContain('parenting-plan');
    expect(noKids).not.toContain('plan-telling-kids');
  });

  it("gates shared-finance and beneficiary tasks on intake answers", () => {
    const ids = divorceTasks({ ...base, sharedFinances: false, hasInsuranceOrRetirement: false }).map(t => t.id);
    expect(ids).not.toContain('separate-accounts');
    expect(ids).not.toContain('update-beneficiaries');
  });

  it("offers no retro checklist when just starting, EARLY when filed, EARLY+LEGAL when finalized", () => {
    expect(divorceRetro({ ...base, stage: 'starting' })).toHaveLength(0);
    const filed = divorceRetro({ ...base, stage: 'filed' });
    expect(filed.every(t => t.phase === 'EARLY')).toBe(true);
    const final = divorceRetro({ ...base, stage: 'finalized' });
    expect(new Set(final.map(t => t.phase))).toEqual(new Set(['EARLY', 'LEGAL']));
  });

  it("paces catch-up tasks sooner for users who are further along", () => {
    const starting = divorceTasks(base).find(t => t.id === 'update-tax-withholding');
    const finalized = divorceTasks({ ...base, stage: 'finalized' }).find(t => t.id === 'update-tax-withholding');
    expect(finalized.dueDate < starting.dueDate).toBe(true);
  });

  it("drops tasks the user marked already done", () => {
    const ids = divorceTasks({ ...base, alreadyDone: ['open-own-account'] }).map(t => t.id);
    expect(ids).not.toContain('open-own-account');
  });
});

describe("loss of a loved one", () => {
  it("only surfaces estate tasks when the user is settling affairs", () => {
    const handling = lossTasks({ date: daysAgo(5), handlingEstate: true }).map(t => t.id);
    expect(handling).toContain('notify-ssa');
    const notHandling = lossTasks({ date: daysAgo(5), handlingEstate: false }).map(t => t.id);
    expect(notHandling).not.toContain('notify-ssa');
    expect(notHandling).toContain('grief-support');
    expect(notHandling).toContain('funeral-arrangements');
  });

  it("widens the retro checklist the further back the loss was", () => {
    expect(lossRetroPhases({ date: daysAgo(5) })).toHaveLength(0);
    expect(lossRetroPhases({ date: daysAgo(30) })).toEqual(['FIRST']);
    expect(lossRetroPhases({ date: daysAgo(100) })).toEqual(['FIRST', 'WEEKS']);
    expect(lossRetroPhases({ date: daysAgo(300) })).toEqual(['FIRST', 'WEEKS', 'MONTHS']);
  });

  it("respects gates inside the retro checklist too", () => {
    const cands = lossRetro({ date: daysAgo(100), handlingEstate: false });
    expect(cands.map(t => t.id)).not.toContain('notify-banks');
  });

  it("anchors due dates to the date of passing, clamped for old losses", () => {
    const recent = lossTasks({ date: daysAgo(2), handlingEstate: true });
    const ssa = recent.find(t => t.id === 'notify-ssa');
    expect(ssa.dueDate).toBe(daysFromNow(43)); // passing + 45 days
    const old = lossTasks({ date: daysAgo(400), handlingEstate: true });
    old.forEach(t => expect(t.dueDate >= daysFromNow(MIN_LEAD_DAYS)).toBe(true));
  });
});
