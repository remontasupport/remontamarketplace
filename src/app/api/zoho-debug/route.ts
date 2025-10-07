import { NextRequest, NextResponse } from 'next/server'
import { zohoService } from '@/lib/zoho'

// Transform flat Zoho data into organized sections
function organizeContactData(contact: any, attachments: any[] = []) {
  return {
    id: contact.id,

    personalDetails: {
      fullName: contact.Full_Name,
      firstName: contact.First_Name,
      lastName: contact.Last_Name,
      dateOfBirth: contact.Date_of_Birth,
      phone: contact.Phone,
      mobile: contact.Mobile,
      email: contact.Email,
      streetAddress: contact.Street_Address,
      addressLine2: contact.Address_Line_2,
      city: contact.City,
      state: contact.State,
      stateRegionProvince: contact.State_Region_Province,
      postalZipCode: contact.Postal_Zip_Code,
      gender: contact.Gender,
      genderIdentity: contact.Gender_Identity,
      contactType: contact.Option_1,
      workerType: contact.Worker_Type,
      accountName: contact.Account_Name,
      otherPhone: contact.Other_Phone,
    },

    onboardingDocumentsAndExpirationDates: {
      contractorAgreement: contact.Contractor_Agreement,
      caSignedDate: contact.CA_Signed_Date,
      proofOfWorkingRights: contact.Proof_of_Working_Rights_if_not_Aus_citizen_PR,
      pwExpiryDate: contact.PW_Expiry_date,
      ndisWorkerScreeningCheck: contact.NDIS_Worker_Screening_Check,
      ndisCheckExpiryDate: contact.NDIS_Check_Expiry_Date,
      workingWithChildrenCheck: contact.Working_With_Children_Check_if_applicable,
      wwcExpiryDate: contact.WWC_Expiry_Date,
      nationalPoliceCheck: contact.National_Police_Check,
      npcIssuanceDate: contact.NPC_Issuance_Date,
      publicLiabilityInsurance: contact.Public_Liability_Insurance,
      pliExpiryDate: contact.PLI_Expiry_Date,
      professionalIndemnityInsurance: contact.Professional_Indemnity_Insurance,
      piExpiryDate: contact.PI_Expiry_Date,
      firstAidCprCertificate: contact.First_Aid_CPR_Certificate_HLTAID011_HLTAID009,
      hltaid009ExpirationDate: contact.HLTAID009_Expiration_Date,
      infectionPreventionControlModule: contact.Infection_Prevention_Control_Module,
      ipIssuanceDate: contact.IP_Issuance_Date,
      foodSafetyTraining: contact.Food_Safety_Training_if_meal_prep,
      fstIssuanceDate: contact.FST_Issuance_Date,
      whiteCardConstructionSafety: contact.White_Card_Construction_Safety,
      wcExpiryDate: contact.WC_Expiry_date,
      driversLicence: contact.Driver_s_Licence || contact.Driver_s_License,
      driversLicenseExpiryDate: contact.Driver_s_License_Expiry_Date || contact.Driver_s_License_Expiry,
      vehicleRegistration: contact.Vehicle_Registration,
      vehicleRegistrationExpiryDate: contact.Vehicle_Registration_Expiry_Date,
      vehicleInsurance: contact.Vehicle_Insurance,
      vehicleInsuranceExpiryDate: contact.Vehicle_Insurance_Expiry_Date,
    },

    attachments: attachments.map(att => ({
      id: att.id,
      fileName: att.File_Name,
      size: att.Size,
      attachedBy: att.$attached_by?.name,
      dateAdded: att.Modified_Time,
      createdTime: att.Created_Time,
    })),

    metadata: {
      onboardingDocumentsSubmitted: contact.Onboarding_Documents_Submitted,
      createdTime: contact.Created_Time,
      modifiedTime: contact.Modified_Time,
      createdBy: contact.Created_By,
      modifiedBy: contact.Modified_By,
      owner: contact.Owner,
      layout: contact.Layout,
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication to protect this endpoint
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SYNC_API_SECRET

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching contacts from Zoho CRM Contacts module for debugging...')

    // Fetch all contacts from Zoho Contacts module
    const zohoContacts = await zohoService.getContractorContacts()

    console.log(`Found ${zohoContacts.length} contacts in Zoho CRM Contacts module`)

    // Fetch attachments for each contact
    const organizedContacts = await Promise.all(
      zohoContacts.map(async (contact) => {
        try {
          const attachments = await zohoService.getContactAttachments(contact.id)
          return organizeContactData(contact, attachments)
        } catch (error) {
          console.error(`Failed to fetch attachments for contact ${contact.id}:`, error)
          return organizeContactData(contact, [])
        }
      })
    )

    // Return organized data
    return NextResponse.json(
      {
        message: 'Zoho contacts fetched successfully from Contacts module',
        total: zohoContacts.length,
        contacts: organizedContacts,
        rawContacts: zohoContacts, // Include raw data for reference
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching Zoho contacts:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Zoho contacts from Contacts module',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
