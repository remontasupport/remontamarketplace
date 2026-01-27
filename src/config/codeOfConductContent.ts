/**
 * Code of Conduct Content Configuration
 * Contains the full text of Remonta Code of Conduct
 * Split into two parts for easier reading and signing
 */

export interface CodeOfConductSection {
  title: string;
  content: string[];
}

export interface CodeOfConductContent {
  title: string;
  purpose: string;
  sections: CodeOfConductSection[];
}

/**
 * Part 1: Sections 1-6
 * - Professionalism
 * - Respect and Dignity
 * - Client-Centered Care and Support
 * - Privacy, Confidentiality, and Data Protection
 * - Compliance with Policies, Procedures, and NDIS Practice Standards
 * - Health and Safety Obligations
 */
export const CODE_OF_CONDUCT_PART1: CodeOfConductContent = {
  title: "Remonta Code of Conduct",
  purpose:
    "This Code of Conduct applies to all workers, including contractors and their employees, engaged with Remonta. It sets clear expectations for professional behavior, compliance with NDIS standards, safety, and ethical service delivery. This Code ensures the protection, safety, and dignity of clients, in alignment with NDIS Practice Standards and our internal policies.",
  sections: [
    {
      title: "1. Professionalism",
      content: [
        "All workers must perform their duties with integrity, honesty, and commitment to delivering high-quality services.",
        "Maintain professionalism in interactions with clients, colleagues, and stakeholders at all times.",
        "Workers must be punctual, reliable, and provide prior notice if unable to attend or complete scheduled tasks.",
        "Dress in a manner appropriate for the services provided and adhere to any uniform policies where applicable.",
      ],
    },
    {
      title: "2. Respect and Dignity",
      content: [
        "Treat all clients, their families, and fellow workers with respect and dignity, regardless of their background, culture, gender, religion, or disability.",
        "Respect clients' rights to make decisions about their own lives and services.",
        "Provide services that support client independence, empowerment, and choice in line with NDIS values.",
        "Harassment, discrimination, or abusive behavior of any kind will not be tolerated.",
      ],
    },
    {
      title: "3. Client-Centered Care and Support",
      content: [
        "Always prioritize the well-being, safety, and individual preferences of clients.",
        "Workers must adhere to individualized care and support plans, ensuring services are tailored to each client's specific needs and goals.",
        "Encourage and enable clients to participate actively in decisions affecting their care and service delivery.",
        "Provide services that are in line with the NDIS Practice Standards, ensuring clients receive high-quality care that fosters independence and dignity.",
      ],
    },
    {
      title: "4. Privacy, Confidentiality, and Data Protection",
      content: [
        "All workers must maintain the confidentiality of client information, in accordance with NDIS requirements and privacy laws.",
        "Sensitive client information must not be disclosed to unauthorized persons, and should only be shared for legitimate service delivery purposes.",
        "Workers must comply with Remonta's data protection policies and the Privacy Act 1988, ensuring that personal information is securely stored, shared only when necessary, and disposed of correctly.",
        "Any breaches of confidentiality or data security must be reported immediately and may result in disciplinary action.",
      ],
    },
    {
      title: "5. Compliance with Policies, Procedures, and NDIS Practice Standards",
      content: [
        "All workers must adhere to Remonta policies and procedures, including but not limited to:",
        "Workplace Health and Safety (WHS): Use PPE when required, follow safety protocols, and ensure all tools and equipment are properly maintained.",
        "Incident Management: Report incidents, injuries, and near-misses in accordance with the Incident Management Policy, and ensure that follow-up actions are taken.",
        "Risk Management: Follow established risk management protocols to identify, assess, and mitigate risks to clients, themselves, and others.",
        "Complaints Management: Handle client complaints according to the Complaints Management Policy, ensuring proper documentation and resolution.",
        "Workers must comply with all relevant NDIS Practice Standards, including:",
        "Rights and Responsibilities of NDIS participants",
        "Service Delivery in line with client-centered care",
        "Risk and Safeguards related to client well-being and safety",
      ],
    },
    {
      title: "6. Health and Safety Obligations",
      content: [
        "All workers are responsible for maintaining a safe working environment by:",
        "Taking reasonable care of their own health and safety, and ensuring actions do not pose risks to others.",
        "Using and maintaining Personal Protective Equipment (PPE) as required.",
        "Ensuring that all tools and equipment used in service delivery are properly maintained and safe to use.",
        "Completing Job Safety Analysis (JSA) and Safe Work Method Statements (SWMS) where necessary.",
        "Workers must immediately report any hazards, incidents, or injuries in accordance with the Incident Management Policy and cooperate in incident investigations.",
        "Workers must adhere to WHS regulations to prevent harm to clients, colleagues, and themselves.",
      ],
    },
  ],
};

/**
 * Part 2: Sections 7-12
 * - Mandatory Checks, Qualifications, and Compliance
 * - Training and Continuous Learning
 * - Conflict of Interest
 * - Reporting, Accountability, and Documentation
 * - Safeguarding Participants
 * - Commitment to NDIS Values
 */
export const CODE_OF_CONDUCT_PART2: CodeOfConductContent = {
  title: "Remonta Code of Conduct",
  purpose: "", // No purpose text for Part 2 - it's a continuation
  sections: [
    {
      title: "7. Mandatory Checks, Qualifications, and Compliance",
      content: [
        "All workers must maintain and update their mandatory checks and qualifications, including:",
        "NDIS Worker Screening Check",
        "Working with Children Check (if applicable)",
        "Police Check (National Criminal History Check)",
        "First Aid and CPR Certification (if applicable)",
        "Any other qualifications relevant to the services provided",
        "Workers must submit valid and current proof of these checks and qualifications before commencing work with Remonta.",
        "Workers are responsible for ensuring that all qualifications and certifications remain up-to-date and must provide updates promptly when certifications are renewed or reissued.",
        "Failure to maintain valid checks and certifications may result in the suspension or termination of work assignments.",
      ],
    },
    {
      title: "8. Training and Continuous Learning",
      content: [
        "All workers must complete the following mandatory training programs:",
        "NDIS Worker Orientation Module",
        "Supporting Effective Communication",
        "New Worker NDIS Induction Module",
        "Infection Prevention and Control",
        "Worker Code of Conduct Module",
        "Food Safety Training (if applicable)",
        "Workers are encouraged to pursue additional training opportunities to enhance their skills and knowledge in line with evolving industry standards.",
        "Workers must stay up to date with changes to policies, procedures, and NDIS standards, completing any required additional training as mandated by Remonta.",
      ],
    },
    {
      title: "9. Conflict of Interest",
      content: [
        "Workers must disclose any potential or actual conflicts of interest that may interfere with their responsibilities or compromise the quality of services provided.",
        "Workers must avoid any personal, financial, or other conflicts that could affect their ability to act in the best interests of clients or Remonta.",
        "Any conflict of interest must be reported to management as soon as it is identified.",
      ],
    },
    {
      title: "10. Reporting, Accountability, and Documentation",
      content: [
        "All workers must report incidents, accidents, or breaches of this Code of Conduct to their supervisor immediately.",
        "Workers are responsible for the accurate and timely completion of all required documentation, including:",
        "Progress Notes",
        "Service Delivery Logs",
        "Incident Reports",
        "Support Plan Review Reports",
        "Risk Management Plans",
        "Client Satisfaction Surveys",
        "Capacity Building Reports",
        "All documentation must be submitted in line with Remonta's reporting timelines. Failure to comply may result in delayed payment or disciplinary action.",
      ],
    },
    {
      title: "11. Safeguarding Participants",
      content: [
        "All workers must be committed to the safety and well-being of NDIS participants, taking proactive steps to safeguard vulnerable individuals from abuse, neglect, or exploitation.",
        "Workers must be familiar with and adhere to the safeguarding policies, reporting any concerns immediately through the appropriate channels.",
        "Maintain professional boundaries at all times and ensure that participants' rights to safety and dignity are upheld.",
      ],
    },
    {
      title: "12. Commitment to NDIS Values",
      content: [
        "All workers must respect and uphold the principles of the NDIS, including supporting the independence, rights, and participation of people with disabilities in society.",
        "Workers must provide services that are inclusive, empowering, and respectful of the diverse needs and abilities of NDIS participants.",
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
  "I have read and understood the Remonta Code of Conduct. I agree to comply with all requirements and understand that failure to do so may result in disciplinary action, including termination of my engagement with Remonta.";
