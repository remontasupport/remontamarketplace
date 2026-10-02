// The reCAPTCHA branding Google requires in the user flow when its badge is
// hidden (reCAPTCHA FAQ, "I'd like to hide the reCAPTCHA badge"). The badge is
// hidden in app/globals.css (`.grecaptcha-badge`); this text is shown instead,
// under the sign-up wizard's buttons, on the form that loads reCAPTCHA.
// Kept free of JSX so a node test can check the two travel together.

export const RECAPTCHA_NOTICE = {
  before: "This site is protected by reCAPTCHA and the Google ",
  privacy: { label: "Privacy Policy", href: "https://policies.google.com/privacy" },
  between: " and ",
  terms: { label: "Terms of Service", href: "https://policies.google.com/terms" },
  after: " apply.",
} as const;

/** The whole sentence, for tests and plain-text uses. */
export const RECAPTCHA_NOTICE_TEXT = `${RECAPTCHA_NOTICE.before}${RECAPTCHA_NOTICE.privacy.label}${RECAPTCHA_NOTICE.between}${RECAPTCHA_NOTICE.terms.label}${RECAPTCHA_NOTICE.after}`;
