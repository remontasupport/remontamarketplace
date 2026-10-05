// Worker sign-up, as DATA (S1 step 9 revision). The steps, labels and wording are
// those of the page before S1; the rules come from apps/api's contract entry, so
// the form and the server agree by construction. The pre-S1 page and its legacy
// adapter were removed on 2026-10-02 (cut-over clean-up).
import { registrationContract } from "@remonta/api-contract";
import { defineForm } from "@remonta/form-engine";
import { CONSENT_WORDING_VERSION } from "@remonta/schemas/schema/workerRegistrationSchema";

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
          // The direct upload (U3): a ticket for storage, then confirm; the api never carries the bytes.
          ticketEntry: "createPhotoUploadTicket",
          confirmEntry: "confirmPhotoUpload",
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
});
