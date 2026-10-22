// worker-tools U2: the "Your tools" screen's logic (UR-1, UR-3, UR-4; PU1-PU3).
import { SERVICE_TOOLS, TOOL_SERVICES, normaliseOtherTools, type ToolService } from "@remonta/schemas/data/serviceTools";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { acceptChange, bodyOf, fieldValueOf, OWN_TOOL_TOO_LONG, TOO_MANY_OWN_TOOLS, toolLabelsOf, toolServiceOfTitle } from "./serviceTools";

const ids = (s: ToolService) => SERVICE_TOOLS[s].map((t) => t.id) as string[];

describe("toolServiceOfTitle (UR-1)", () => {
  it("the two services by their titles; nothing else", () => {
    expect(toolServiceOfTitle("Cleaning Services")).toBe("cleaning-services");
    expect(toolServiceOfTitle("Home and Yard Maintenance")).toBe("home-yard-maintenance");
    expect(toolServiceOfTitle("Support Worker")).toBeUndefined();
    expect(toolServiceOfTitle(undefined)).toBeUndefined();
  });
});

describe("fieldValueOf / bodyOf (UR-4)", () => {
  it("ids to labels in list order, stale ids dropped, own tools after", () => {
    expect(fieldValueOf({ categoryId: "cleaning-services", toolIds: ["mop-and-bucket", "retired", "vacuum-cleaner"] as never, otherTools: ["Hose"] })).toEqual(["Vacuum cleaner", "Mop and bucket", "Hose"]);
  });

  it("labels back to ids in list order; the rest are own tools, cleaned", () => {
    expect(bodyOf("cleaning-services", ["Mop and bucket", "  Hose ", "vacuum cleaner"])).toEqual({ toolIds: ["vacuum-cleaner", "mop-and-bucket"], otherTools: ["Hose"] });
    expect(bodyOf("home-yard-maintenance", [])).toEqual({ toolIds: [], otherTools: [] });
  });

  it("PU1: a stored entry survives the field and back", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TOOL_SERVICES).chain((s) => fc.record({ s: fc.constant(s), toolIds: fc.subarray(ids(s)), own: fc.uniqueArray(fc.stringMatching(/^[A-Z][a-z]{2,12}$/), { maxLength: 5, selector: (v) => v.toLowerCase() }) })),
        ({ s, toolIds, own }) => {
          const otherTools = normaliseOtherTools(own, s);
          const stored = { categoryId: s, toolIds: toolIds as never, otherTools };
          expect(bodyOf(s, fieldValueOf(stored))).toEqual({ toolIds, otherTools });
        },
      ),
    );
  });
});

describe("acceptChange (UR-3)", () => {
  const s = "cleaning-services" as const;

  it("a typed listed label (any case) becomes that tool's tag; a repeat adds nothing; blanks are dropped", () => {
    expect(acceptChange(s, [], ["vacuum CLEANER"])).toEqual({ value: ["Vacuum cleaner"] });
    expect(acceptChange(s, ["Hose"], ["Hose", "hose"])).toEqual({ value: ["Hose"] });
    expect(acceptChange(s, [], ["  Grass   catcher "])).toEqual({ value: ["Grass catcher"] });
    expect(acceptChange(s, [], ["   "])).toEqual({ value: [] });
  });

  it("a 6th own tool or one over 60 characters is refused, the value kept; ticking a listed tool at 5 own is fine", () => {
    const five = ["A1", "B2", "C3", "D4", "E5"];
    expect(acceptChange(s, five, [...five, "F6"])).toEqual({ value: five, refused: TOO_MANY_OWN_TOOLS });
    expect(acceptChange(s, [], ["x".repeat(61)])).toEqual({ value: [], refused: OWN_TOOL_TOO_LONG });
    expect(acceptChange(s, five, [...five, "Steam mop"]).value).toEqual([...five, "Steam mop"]);
    expect(acceptChange(s, five, five.slice(1)).value).toEqual(five.slice(1));
  });

  it("PU2 + PU3: any sequence of toggles and typed values keeps the limits, and saves only this service's ids in list order", () => {
    const labels = toolLabelsOf(s);
    const action = fc.oneof(
      fc.constantFrom(...labels).map((l) => ({ toggle: l })),
      fc.oneof(fc.string({ maxLength: 70 }), fc.constantFrom(...labels.map((l) => l.toUpperCase()), "Ladder", " hose ", "HOSE")).map((t) => ({ type: t })),
    );
    fc.assert(
      fc.property(fc.array(action, { maxLength: 30 }), (actions) => {
        let value: string[] = [];
        for (const a of actions) {
          // What MultiSelectField reports: a toggle adds or removes a tag; Add appends the trimmed text if not there.
          const next = "toggle" in a ? (value.includes(a.toggle) ? value.filter((v) => v !== a.toggle) : [...value, a.toggle]) : a.type.trim() && !value.includes(a.type.trim()) ? [...value, a.type.trim()] : value;
          value = acceptChange(s, value, next).value;
          const own = value.filter((v) => !labels.includes(v));
          expect(own.length).toBeLessThanOrEqual(5);
          for (const o of own) expect(o.length).toBeLessThanOrEqual(60);
          expect(new Set(value.map((v) => v.toLowerCase())).size).toBe(value.length);
        }
        const body = bodyOf(s, value);
        expect(body.toolIds).toEqual(ids(s).filter((id) => body.toolIds.includes(id as never)));
        expect(normaliseOtherTools(body.otherTools, s)).toEqual(body.otherTools);
        expect(body.otherTools.length).toBeLessThanOrEqual(5);
      }),
    );
  });
});
