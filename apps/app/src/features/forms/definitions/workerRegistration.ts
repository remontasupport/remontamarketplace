// Worker sign-up, as DATA (S1 step 9 revision). The steps, labels and wording are
// those of the page before S1. The rules come from apps/api's contract entry;
// the legacy adapter keeps the previous rules and request, so switching the
// backend back to legacy is a true rollback.
import { registrationContract } from "@remonta/api-contract";
import { defineForm, type LocalityValue } from "@remonta/form-engine";
import { CONSENT_WORDING_VERSION } from "@remonta/schemas/schema/workerRegistrationSchema";
import { contractorFormSchema } from "@/schema/contractorFormSchema";
import { fetchWithRetry } from "@/utils/apiRetry";

const legacyRules = contractorFormSchema.shape;

export const workerRegistrationForm = defineForm({
  id: "worker-registration",
  contract: registrationContract,
  submitEntry: "submitWorkerRegistration",
  captcha: "worker_register",
  constants: { consentWordingVersion: CONSENT_WORDING_VERSION },
  fromQuery: { zohoLeadId: "id" },
  successRedirect: "/registration/worker/success",
  intro: {
    title: "Welcome to Remonta",
    text: "There are thousands of people on Remonta looking for support workers just like you. Create your account today and tell us more about yourself",
    button: "Continue",
  },
  steps: [
    {
      title: "Where are you located?",
      fields: [{ name: "localityId", kind: "locality", label: "Postcode/Suburb" }],
    },
    {
      title: "Please provide your details",
      fields: [
        { name: "firstName", kind: "text", label: "First name" },
        { name: "lastName", kind: "text", label: "Last name" },
        { name: "mobile", kind: "phone", label: "Mobile number", hint: "e.g. 0412 345 678" },
        { name: "email", kind: "email", label: "Email" },
        {
          name: "emailVerification",
          kind: "emailCode",
          for: "email",
          sendEntry: "requestEmailCode",
          verifyEntry: "verifyEmailCode",
          availabilityEntry: "checkEmailAvailability",
          label: "Verify your email",
          hint: "We'll email you a 6-digit code. Enter it here, and you can then choose your password.",
          neverSaved: true,
        },
        {
          name: "password",
          kind: "password",
          visibleWhen: "emailVerification",
          label: "Password",
          hint: "Create a strong password that is 8+ characters long and includes uppercase and lowercase letters, numbers and special characters (e.g. @, !, #, %, %).",
          strengthMeter: true,
          neverSaved: true,
        },
      ],
    },
    {
      fields: [
        {
          name: "services",
          kind: "services",
          subcategoriesName: "supportWorkerCategories",
          title: "What services can you offer?",
          hint: "You can select more than one, but make sure you have the relevant qualifications.",
        },
      ],
    },
    {
      fields: [
        {
          name: "photoUploadId",
          kind: "photo",
          uploadEntry: "uploadRegistrationPhoto",
          label: "Profile Photo",
          hint: "Upload a professional photo that clearly shows your face. This helps clients recognize you.",
        },
        {
          name: "consentProfileShare",
          kind: "consent",
          label: "Consent to Share Profile with Clients",
          paragraphs: [
            "By ticking this box, I consent to Remonta sharing my submitted profile information and photo with potential clients.",
            "As part of working with Remonta, I understand and agree that my submitted profile information and photo will be shared with potential clients to help them choose the right worker for their needs.",
            "This is a necessary requirement to be considered for work opportunities.",
          ],
          statement: "I acknowledge and consent to my profile and photo will be shared with clients for matching purposes.",
        },
      ],
    },
  ],

  legacy: {
    // The rules the page used before S1, for the fields whose rule changed.
    fieldSchemas: {
      firstName: legacyRules.firstName,
      lastName: legacyRules.lastName,
      email: legacyRules.email,
      mobile: legacyRules.mobile,
      password: legacyRules.password,
      services: legacyRules.services,
      consentProfileShare: legacyRules.consentProfileShare,
    },

    // Kept in legacy mode only: the legacy route reveals an existing email at
    // submit anyway, so dropping the early check would only worsen legacy's
    // experience. In api mode an existing email gets the same answer as a new one.
    afterStep: {
      2: async (values) => {
        const email = values.email;
        if (typeof email !== "string" || !email) return null;
        try {
          const res = await fetchWithRetry("/api/auth/check-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }, { maxRetries: 2, initialDelay: 500 });
          const result = await res.json();
          return result.exists ? "An account with this email already exists. Please use a different email or log in to your existing account." : null;
        } catch {
          return null; // as before: continue if the check fails
        }
      },
    },

    // The exact body and route the page used before S1.
    submit: async (v, { query }) => {
      const locality = v.localityId as LocalityValue | null;
      const zohoLeadId = query.get("id");
      const body = {
        location: locality ? `${locality.name}, ${locality.state} ${locality.postcode}` : "",
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        mobile: v.mobile,
        password: v.password,
        services: v.services,
        supportWorkerCategories: v.supportWorkerCategories,
        photo: v.photoUploadId,
        consentProfileShare: v.consentProfileShare,
        ...(zohoLeadId ? { zohoLeadId } : {}),
      };
      const res = await fetchWithRetry(
        "/api/auth/register-async",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
        { maxRetries: 3, initialDelay: 1000, maxDelay: 5000 },
      );
      const result = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, kind: "failed", message: `Registration failed: ${result.error ?? "please try again"}` };
      return { ok: true };
    },
  },
});
