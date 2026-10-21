// The tour's declaration (onboarding-tour U2 Step 3; P8 "every step's target resolves", D4, D10).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { TOUR_STEPS, tourSelector, welcomeTitle } from "./tourSteps";
import { WORKER_MENU } from "./workerMenu";

describe("TOUR_STEPS", () => {
  it("is the five approved steps in order: My Profile, Services, Compliance, Additional Credentials, the checklist (D4)", () => {
    expect(TOUR_STEPS.map((s) => s.target)).toEqual(["edit-profile", "services", "compliance", "additional-credentials", "checklist"]);
    expect(TOUR_STEPS.map((s) => s.title)).toEqual(["My Profile", "Services", "Compliance", "Additional Credentials", "Your progress"]);
  });

  it("every target is a WORKER_MENU id or the checklist, and each step's title is that item's label", () => {
    const menu = new Map(WORKER_MENU.map((m) => [m.id, m.label]));
    for (const s of TOUR_STEPS) {
      if (s.target === "checklist") continue;
      expect(menu.has(s.target), s.id).toBe(true);
      expect(s.title, s.id).toBe(menu.get(s.target));
    }
  });

  it("ids are unique; texts are plain, non-empty and short enough for a card", () => {
    expect(new Set(TOUR_STEPS.map((s) => s.id)).size).toBe(TOUR_STEPS.length);
    for (const s of TOUR_STEPS) {
      expect(s.text.trim().length, s.id).toBeGreaterThan(0);
      expect(s.text.length, s.id).toBeLessThanOrEqual(200);
      expect(s.text, s.id).not.toMatch(/[<>]/);
    }
  });

  it("a selector finds the anchor the sidebar renders", () => {
    expect(tourSelector("services")).toBe('[data-tour="services"]');
  });
});

describe("welcomeTitle", () => {
  it("greets by first name, or without one", () => {
    expect(welcomeTitle("Mary")).toBe("Welcome to Remonta, Mary!");
    expect(welcomeTitle("  Mary ")).toBe("Welcome to Remonta, Mary!");
    expect(welcomeTitle("")).toBe("Welcome to Remonta!");
    expect(welcomeTitle(null)).toBe("Welcome to Remonta!");
    expect(welcomeTitle(undefined)).toBe("Welcome to Remonta!");
  });
  it("property: any name is inserted as given (text, never markup), and the title always ends with !", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 40 }), (n) => {
        const t = welcomeTitle(n);
        expect(t.startsWith("Welcome to Remonta")).toBe(true);
        expect(t.endsWith("!")).toBe(true);
        if (n.trim()) expect(t).toContain(n.trim());
      }),
    );
  });
});
