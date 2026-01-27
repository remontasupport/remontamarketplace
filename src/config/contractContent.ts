/**
 * Contract Content Configuration
 * Contains the full text of ABN (Contractor) and TFN (Casual Employee) agreements
 */

export interface ContractSection {
  title: string;
  content: string[];
}

export interface ContractContent {
  title: string;
  subtitle: string;
  sections: ContractSection[];
  closingStatement: string;
}

/**
 * ABN Contractor Agreement - 13 Sections
 */
export const ABN_CONTRACT: ContractContent = {
  title: "Contractor Agreement",
  subtitle: "(ABN)",
  sections: [
    {
      title: "1. Engagement of Services",
      content: [
        "1.1 The Contractor agrees to provide professional services to the Company as outlined by Remonta Services, which may include but is not limited to home & yard maintenance, cleaning, support work, and other NDIS-related or non-NDIS services.",
        "1.2 The scope of services may also include any other activities as mutually agreed between the Contractor and the Company, which may evolve over time.",
        "1.3 The Contractor acknowledges that the Company is acting as an intermediary between NDIS participants and the Contractor.",
        "1.4 Where the Contractor is a company, the Contractor agrees to ensure that all personnel assigned to provide services under this Agreement are appropriately trained, qualified, and compliant with the terms outlined herein.",
        "1.5 The Contractor warrants that they have all applicable insurance to perform the duties.",
      ],
    },
    {
      title: "2. Term of Agreement",
      content: [
        "2.1 This Agreement shall commence on the Effective Date and shall continue until terminated by either party in accordance with the terms outlined herein.",
        "2.2 Either party may terminate this Agreement by providing 14 days' written notice to the other party.",
      ],
    },
    {
      title: "3. Contractor Obligations",
      content: [
        "3.1 The Contractor agrees to adhere to all Company policies, procedures, and any updates thereof, and to sign acknowledgment forms to confirm their understanding.",
        "3.2 The Contractor shall ensure that:",
        "• Before and after photos are taken,",
        "• Job completion forms are filled out,",
        "• Job Safety Analysis (JSA), Safe Work Method Statements (SWMS), and any other required safety documentation are completed prior to commencing work.",
        "• Marketing materials are provided to customers upon request. Contractors may also be required to wear company-branded shirts and display marketing materials as directed by the Company.",
        "3.3 The Contractor must submit all required reports, including but not limited to:",
        "• Progress Notes",
        "• Service Delivery Logs",
        "• Incident Reports",
        "• Support Plans",
        "• Emergency Plans",
        "• Behavioural Support Reports",
        "• Therapy Assessment and Review Reports",
        "• Risk Management Plans",
        "• Client Satisfaction Surveys",
        "• Capacity Building Reports",
        "3.4 Reports must be submitted before payment can be made for services rendered.",
      ],
    },
    {
      title: "4. Compliance & Training",
      content: [
        "4.1 The Contractor agrees to complete the following NDIS training modules:",
        "• Worker Orientation Module",
        "• Supporting Effective Communication",
        "• New Worker NDIS Induction Module",
        "• Food Safety Training (for relevant workers)",
        "• Infection Prevention and Control",
        "4.2 The Contractor and any personnel engaged by the Contractor to provide services must provide the following checks, certifications, and qualifications prior to commencing any work under this Agreement:",
        "• NDIS Worker Screening Check",
        "• Working with Children Check",
        "• Police Check (National Criminal History Check)",
        "• NDIS Worker Orientation Module Certificate",
        "• Proof of relevant qualifications and training certificates",
        "• First Aid and CPR Certification (if applicable)",
        "• Proof of insurance, including public liability and professional indemnity (if applicable)",
        "4.3 The Contractor is responsible for maintaining appropriate Workplace Health and Safety (WHS) compliance, including First Aid Kits, Personal Protective Equipment (PPE), and ensuring that all equipment used in the provision of services is properly maintained.",
        "4.4 Where the Contractor is a company, it is the responsibility of the Contractor to ensure that all personnel assigned to the services have completed the required training modules and provided the necessary checks and qualifications.",
      ],
    },
    {
      title: "5. Payment Terms",
      content: [
        "5.1 The Contractor will be compensated as per the agreed rates and acknowledges that the payment is inclusive of all taxes and worker entitlements.",
        "5.2 The Contractor will be compensated for valid and compliant invoices submitted by the Contractor within a period of up to 4 weeks from the date the invoice is received.",
        "5.3 Payments will be withheld if the Contractor fails to provide required reports or if there is any non-compliance with Company policies and procedures.",
      ],
    },
    {
      title: "6. Confidentiality & Data Protection",
      content: [
        "6.1 The Contractor agrees to protect and keep confidential any sensitive information related to the Company, its clients, and any other confidential data encountered in the course of providing services.",
        "6.2 The Contractor must comply with all applicable data protection laws and Company policies regarding the handling of personal information.",
      ],
    },
    {
      title: "7. Dispute Resolution",
      content: [
        "7.1 Any disputes arising out of or related to this Agreement shall be resolved through good faith negotiations between the parties.",
        "7.2 If the dispute cannot be resolved within 30 days, the matter shall be referred to mediation, and if unresolved, legal recourse may be taken in accordance with the governing law.",
      ],
    },
    {
      title: "8. Governing Law",
      content: [
        "8.1 This Agreement is governed by and shall be construed in accordance with the laws of the state or territory in which the Contractor primarily operates or provides services under this Agreement.",
      ],
    },
    {
      title: "9. Force Majeure",
      content: [
        "9.1 Neither party shall be liable for any failure or delay in performance due to circumstances beyond its reasonable control, including but not limited to natural disasters, government actions, or other events of force majeure.",
      ],
    },
    {
      title: "10. Conflict of Interest",
      content: [
        "10.1 The Contractor must disclose any actual or potential conflicts of interest to the Company and must not engage in any activities that would interfere with their ability to fulfill their obligations under this Agreement.",
      ],
    },
    {
      title: "11. Termination",
      content: [
        "11.1 The Company reserves the right to terminate this Agreement with immediate effect if the Contractor is in breach of any material term of this Agreement, including but not limited to failure to comply with policies, training, or reporting requirements.",
        "11.2 Where the Contractor is a company, the Contractor must ensure that any notice of termination includes adequate arrangements for the completion of any outstanding services by a qualified individual.",
      ],
    },
    {
      title: "12. Confidentiality and Non-Poaching",
      content: [
        "12.1 The Contractor must keep all information relating to Remonta, its clients, operations, pricing, staff, and contractors strictly confidential and use it only as needed to perform their duties. This obligation continues after the Agreement ends.",
        "12.2 Upon termination, the Contractor must return or permanently delete all confidential materials and confirm this in writing if requested.",
        "12.3 During the Agreement and for 12 months after it ends, the Contractor must not, without written consent:",
        "(a) approach or accept work directly from any client introduced by Remonta;",
        "(b) solicit or poach staff, contractors, or clients from Remonta.",
        "12.4 Any breach may result in withheld payments, termination, and legal action including claims for damages or injunctive relief.",
      ],
    },
    {
      title: "13. ABN Status Declaration",
      content: [
        "13.1 The Contractor declares and warrants that they have a current, active ABN (Australian Business Number) and are actively trading as a business.",
      ],
    },
  ],
  closingStatement:
    "By signing this Agreement, the Contractor confirms that they have read and understood all terms and conditions outlined in this Agreement. They agree to comply with the Company's policies, procedures, and obligations, including those related to compliance, training, and marketing requirements. The Contractor acknowledges their responsibilities under the NDIS standards and this Agreement and understands that failure to meet these obligations may result in termination of this Agreement or other penalties as outlined.",
};

/**
 * TFN Casual Employment Agreement - 9 Sections
 */
export const TFN_CONTRACT: ContractContent = {
  title: "Casual Employment Agreement",
  subtitle: "(TFN)",
  sections: [
    {
      title: "1. Engagement of Services",
      content: [
        "1.1 The Employee is engaged on a casual basis under the applicable Award, which may include but is not limited to the Social, Community, Home Care and Disability Services Industry Award 2010 (SCHADS Award).",
        "1.2 The Employee agrees to perform the duties assigned by Remonta, which may include support work.",
        "1.3 The Employee acknowledges that work is provided on an as-needed basis, with no guarantee of ongoing or regular hours.",
      ],
    },
    {
      title: "2. Term of Agreement",
      content: [
        "2.1 This Agreement commences on the Start Date and continues until terminated in accordance with this Agreement.",
        "2.2 Either party may terminate this Agreement by providing up to four (4) weeks' written notice. This notice period is required to allow Remonta sufficient time to make alternative arrangements for vulnerable clients who rely on continuity of care and services. Remonta may, at its discretion, reduce or waive the notice period if suitable replacement arrangements are made earlier. Remonta may terminate immediately in cases of serious misconduct.",
      ],
    },
    {
      title: "3. Employee Obligations",
      content: [
        "3.1 The Employee agrees to follow all Remonta policies, procedures, and updates, and to sign acknowledgment forms as required.",
        "3.2 The Employee must carry out their duties with due care, skill, and diligence, including:",
        "• Completing job safety documentation (e.g. Support Worker Visit Report) as directed.",
        "• Submitting required reports such as progress notes, service delivery logs, or incident reports where applicable.",
        "3.3 Failure to comply with obligations may result in disciplinary action, up to and including termination.",
      ],
    },
    {
      title: "4. Compliance & Training",
      content: [
        "4.1 The Employee agrees to complete mandatory training, which may include:",
        "• NDIS Worker Orientation Module",
        "• Supporting Effective Communication",
        "• Infection Prevention and Control",
        "• Food Safety (if relevant to role)",
        "• Other training as reasonably required by Remonta.",
        "4.2 The Employee must provide copies of required checks and certifications before commencing work, including:",
        "• NDIS Worker Screening Check",
        "• Working with Children Check",
        "• Police Check",
        "• First Aid and CPR Certification (if applicable)",
        "4.3 The Employee agrees to comply with all workplace health and safety obligations, including the use of Personal Protective Equipment (PPE) and maintaining safe work practices.",
      ],
    },
    {
      title: "5. Pay and Entitlements",
      content: [
        "5.1 The Employee will be paid at rates not less than those prescribed by the relevant Award for their role (Social, Community, Home Care and Disability Services Industry Award 2010 (SCHADS Award)).",
        "5.2 The Employee's pay rate will depend on their level of experience and specialization and will be confirmed in writing by Remonta in a separate Pay Guide, which may be updated from time to time.",
        "5.3 Superannuation contributions will be made in accordance with applicable laws.",
        "5.4 The Employee will receive casual loading as provided under the relevant Award in lieu of paid leave entitlements.",
      ],
    },
    {
      title: "6. Confidentiality & Data Protection",
      content: [
        "6.1 The Employee must not disclose or misuse confidential information relating to Remonta, its clients, or operations.",
        "6.2 This obligation continues after employment ends.",
      ],
    },
    {
      title: "7. Conflict of Interest",
      content: [
        "7.1 The Employee must disclose any actual or potential conflicts of interest to Remonta and must not engage in outside activities that interfere with their duties.",
      ],
    },
    {
      title: "8. Dispute Resolution",
      content: [
        "8.1 Any disputes will first be addressed through good faith discussions.",
        "8.2 If unresolved, the matter may be referred to mediation or otherwise resolved under the laws of New South Wales.",
      ],
    },
    {
      title: "9. Termination",
      content: [
        "9.1 Remonta may terminate employment without notice in cases of serious misconduct.",
        "9.2 Otherwise, termination will be in line with clause 2.2 and the minimum requirements under the National Employment Standards (NES).",
      ],
    },
  ],
  closingStatement:
    "By signing this Agreement, the Employee confirms that they have read and understood all terms and conditions outlined in this Agreement. They agree to comply with the Company's policies, procedures, and obligations, including those related to compliance, training, and marketing requirements. The Employee acknowledges their responsibilities under the NDIS standards and this Agreement and understands that failure to meet these obligations may result in termination of this Agreement or other penalties as outlined.",
};

/**
 * Get contract content by type
 */
export function getContractContent(type: "abn" | "tfn"): ContractContent {
  return type === "abn" ? ABN_CONTRACT : TFN_CONTRACT;
}
