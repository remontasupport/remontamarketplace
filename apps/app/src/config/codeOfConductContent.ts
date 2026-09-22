/**
 * Code of Conduct Content Configuration
 * Contains the full text of Remonta Code of Conduct
 * Split into two parts for easier reading and signing
 * Applies to All Workers – Employees, Contractors & Contractor Personnel
 */

export interface CodeOfConductSection {
  title: string;
  content: string[];
}

export interface CodeOfConductContent {
  title: string;
  subtitle?: string;
  purpose: string;
  sections: CodeOfConductSection[];
}

/**
 * Part 1: Purpose, NDIS Code of Conduct, and Sections 1-6
 * - NDIS Code of Conduct
 * - Professionalism
 * - Respect, Dignity, and Inclusion
 * - Client-Centred Care and Support
 * - Privacy, Confidentiality, and Data Protection
 * - Compliance with Policies, Procedures, and Standards
 * - Health and Safety Obligations
 */
export const CODE_OF_CONDUCT_PART1: CodeOfConductContent = {
  title: "Remonta Code of Conduct",
  subtitle: "(Applies to All Workers – Employees, Contractors & Contractor Personnel)",
  purpose:
    "This Code of Conduct applies to all workers engaged with Remonta, including employees, independent contractors, and any personnel engaged by contractors.\n\nRemonta operates as a care services platform and is also a registered provider under the National Disability Insurance Scheme (NDIS). Remonta connects clients and participants with workers and service providers while maintaining strong compliance, safeguarding, and quality assurance frameworks.\n\nThis Code of Conduct incorporates and adopts the NDIS Code of Conduct and applies to all NDIS-related services delivered through Remonta.\n\nThe purpose of this Code is to:\n• set clear expectations for professional behaviour and ethical service delivery;\n• ensure the safety, dignity, and rights of clients and participants; and\n• meet Remonta's obligations under the NDIS Practice Standards, applicable laws, and regulatory requirements.\n\nCompliance with this Code is a condition of engagement and continued participation on the Remonta platform.",
  sections: [
    {
      title: "NDIS Code of Conduct",
      content: [
        "As a registered NDIS provider, Remonta requires all workers to comply with the NDIS Code of Conduct. Workers must:",
        "Act with respect for individual rights to freedom of expression, self-determination, and decision-making;",
        "Respect the privacy of people with disability;",
        "Provide supports and services in a safe and competent manner, with care and skill;",
        "Act with integrity, honesty, and transparency;",
        "Promptly raise and respond to concerns that may impact the quality or safety of supports;",
        "Prevent and respond to violence, abuse, neglect, exploitation, and sexual misconduct; and",
        "Take all reasonable steps to prevent breaches of this Code.",
        "Breaches of the NDIS Code of Conduct may result in disciplinary action, termination of engagement, and mandatory reporting to the NDIS Quality and Safeguards Commission where required.",
      ],
    },
    {
      title: "1. Professionalism",
      content: [
        "All workers must:",
        "Perform their duties with integrity, honesty, and professionalism;",
        "Communicate respectfully with clients, families, colleagues, and stakeholders;",
        "Be punctual, reliable, and provide timely notice if unable to attend or complete scheduled work;",
        "Present themselves appropriately for the services provided, including adherence to any identification or branding requirements issued by Remonta.",
        "Unprofessional conduct may result in suspension, removal from assignments, or termination of engagement.",
      ],
    },
    {
      title: "2. Respect, Dignity, and Inclusion",
      content: [
        "Workers must:",
        "Treat all clients and participants with respect and dignity at all times;",
        "Respect cultural, religious, gender, and personal differences;",
        "Support participant choice, independence, and control in line with NDIS values;",
        "Maintain appropriate professional boundaries.",
        "Harassment, discrimination, intimidation, or abusive behaviour of any kind will not be tolerated.",
      ],
    },
    {
      title: "3. Client-Centred Care and Support",
      content: [
        "Workers must:",
        "Prioritise the safety, wellbeing, and individual needs of each client or participant;",
        "Follow individual support plans, service agreements, and lawful instructions relevant to the assignment;",
        "Support participants to actively participate in decisions affecting their care;",
        "Deliver services in line with the NDIS Practice Standards and Remonta's quality expectations.",
      ],
    },
    {
      title: "4. Privacy, Confidentiality, and Data Protection",
      content: [
        "All workers must:",
        "Maintain strict confidentiality of client, participant, and Company information;",
        "Comply with the Privacy Act 1988 (Cth) and Remonta data protection policies;",
        "Only access, use, or disclose information where authorised and necessary for service delivery;",
        "Securely store and appropriately dispose of records and information.",
        "Any actual or suspected privacy breach must be reported immediately.",
      ],
    },
    {
      title: "5. Compliance with Policies, Procedures, and Standards",
      content: [
        "Workers must comply with all Remonta policies and procedures, including but not limited to:",
        "Workplace Health and Safety (WHS) – use PPE, follow safety protocols, and maintain equipment;",
        "Incident Management – promptly report incidents, injuries, near misses, and concerns;",
        "Risk Management – identify and mitigate risks to clients, themselves, and others;",
        "Complaints Management – respond appropriately and document complaints in line with policy.",
        "Workers must comply with all applicable NDIS Practice Standards, including those relating to:",
        "Rights and responsibilities of participants;",
        "Safe and effective service delivery;",
        "Safeguards and risk controls.",
      ],
    },
    {
      title: "6. Health and Safety Obligations",
      content: [
        "All workers are responsible for:",
        "Taking reasonable care of their own health and safety and that of others;",
        "Using and maintaining PPE where required;",
        "Ensuring tools and equipment are safe and fit for purpose;",
        "Completing Job Safety Analysis (JSA) and Safe Work Method Statements (SWMS) where required.",
        "Hazards, incidents, or injuries must be reported immediately in accordance with Remonta policies.",
      ],
    },
  ],
};

/**
 * Part 2: Sections 7-13
 * - Mandatory Checks, Qualifications, and Compliance
 * - Training and Continuous Learning
 * - Conflict of Interest
 * - Reporting, Accountability, and Documentation
 * - Safeguarding Participants
 * - Commitment to NDIS Values
 * - Breaches and Consequences
 */
export const CODE_OF_CONDUCT_PART2: CodeOfConductContent = {
  title: "Remonta Code of Conduct",
  purpose: "", // No purpose text for Part 2 - it's a continuation
  sections: [
    {
      title: "7. Mandatory Checks, Qualifications, and Compliance",
      content: [
        "All workers must maintain current and valid:",
        "NDIS Worker Screening Check (where applicable);",
        "Working with Children Check (where applicable);",
        "National Police Check;",
        "First Aid and CPR certification (where applicable);",
        "relevant qualifications, licences, and training.",
        "Workers must provide evidence of compliance prior to commencing work and promptly update records when renewed.",
        "Failure to maintain compliance may result in suspension or termination.",
      ],
    },
    {
      title: "8. Training and Continuous Learning",
      content: [
        "Workers must complete all mandatory training required by Remonta, including:",
        "NDIS Worker Orientation Module;",
        "Supporting Effective Communication;",
        "New Worker NDIS Induction Module;",
        "Infection Prevention and Control;",
        "Worker Code of Conduct Module;",
        "Food Safety Training (where applicable).",
        "Workers are expected to remain up to date with changes to policies, procedures, and NDIS requirements.",
      ],
    },
    {
      title: "9. Conflict of Interest",
      content: [
        "Workers must:",
        "Disclose any actual or potential conflicts of interest;",
        "Avoid situations that compromise professional judgment or service quality;",
        "Not use their position for personal, financial, or improper gain.",
        "Conflicts must be reported as soon as identified.",
      ],
    },
    {
      title: "10. Reporting, Accountability, and Documentation",
      content: [
        "Workers must accurately and promptly complete all required documentation, including:",
        "Progress notes;",
        "Service delivery logs;",
        "Incident reports;",
        "Support plan review reports;",
        "Risk management plans;",
        "Client satisfaction surveys;",
        "Capacity building reports.",
        "Failure to meet reporting obligations may result in delayed payment, suspension, or disciplinary action.",
      ],
    },
    {
      title: "11. Safeguarding Participants",
      content: [
        "All workers must:",
        "Take proactive steps to safeguard participants from abuse, neglect, exploitation, or harm;",
        "Maintain professional boundaries at all times;",
        "Report safeguarding concerns immediately through appropriate channels.",
        "Remonta has zero tolerance for abuse, neglect, or exploitation.",
      ],
    },
    {
      title: "12. Commitment to NDIS Values",
      content: [
        "Workers must uphold the principles of the NDIS by:",
        "Supporting independence, choice, and control;",
        "Promoting inclusion and participation;",
        "Delivering services that respect the rights and dignity of people with disability.",
      ],
    },
    {
      title: "13. Breaches and Consequences",
      content: [
        "Breaches of this Code of Conduct may result in:",
        "Additional training or corrective action;",
        "Suspension or removal from assignments or the platform;",
        "Termination of employment or contractual engagement;",
        "Mandatory reporting to regulators where required.",
      ],
    },
  ],
};

/**
 * Get Code of Conduct content by part
 */
export function getCodeOfConductContent(part: 1 | 2): CodeOfConductContent {
  return part === 1 ? CODE_OF_CONDUCT_PART1 : CODE_OF_CONDUCT_PART2;
}

/**
 * Acknowledgment statement for signature
 */
export const CODE_OF_CONDUCT_ACKNOWLEDGMENT =
  "All workers must acknowledge that they have read, understood, and agree to comply with this Code of Conduct as a condition of engagement with Remonta.";
