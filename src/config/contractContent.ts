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
 * ABN Contractor Agreement - 15 Sections
 * Remonta Platform Contractor Agreement (ABN)
 */
export const ABN_CONTRACT: ContractContent = {
  title: "Remonta Platform Contractor Agreement",
  subtitle: "(ABN) - Independent Contractor – Platform Access & Services Agreement",
  sections: [
    {
      title: "1. Engagement & Platform Role",
      content: [
        "1.1 The Company operates a platform that facilitates connections between clients, participants, organisations, and independent service providers.",
        "1.2 The Contractor is engaged as an independent contractor, not an employee, to make their services available via the Remonta platform.",
        "1.3 The Contractor acknowledges that the Company acts solely as an intermediary and platform facilitator and does not direct, control, or supervise how services are performed.",
        "1.4 NDIS Registration Status",
        "1.4.1 The Company is a registered provider under the National Disability Insurance Scheme (NDIS).",
        "1.4.2 Where services introduced through the platform are funded or regulated by the NDIS, the Contractor acknowledges that services must be delivered in accordance with:",
        "• the NDIS Practice Standards; and",
        "• the NDIS Code of Conduct.",
        "1.4.3 This clause does not:",
        "• create an agency relationship;",
        "• alter the Contractor's independent business status; or",
        "• give the Company control over the manner in which services are delivered.",
        "1.5 Nothing in this Agreement creates a relationship of employment, partnership, joint venture, or agency.",
        "1.6 The Company does not guarantee any minimum volume of work, and the Contractor is under no obligation to accept any work offered via the platform.",
        "1.7 Where the Contractor is a company, the Contractor is fully responsible for all personnel engaged to deliver services under this Agreement.",
      ],
    },
    {
      title: "2. Scope of Services",
      content: [
        "2.1 Services offered via the platform may include, but are not limited to:",
        "• home and yard maintenance",
        "• cleaning and household services",
        "• disability and support services",
        "• therapeutic or allied health services",
        "• other NDIS and non-NDIS professional services",
        "2.2 The Contractor determines how services are delivered, subject to:",
        "• applicable laws and regulations",
        "• NDIS requirements (where relevant)",
        "• platform rules and compliance obligations",
        "2.3 The scope of services may evolve over time based on platform updates or mutual agreement.",
      ],
    },
    {
      title: "3. Term of Agreement",
      content: [
        "3.1 This Agreement commences on the Effective Date and continues until terminated in accordance with this Agreement.",
        "3.2 Either party may terminate this Agreement by providing fourteen (14) days' written notice.",
        "3.3 The Company may terminate this Agreement immediately where the Contractor:",
        "• breaches a material term of this Agreement",
        "• fails compliance, screening, or audit requirements",
        "• poses a risk to clients, participants, or the platform",
        "• engages in misconduct, misrepresentation, or fraud",
      ],
    },
    {
      title: "4. Contractor Obligations",
      content: [
        "4.1 The Contractor must comply with:",
        "• all platform policies and procedures",
        "• any updates issued by the Company",
        "• NDIS Practice Standards (where applicable)",
        "4.2 The Contractor must complete and maintain all required platform records, including where relevant:",
        "• before and after photos",
        "• job completion forms",
        "• Job Safety Analysis (JSA)",
        "• Safe Work Method Statements (SWMS)",
        "4.3 The Contractor must submit accurate and timely reports, including but not limited to:",
        "• progress notes",
        "• service delivery logs",
        "• incident reports",
        "• risk management and emergency plans",
        "• behavioural support or therapy assessment reports (where applicable)",
        "4.4 Payment is conditional upon submission of complete and compliant documentation.",
      ],
    },
    {
      title: "5. Compliance, Screening & Training",
      content: [
        "5.1 The Contractor must complete all mandatory training modules required by the platform, including NDIS-related training where applicable.",
        "5.2 Prior to providing services, the Contractor must supply valid evidence of:",
        "• an active ABN and business trading status",
        "• NDIS Worker Screening Check (where applicable)",
        "• Working with Children Check (where applicable)",
        "• National Police Check",
        "• relevant qualifications and certifications",
        "• First Aid and CPR certification (where applicable)",
        "• public liability and professional indemnity insurance",
        "5.3 The Contractor is responsible for maintaining all compliance documentation in a current and valid state.",
        "5.4 Where the Contractor is a company, these obligations extend to all personnel engaged to deliver services.",
      ],
    },
    {
      title: "6. Workplace Health & Safety",
      content: [
        "6.1 The Contractor is solely responsible for:",
        "• workplace health and safety compliance",
        "• safe systems of work",
        "• provision and use of appropriate PPE",
        "• maintenance and safety of tools and equipment",
        "6.2 The Company does not supervise, direct, or control the Contractor's work methods.",
      ],
    },
    {
      title: "7. Payment & Invoicing",
      content: [
        "7.1 The Contractor must submit invoices in accordance with platform requirements, including all required reports, documentation, and job references.",
        "7.2 All invoices are subject to a four (4) week processing period, commencing from the date the Company receives a valid and compliant invoice.",
        "7.3 Payment will be made after completion of the processing period, provided all compliance, verification, and reporting requirements have been satisfied.",
        "7.4 The Contractor acknowledges that the processing period is required for verification, reconciliation, and audit purposes.",
        "7.5 The Contractor is solely responsible for:",
        "• GST (if registered)",
        "• income tax",
        "• superannuation",
        "• all business-related expenses",
        "7.6 The Company may withhold payment where:",
        "• documentation or reports are incomplete or inaccurate",
        "• compliance obligations are not met",
        "• an audit, investigation, or dispute is ongoing",
      ],
    },
    {
      title: "8. Platform Conduct, Branding & Marketing",
      content: [
        "8.1 The Contractor must maintain professional conduct when delivering services connected to the platform.",
        "8.2 The Contractor may be required to:",
        "• provide platform marketing materials to clients upon request",
        "• present professionally when delivering services",
        "• comply with reasonable branding or identification requirements",
        "8.3 Branding or presentation requirements are platform standards only and do not create employment, exclusivity, or control.",
      ],
    },
    {
      title: "9. Confidentiality & Data Protection",
      content: [
        "9.1 The Contractor must keep confidential all information relating to:",
        "• the Company",
        "• clients and participants",
        "• platform operations, pricing, and data",
        "9.2 Confidentiality obligations survive termination of this Agreement.",
        "9.3 The Contractor must comply with all applicable privacy and data protection laws.",
      ],
    },
    {
      title: "10. Conflict of Interest",
      content: [
        "10.1 The Contractor must promptly disclose any actual or potential conflicts of interest.",
        "10.2 The Contractor must not engage in conduct that undermines client trust, platform integrity, or Company relationships.",
      ],
    },
    {
      title: "11. Non-Circumvention & Non-Poaching",
      content: [
        "11.1 During the term of this Agreement and for twelve (12) months after termination, the Contractor must not, without written consent:",
        "• bypass the platform to work directly with any client introduced by Remonta",
        "• solicit or poach Remonta clients, contractors, or staff",
        "11.2 Any breach may result in:",
        "• withheld payments",
        "• immediate termination",
        "• injunctive relief and claims for damages",
      ],
    },
    {
      title: "12. Force Majeure",
      content: [
        "12.1 Neither party is liable for failure or delay in performance caused by events beyond their reasonable control.",
      ],
    },
    {
      title: "13. Governing Law & Jurisdiction",
      content: [
        "13.1 This Agreement is governed by and construed in accordance with the laws of New South Wales, Australia.",
        "13.2 The parties submit to the exclusive jurisdiction of the courts of New South Wales.",
      ],
    },
    {
      title: "14. ABN Declaration",
      content: [
        "14.1 The Contractor warrants that:",
        "• they hold a valid and active ABN",
        "• they operate an independent business",
        "• they are not entitled to employee benefits under this Agreement",
      ],
    },
    {
      title: "15. Entire Agreement",
      content: [
        "15.1 This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements, understandings, or arrangements.",
      ],
    },
  ],
  closingStatement:
    "By accepting this Agreement, the Contractor confirms that they have read, understood, and agree to all terms and acknowledge their obligations as an independent contractor operating via the Remonta platform.",
};

/**
 * TFN Casual Employment Agreement - 18 Sections
 * Remonta Casual Employment Agreement (TFN)
 */
export const TFN_CONTRACT: ContractContent = {
  title: "Remonta Casual Employment Agreement",
  subtitle: "(TFN) - Casual Employee – Assignment-Based Engagement",
  sections: [
    {
      title: "1. Employment Relationship",
      content: [
        "1.1 The Company employs the individual (\"Employee\") on a casual basis in accordance with this Agreement and the Fair Work Act 2009 (Cth).",
        "1.2 This Agreement applies only when:",
        "• the Employee has been selected for a specific assignment or role; and",
        "• this Agreement has been accepted by both parties.",
        "1.3 This Agreement governs employment only and operates alongside the Remonta Platform Access & Profile Agreement, which does not create employment or entitlement to work.",
        "1.4 NDIS Registration",
        "The Company is a registered provider under the National Disability Insurance Scheme (NDIS).",
        "Where services performed under this Agreement are funded or regulated by the NDIS, the Employee must comply with the NDIS Practice Standards, NDIS Code of Conduct, and all associated reporting and incident management requirements.",
        "Compliance with NDIS requirements is a condition of ongoing employment and assignment allocation.",
      ],
    },
    {
      title: "2. Nature of Casual Employment",
      content: [
        "2.1 The Employee is engaged as a casual employee.",
        "2.2 The Employee acknowledges that:",
        "• there is no guarantee of ongoing work",
        "• there is no guarantee of regular hours",
        "• the Company is not obliged to offer work",
        "• the Employee is not obliged to accept work",
        "2.3 Casual employment includes a casual loading in lieu of paid leave entitlements, in accordance with the Fair Work Act 2009 (Cth).",
        "2.4 Nothing in this Agreement guarantees minimum hours, income, or ongoing employment.",
      ],
    },
    {
      title: "3. Position & Duties",
      content: [
        "3.1 The Employee may be engaged to perform duties including, but not limited to:",
        "• disability and support services",
        "• cleaning and household services",
        "• yard maintenance",
        "• therapeutic or allied health services (where qualified)",
        "• other agreed services per assignment",
        "3.2 Duties may vary between assignments depending on client needs.",
        "3.3 The Employee must perform all duties:",
        "• with reasonable care and skill",
        "• in accordance with client requirements",
        "• in compliance with Company policies and procedures",
        "• in line with NDIS Practice Standards (where applicable)",
      ],
    },
    {
      title: "4. Assignments & Rostering",
      content: [
        "4.1 Work is offered on an assignment-by-assignment basis.",
        "4.2 Each assignment will specify:",
        "• client or participant",
        "• location",
        "• role and duties",
        "• hours or duration",
        "• applicable pay rate",
        "4.3 The Company may vary or cancel assignments where required for operational, compliance, or client-related reasons.",
      ],
    },
    {
      title: "5. Compensation (Assignment-Based)",
      content: [
        "5.1 The Employee will be compensated only for work performed under accepted assignments.",
        "5.2 The applicable pay rate for each assignment will be:",
        "• communicated prior to commencement of the assignment; and",
        "• confirmed in writing via the platform, assignment notice, or written communication.",
        "5.3 Pay rates may vary based on:",
        "• role and duties performed",
        "• qualifications, experience, and certifications",
        "• type of service provided",
        "• funding source (including NDIS price limits)",
        "• location, time, and complexity of the assignment",
        "5.4 All pay rates will comply with:",
        "• the Fair Work Act 2009 (Cth); and",
        "• any applicable Modern Award, including (where relevant) the SCHADS Award or Cleaning Services Award, or any successor instrument.",
        "5.5 Acceptance of an assignment constitutes acceptance of the applicable pay rate for that assignment.",
      ],
    },
    {
      title: "6. Pay Cycle, Timesheets & Processing",
      content: [
        "6.1 The Employee will be paid on a weekly pay cycle.",
        "6.2 Payment will be made in the next scheduled pay run following receipt of a valid and compliant timesheet and required documentation, submitted by the nominated cut-off time.",
        "6.3 Timesheets and reports submitted after the cut-off may be processed in the following pay cycle.",
        "6.4 Where documentation is incomplete, inaccurate, or non-compliant, payment may be deferred until the next pay cycle following correction.",
        "6.5 Payslips will be issued in accordance with legislative requirements.",
      ],
    },
    {
      title: "7. Superannuation & Tax",
      content: [
        "7.1 The Company will make superannuation contributions in accordance with legislative requirements.",
        "7.2 Tax will be withheld in accordance with the Employee's TFN declaration and applicable law.",
      ],
    },
    {
      title: "8. Leave Entitlements",
      content: [
        "8.1 As a casual employee, the Employee is not entitled to:",
        "• paid annual leave",
        "• paid personal/carer's leave",
        "• paid notice of termination",
        "8.2 The Employee may be entitled to unpaid leave entitlements in accordance with the Fair Work Act 2009 (Cth).",
      ],
    },
    {
      title: "9. Casual Conversion",
      content: [
        "9.1 The Employee acknowledges their right to request conversion from casual to permanent employment in accordance with the Fair Work Act 2009 (Cth), where applicable.",
        "9.2 Nothing in this Agreement guarantees that conversion will be granted.",
      ],
    },
    {
      title: "10. Compliance & Screening",
      content: [
        "10.1 Employment is conditional upon maintaining valid:",
        "• identity documents",
        "• National Police Check",
        "• NDIS Worker Screening Check (where applicable)",
        "• Working with Children Check (where applicable)",
        "• relevant qualifications and certifications",
        "10.2 Failure to maintain required compliance may result in suspension or termination.",
      ],
    },
    {
      title: "11. Reporting & Documentation",
      content: [
        "11.1 The Employee must complete all required documentation, including:",
        "• progress notes",
        "• service delivery logs",
        "• incident reports",
        "• risk assessments and safety forms",
        "11.2 Failure to submit required documentation may result in delayed payment or removal from assignments.",
      ],
    },
    {
      title: "12. Workplace Health & Safety",
      content: [
        "12.1 The Employee must:",
        "• comply with workplace health and safety requirements",
        "• use PPE where required",
        "• immediately report hazards or incidents",
        "12.2 The Employee must not perform unsafe work.",
      ],
    },
    {
      title: "13. Code of Conduct",
      content: [
        "13.1 The Employee must act professionally at all times.",
        "13.2 Serious misconduct, including dishonesty, neglect, abuse, exploitation, or misrepresentation, may result in immediate termination.",
      ],
    },
    {
      title: "14. Confidentiality & Privacy",
      content: [
        "14.1 The Employee must keep confidential all:",
        "• client information",
        "• Company information",
        "• platform and system data",
        "14.2 Confidentiality obligations continue after employment ends.",
      ],
    },
    {
      title: "15. Deductions",
      content: [
        "15.1 Any deductions from wages will only be made where:",
        "• permitted by law; and",
        "• authorised in writing by the Employee.",
      ],
    },
    {
      title: "16. Termination",
      content: [
        "16.1 Either party may terminate casual employment at any time, without notice.",
        "16.2 The Company may terminate immediately for:",
        "• serious misconduct",
        "• compliance breaches",
        "• risk to clients or participants",
      ],
    },
    {
      title: "17. Governing Law & Jurisdiction",
      content: [
        "17.1 This Agreement is governed by and construed in accordance with the laws of New South Wales, Australia.",
        "17.2 The parties submit to the exclusive jurisdiction of the courts of New South Wales.",
      ],
    },
    {
      title: "18. Entire Agreement",
      content: [
        "18.1 This Agreement constitutes the entire employment agreement between the parties.",
        "18.2 No employment exists outside accepted assignments.",
      ],
    },
  ],
  closingStatement:
    "By accepting this Agreement, the Employee confirms that they: understand they are engaged on a casual, assignment-based basis; acknowledge there is no guarantee of ongoing work or income; accept that pay rates are confirmed per assignment; understand their rights under the Fair Work Act; and agree to comply with Company and NDIS requirements.",
};

/**
 * Get contract content by type
 */
export function getContractContent(type: "abn" | "tfn"): ContractContent {
  return type === "abn" ? ABN_CONTRACT : TFN_CONTRACT;
}
