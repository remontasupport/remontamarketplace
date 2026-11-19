import { describe, expect, it } from "vitest";
import { generateServicesSetupSteps } from "@/config/servicesSetupSteps";
import { serviceNameToSlug } from "@/utils/serviceSlugMapping";
import { serviceLabel } from "./serviceLabel";

describe("serviceLabel (user, 2026-11-19: workers read \"Support Work\")", () => {
  it("renames Support Worker and its High Intensity variant, nothing else", () => {
    expect(serviceLabel("Support Worker")).toBe("Support Work");
    expect(serviceLabel("Support Worker (High Intensity)")).toBe("Support Work (High Intensity)");
    for (const name of ["Cleaning Services", "Therapeutic Supports", "Support Workers Union", "Peer Support Worker", "support worker"]) expect(serviceLabel(name)).toBe(name);
  });

  it("the Services menu shows the label while the step keeps the stored name as its key and slug", () => {
    const [step] = generateServicesSetupSteps(["Support Worker"]);
    expect(step).toMatchObject({ title: "Support Work", serviceTitle: "Support Worker" });
    expect(step!.slug).toBe(serviceNameToSlug("Support Worker")); // links and saved progress unchanged
  });
});
