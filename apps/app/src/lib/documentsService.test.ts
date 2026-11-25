import { describe, expect, it } from "vitest";
import { serviceSessionFor } from "./documentsService";

const SECRET = "s".repeat(40);
const env = { secret: SECRET, userId: "admin-service-id" };

describe("serviceSessionFor", () => {
  it("acts as the configured admin for the right secret", () => {
    expect(serviceSessionFor(SECRET, env, 1000)).toEqual({ user: { id: "admin-service-id", role: "ADMIN", authAt: 1000 } });
  });

  it("refuses a missing or wrong secret", () => {
    expect(serviceSessionFor(null, env, 1000)).toBeNull();
    expect(serviceSessionFor("", env, 1000)).toBeNull();
    expect(serviceSessionFor("x".repeat(40), env, 1000)).toBeNull();
    expect(serviceSessionFor(SECRET.slice(1), env, 1000)).toBeNull();
  });

  it("is off unless both variables are set and the secret is long enough", () => {
    expect(serviceSessionFor(SECRET, { secret: undefined, userId: "a" }, 1000)).toBeNull();
    expect(serviceSessionFor(SECRET, { secret: SECRET, userId: " " }, 1000)).toBeNull();
    expect(serviceSessionFor("short", { secret: "short", userId: "a" }, 1000)).toBeNull();
  });
});
