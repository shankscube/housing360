export interface HudOption {
  value: string;
  label: string;
}

const DATA_QUALITY: HudOption[] = [
  { value: '1', label: 'Full name reported' },
  { value: '2', label: 'Partial, street name, or code name reported' },
  { value: '8', label: "Client doesn't know" },
  { value: '9', label: 'Client prefers not to answer' },
  { value: '99', label: 'Data not collected' },
];

const SSN_DOB_DATA_QUALITY: HudOption[] = [
  { value: '1', label: 'Full SSN/DOB reported' },
  { value: '2', label: 'Approximate or partial SSN/DOB reported' },
  { value: '8', label: "Client doesn't know" },
  { value: '9', label: 'Client prefers not to answer' },
  { value: '99', label: 'Data not collected' },
];

const YES_NO_DISCLOSURE: HudOption[] = [
  { value: '0', label: 'No' },
  { value: '1', label: 'Yes' },
  { value: '8', label: "Client doesn't know" },
  { value: '9', label: 'Client prefers not to answer' },
  { value: '99', label: 'Data not collected' },
];

/**
 * HUD code lists (label/value pairs, including the 8/9/99 "client doesn't
 * know" / "prefers not to answer" / "data not collected" codes). Defined once
 * here and served verbatim from `GET /api/reference/hud-options` — the
 * frontend never hardcodes an option list. Code/label pairs should be
 * verified against the current HMIS Data Standards revision (see
 * `design.md`'s Open Questions) before this is treated as authoritative.
 */
export const HUD_OPTIONS: Record<string, HudOption[]> = {
  // HUD 3.01 Name Data Quality
  nameDataQuality: DATA_QUALITY,
  // HUD 3.02 SSN Data Quality
  ssnDataQuality: SSN_DOB_DATA_QUALITY,
  // HUD 3.03 DOB Data Quality
  dobDataQuality: SSN_DOB_DATA_QUALITY,

  // HUD 3.04 Race and Ethnicity (multi-select)
  raceEthnicity: [
    { value: '1', label: 'American Indian, Alaska Native, or Indigenous' },
    { value: '2', label: 'Asian or Asian American' },
    { value: '3', label: 'Black, African American, or African' },
    { value: '4', label: 'Hispanic/Latina/e/o' },
    { value: '5', label: 'Middle Eastern or North African' },
    { value: '6', label: 'Native Hawaiian or Pacific Islander' },
    { value: '7', label: 'White' },
    { value: '8', label: "Client doesn't know" },
    { value: '9', label: 'Client prefers not to answer' },
    { value: '99', label: 'Data not collected' },
  ],

  // HUD 3.07 Veteran Status
  veteranStatus: YES_NO_DISCLOSURE,

  // Veteran detail: discharge status
  dischargeStatus: [
    { value: 'honorable', label: 'Honorable' },
    { value: 'general', label: 'General' },
    { value: 'medical', label: 'Medical' },
    { value: 'bad_conduct', label: 'Bad conduct' },
    { value: 'dishonorable', label: 'Dishonorable' },
    { value: 'other', label: 'Other' },
    { value: '8', label: "Client doesn't know" },
    { value: '9', label: 'Client prefers not to answer' },
  ],

  // HUD 3.08 Disabling Condition (at enrollment)
  disablingCondition: YES_NO_DISCLOSURE,

  // HUD 3.15 Relationship to Head of Household
  relationshipToHoh: [
    { value: '1', label: 'Self (head of household)' },
    { value: '2', label: 'Head of household’s child' },
    { value: '3', label: 'Head of household’s spouse or partner' },
    { value: '4', label: "Head of household's other relation member (other relation to head of household)" },
    { value: '5', label: "Other: non-relation member" },
  ],

  // HUD 3.917 Living Situation — grouped by category
  situationCategory: [
    { value: 'homeless', label: 'Homeless' },
    { value: 'institutional', label: 'Institutional' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'permanent', label: 'Permanent' },
    { value: 'other', label: 'Other' },
  ],
  situationType: [
    // Homeless
    { value: '16', label: 'Place not meant for habitation (Homeless)' },
    { value: '1', label: 'Emergency shelter (Homeless)' },
    { value: '18', label: 'Safe Haven (Homeless)' },
    // Institutional
    { value: '15', label: 'Foster care home or foster care group home (Institutional)' },
    { value: '6', label: 'Hospital or other residential non-psychiatric medical facility (Institutional)' },
    { value: '7', label: 'Jail, prison, or juvenile detention facility (Institutional)' },
    { value: '25', label: 'Long-term care facility or nursing home (Institutional)' },
    { value: '4', label: 'Psychiatric hospital or other psychiatric facility (Institutional)' },
    { value: '5', label: 'Substance abuse treatment facility or detox center (Institutional)' },
    // Temporary
    { value: '29', label: 'Residential project or halfway house with no homeless criteria (Temporary)' },
    { value: '14', label: "Hotel or motel paid for without emergency shelter voucher (Temporary)" },
    { value: '27', label: 'Host home, non-crisis (Temporary)' },
    { value: '2', label: 'Transitional housing for homeless persons (Temporary)' },
    { value: '32', label: "Staying or living with family, temporary tenure (Temporary)" },
    { value: '36', label: "Staying or living with friends, temporary tenure (Temporary)" },
    // Permanent
    { value: '3', label: 'Permanent housing for formerly homeless persons (Permanent)' },
    { value: '10', label: 'Rental by client, no ongoing subsidy (Permanent)' },
    { value: '19', label: 'Rental by client, with ongoing subsidy (Permanent)' },
    { value: '20', label: 'Owned by client, with ongoing subsidy (Permanent)' },
    { value: '21', label: 'Owned by client, no ongoing subsidy (Permanent)' },
    { value: '22', label: "Staying or living with family, permanent tenure (Permanent)" },
    { value: '23', label: "Staying or living with friends, permanent tenure (Permanent)" },
    // Other
    { value: '37', label: 'Worker unable to determine (Other)' },
    { value: '8', label: "Client doesn't know (Other)" },
    { value: '9', label: 'Client prefers not to answer (Other)' },
    { value: '99', label: 'Data not collected (Other)' },
  ],
  rentalSubsidyType: [
    { value: '1', label: 'GPD TIP housing subsidy' },
    { value: '2', label: 'Public housing tenant-based' },
    { value: '3', label: 'Public housing project-based' },
    { value: '4', label: 'Housing Choice Voucher (HCV)' },
    { value: '5', label: 'Emergency Housing Voucher (EHV)' },
    { value: '6', label: 'Family Unification Program (FUP) voucher' },
    { value: '7', label: 'Foster Youth to Independence Initiative (FYI) voucher' },
    { value: '8', label: 'VASH housing subsidy' },
    { value: '9', label: 'Section 8 project-based / moderate rehab' },
    { value: '10', label: 'HOME subsidy' },
    { value: '11', label: 'Rental Assistance Demonstration (RAD)' },
    { value: '12', label: 'HUD-VASH voucher' },
    { value: '13', label: 'Other subsidy source' },

  ],

  // HUD 4.02 Income Sources
  incomeSources: [
    { value: 'earned', label: 'Earned income' },
    { value: 'ssi', label: 'SSI' },
    { value: 'ssdi', label: 'SSDI' },
    { value: 'unemployment', label: 'Unemployment insurance' },
    { value: 'vaServiceConnected', label: 'VA service-connected disability' },
    { value: 'vaNonService', label: 'VA non-service-connected disability pension' },
    { value: 'privateDisability', label: 'Private disability insurance' },
    { value: 'workersComp', label: "Worker's compensation" },
    { value: 'tanf', label: 'TANF' },
    { value: 'generalAssistance', label: 'General assistance' },
    { value: 'socialSecurityRetirement', label: 'Social Security retirement' },
    { value: 'pension', label: 'Pension or retirement income' },
    { value: 'childSupport', label: 'Child support' },
    { value: 'alimony', label: 'Alimony or other spousal support' },
    { value: 'other', label: 'Other income source' },
  ],

  // HUD 4.03 Non-Cash Benefits
  nonCashBenefitSources: [
    { value: 'snap', label: 'SNAP' },
    { value: 'wic', label: 'WIC' },
    { value: 'tanfChildCare', label: 'TANF child care services' },
    { value: 'tanfTransportation', label: 'TANF transportation services' },
    { value: 'otherTanf', label: 'Other TANF-funded services' },
    { value: 'soar', label: 'Connection with SOAR' },
    { value: 'other', label: 'Other benefit source' },
  ],

  // HUD 4.04 Health Insurance
  healthInsuranceTypes: [
    { value: 'medicaid', label: 'Medicaid' },
    { value: 'medicare', label: 'Medicare' },
    { value: 'schip', label: "State Children's Health Insurance Program (SCHIP)" },
    { value: 'vha', label: 'Veterans Health Administration (VHA)' },
    { value: 'employer', label: "Employer-provided health insurance" },
    { value: 'cobra', label: 'COBRA' },
    { value: 'privatePay', label: 'Private pay health insurance' },
    { value: 'state', label: 'State health insurance for adults' },
    { value: 'ihs', label: 'Indian Health Services (IHS)' },
    { value: 'adap', label: 'AIDS Drug Assistance Program (ADAP)' },
    { value: 'ryanWhite', label: 'Ryan White HIV/AIDS Program' },
    { value: 'other', label: 'Other health insurance' },
  ],
  insuranceReasonCodes: [
    { value: '1', label: 'Applied; decision pending' },
    { value: '2', label: 'Applied; client not eligible' },
    { value: '3', label: 'Client did not apply' },
    { value: '4', label: 'Insufficient documentation to determine' },
    { value: '8', label: "Client doesn't know" },
    { value: '9', label: 'Client prefers not to answer' },
    { value: '99', label: 'Data not collected' },
  ],

  // HUD 4.11 / R-series health and DV status
  healthStatus: [
    { value: '1', label: 'Excellent' },
    { value: '2', label: 'Very good' },
    { value: '3', label: 'Good' },
    { value: '4', label: 'Fair' },
    { value: '5', label: 'Poor' },
    { value: '8', label: "Client doesn't know" },
    { value: '9', label: 'Client prefers not to answer' },
    { value: '99', label: 'Data not collected' },
  ],
  pregnancyStatus: YES_NO_DISCLOSURE,
  domesticViolenceSurvivor: YES_NO_DISCLOSURE,
  dvWhenOccurred: [
    { value: 'within_3_months', label: 'Within the past three months' },
    { value: '3_to_6_months', label: 'Three to six months ago' },
    { value: '6_to_12_months', label: 'Six months to a year ago' },
    { value: 'more_than_year', label: 'More than a year ago' },
    { value: '8', label: "Client doesn't know" },
    { value: '9', label: 'Client prefers not to answer' },
    { value: '99', label: 'Data not collected' },
  ],
  dvCurrentlyFleeing: YES_NO_DISCLOSURE,

  // HUD 4.05–4.10 Disabilities
  disabilityType: [
    { value: 'physical', label: 'Physical disability' },
    { value: 'developmental', label: 'Developmental disability' },
    { value: 'chronicHealth', label: 'Chronic health condition' },
    { value: 'hivAids', label: 'HIV/AIDS' },
    { value: 'mentalHealth', label: 'Mental health disorder' },
    { value: 'substanceUse', label: 'Substance use disorder' },
  ],
  disabilityResponse: YES_NO_DISCLOSURE,
  tCellSource: [
    { value: 'client_report', label: 'Client report' },
    { value: 'medical_record', label: 'Medical record' },
    { value: 'other', label: 'Other source' },
  ],
  viralLoadSource: [
    { value: 'client_report', label: 'Client report' },
    { value: 'medical_record', label: 'Medical record' },
    { value: 'other', label: 'Other source' },
  ],

  // Enrollment status (used by Program & Enrollment step and My Clients' status badge)
  enrollmentStatus: [
    { value: 'pending', label: 'Awaiting referral' },
    { value: 'active', label: 'Enrolled' },
    { value: 'exited', label: 'Exited' },
  ],

  // Case status (minimal, used by cases/ensure and Interaction Summary)
  caseStatus: [
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
  ],

  interactionSummaryStatus: [
    { value: 'open', label: 'Open' },
    { value: 'follow_up_needed', label: 'Follow-up needed' },
    { value: 'resolved', label: 'Resolved' },
  ],
};
