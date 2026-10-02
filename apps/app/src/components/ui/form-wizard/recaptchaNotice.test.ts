// Google permits hiding the reCAPTCHA badge only if its branding is shown in the
// user flow. This test keeps the CSS that hides the badge and the notice that
// replaces it together: remove or break one, and the gate fails.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RECAPTCHA_NOTICE, RECAPTCHA_NOTICE_TEXT } from "./recaptchaNotice";

const read = (rel: string) => readFileSync(join(__dirname, rel), "utf8");

describe("hiding the reCAPTCHA badge", () => {
  const css = read("../../../app/globals.css");
  const hidesBadge = /\.grecaptcha-badge\s*\{[^}]*visibility:\s*hidden/.test(css);

  it("is done with visibility, as Google's example does, not display", () => {
    expect(hidesBadge).toBe(true);
    expect(css).not.toMatch(/\.grecaptcha-badge\s*\{[^}]*display:\s*none/);
  });

  it("comes with Google's exact branding text and both policy links", () => {
    if (!hidesBadge) return; // badge visible: no notice required
    expect(RECAPTCHA_NOTICE_TEXT).toBe("This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.");
    expect(RECAPTCHA_NOTICE.privacy.href).toBe("https://policies.google.com/privacy");
    expect(RECAPTCHA_NOTICE.terms.href).toBe("https://policies.google.com/terms");
  });

  it("shows that notice on the form that loads reCAPTCHA", () => {
    if (!hidesBadge) return;
    const view = read("./FormWizardView.tsx");
    const glue = read("../../../features/forms/FormWizard.tsx");
    expect(view).toContain("export function RecaptchaNotice");
    expect(view).toContain("RECAPTCHA_NOTICE.privacy.href");
    expect(view).toContain("RECAPTCHA_NOTICE.terms.href");
    expect(view).toMatch(/rel="noopener noreferrer"/);
    // The glue decides: api mode loads reCAPTCHA and gets the notice; legacy loads neither.
    expect(glue).toMatch(/footnote=\{backend\.mode === "api" \? <RecaptchaNotice \/> : undefined\}/);
  });
});
