/**
 * Tests for the service-name/slug conversion pair.
 *
 * These two functions have a mapping path and a fallback path, and they behave
 * differently. The mapping path round-trips exactly; the fallback path
 * normalises and is therefore lossy. Both are asserted here — the lossiness is
 * real current behaviour, and a test that pretended otherwise would be wrong.
 *
 * Globals are off (see vitest.config.mts) — describe/it/expect are imported.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";

import {
  serviceNameToSlug,
  slugToServiceName,
  isServiceInDatabase,
  getAllServiceNames,
  getAllServiceSlugs,
  SLUG_TO_SERVICE_NAME,
  SERVICE_NAME_TO_SLUG,
} from "@/utils/serviceSlugMapping";

describe("the mapping tables", () => {
  it("is not empty", () => {
    expect(getAllServiceNames().length).toBeGreaterThan(0);
    expect(getAllServiceSlugs().length).toBeGreaterThan(0);
  });

  it("is a bijection — the reverse table is built from the forward one", () => {
    // SERVICE_NAME_TO_SLUG is derived from SLUG_TO_SERVICE_NAME by inversion.
    // If two slugs ever mapped to the same name, one would be silently lost
    // and the sizes would diverge. This catches that.
    expect(Object.keys(SERVICE_NAME_TO_SLUG).length).toBe(
      Object.keys(SLUG_TO_SERVICE_NAME).length,
    );
  });
});

describe("round-trip over the known mapping", () => {
  it("name -> slug -> name is the identity for every mapped name", () => {
    // PBT-02. fc.constantFrom draws from the real table rather than inventing
    // strings, so this exercises exactly the values that occur in practice.
    const names = getAllServiceNames();

    fc.assert(
      fc.property(fc.constantFrom(...names), (name) => {
        expect(slugToServiceName(serviceNameToSlug(name))).toBe(name);
      }),
    );
  });

  it("slug -> name -> slug is the identity for every mapped slug", () => {
    const slugs = getAllServiceSlugs();

    fc.assert(
      fc.property(fc.constantFrom(...slugs), (slug) => {
        expect(serviceNameToSlug(slugToServiceName(slug))).toBe(slug);
      }),
    );
  });
});

describe("the fallback path", () => {
  it("produces a URL-safe slug for names that are not in the table", () => {
    // PBT-03. Whatever goes in, the output must be usable in a URL segment:
    // lowercase, no whitespace.
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 40 })
          .filter((s) => !(s in SERVICE_NAME_TO_SLUG)),
        (unmapped) => {
          const slug = serviceNameToSlug(unmapped);
          expect(slug).toBe(slug.toLowerCase());
          expect(slug).not.toMatch(/\s/);
        },
      ),
    );
  });

  it("is LOSSY — it does not round-trip, and that is the current behaviour", () => {
    // Documented deliberately. The fallback lowercases, collapses whitespace to
    // hyphens, and then title-cases on the way back, so information is
    // discarded. Anything relying on an unmapped name surviving a round trip is
    // relying on something that does not hold.
    expect(serviceNameToSlug("Multi   Space   Name")).toBe("multi-space-name");
    expect(slugToServiceName("multi-space-name")).toBe("Multi Space Name");

    // ALL CAPS input does not come back as it went in.
    const shouted = "URGENT CARE";
    expect(slugToServiceName(serviceNameToSlug(shouted))).not.toBe(shouted);
  });

  it("title-cases each hyphen-separated word on the way back", () => {
    expect(slugToServiceName("some-unmapped-service")).toBe("Some Unmapped Service");
  });
});

describe("isServiceInDatabase", () => {
  it("is true for every mapped name", () => {
    for (const name of getAllServiceNames()) {
      expect(isServiceInDatabase(name)).toBe(true);
    }
  });

  it("is false for an unmapped name", () => {
    expect(isServiceInDatabase("Not A Real Service")).toBe(false);
    expect(isServiceInDatabase("")).toBe(false);
  });

  it("is true exactly for the known service names", () => {
    // PBT-03. The oracle is getAllServiceNames(), not `candidate in
    // SERVICE_NAME_TO_SLUG`.
    //
    // The `in` version was the original oracle here and it was WRONG: `in`
    // walks the prototype chain, so `"toString" in SERVICE_NAME_TO_SLUG` is
    // true while isServiceInDatabase("toString") is correctly false. fast-check
    // found it -- Counterexample: ["toString"] -- on a seed that an earlier run
    // happened not to draw.
    //
    // The implementation was right all along. It uses
    // Object.values(...).includes(...), which only sees own values, so it is
    // immune to the prototype-chain confusion that a naive `in` check would
    // have. See the regression test below.
    const known = new Set(getAllServiceNames());

    fc.assert(
      fc.property(fc.string({ maxLength: 40 }), (candidate) => {
        expect(isServiceInDatabase(candidate)).toBe(known.has(candidate));
      }),
    );
  });

  it("returns false for inherited Object.prototype members", () => {
    // Regression guard for the counterexample above. If someone ever rewrites
    // this predicate as `name in SERVICE_NAME_TO_SLUG` or
    // `!!SERVICE_NAME_TO_SLUG[name]`, these start returning true and a caller
    // could treat "constructor" as a real service.
    for (const inherited of [
      "toString",
      "constructor",
      "valueOf",
      "hasOwnProperty",
      "__proto__",
      "isPrototypeOf",
      "propertyIsEnumerable",
    ]) {
      expect(isServiceInDatabase(inherited)).toBe(false);
    }
  });
});
