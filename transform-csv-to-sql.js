/**
 * Transform CSV from production ContractorProfile to SQL INSERT statements
 * for authentication worker_profiles table
 *
 * Usage: node transform-csv-to-sql.js <csv-file-path>
 * Example: node transform-csv-to-sql.js "C:\Users\toton\Downloads\Untitled spreadsheet - Sheet1 (2).csv"
 */

const fs = require('fs');
const path = require('path');

// Get CSV file path from command line
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('❌ Error: Please provide CSV file path');
  console.error('Usage: node transform-csv-to-sql.js <csv-file-path>');
  console.error('Example: node transform-csv-to-sql.js "downloads/data.csv"');
  process.exit(1);
}

if (!fs.existsSync(csvFilePath)) {
  console.error(`❌ Error: File not found: ${csvFilePath}`);
  process.exit(1);
}

console.log('📖 Reading CSV file:', csvFilePath);
console.log('⚙️  Processing...\n');

// Read CSV file
const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
const lines = csvContent.split('\n');

// Parse CSV properly (handles quoted fields with commas and newlines)
function parseCSVLine(line) {
  const fields = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Add last field
  fields.push(currentField);
  return fields;
}

// Helper: Escape SQL strings
function escapeSQLString(str) {
  if (str === null || str === undefined || str === '') {
    return 'NULL';
  }
  // Replace single quotes with two single quotes for SQL escaping
  const escaped = String(str).replace(/'/g, "''");
  return `'${escaped}'`;
}

// Helper: Transform languageSpoken to languages array
function transformLanguages(languageSpoken) {
  if (!languageSpoken || languageSpoken.trim() === '') {
    return "ARRAY[]::text[]";
  }
  const cleaned = languageSpoken.trim().replace(/'/g, "''");
  return `ARRAY['${cleaned}']::text[]`;
}

// Helper: Transform titleRole to services array
function transformServices(titleRole) {
  if (!titleRole || titleRole.trim() === '') {
    return "ARRAY[]::text[]";
  }
  const cleaned = titleRole.trim().replace(/'/g, "''");
  return `ARRAY['${cleaned}']::text[]`;
}

// Helper: Transform profilePicture to photos jsonb
function transformPhotos(profilePicture) {
  if (!profilePicture || profilePicture.trim() === '') {
    return "'[]'::jsonb";
  }
  const photoObj = {
    url: profilePicture.trim(),
    isPrimary: true
  };
  // Escape single quotes in JSON string
  const jsonStr = JSON.stringify([photoObj]).replace(/'/g, "''");
  return `'${jsonStr}'::jsonb`;
}

// Helper: Transform hasVehicleAccess to Yes/No
function transformHasVehicle(hasVehicleAccess) {
  if (!hasVehicleAccess) return "'No'";
  const value = String(hasVehicleAccess).toLowerCase().trim();
  if (value === 'true' || value === 't' || value === 'yes' || value === '1') {
    return "'Yes'";
  }
  return "'No'";
}

// Helper: Create location string
function transformLocation(city, state, postalZipCode) {
  const parts = [city, state, postalZipCode]
    .map(v => v ? String(v).trim() : '')
    .filter(v => v !== '');

  if (parts.length === 0) return 'NULL';
  const location = parts.join(', ').replace(/'/g, "''");
  return `'${location}'`;
}

// Parse header
const headers = parseCSVLine(lines[0]);
const dataLines = lines.slice(1).filter(line => line.trim() !== '');

console.log(`✅ Found ${dataLines.length} records to process`);

// Generate SQL statements
const sqlStatements = [];
let successCount = 0;
let skipCount = 0;

for (let i = 0; i < dataLines.length; i++) {
  const fields = parseCSVLine(dataLines[i]);

  // Skip if no ID (empty or incomplete row)
  if (!fields[0] || fields[0].trim() === '') {
    skipCount++;
    continue;
  }

  const [
    id,
    firstName,
    lastName,
    phone,
    gender,
    yearsOfExperience,
    aboutYou,
    qualificationsAndCertifications,
    funFact,
    hobbiesAndInterests,
    whatMakesBusinessUnique,
    additionalInformation,
    city,
    postalZipCode,
    state,
    latitude,
    longitude,
    languageSpoken,
    titleRole,
    profilePicture,
    hasVehicleAccess
  ] = fields;

  // Build SQL INSERT statement
  const sql = `INSERT INTO public.worker_profiles (
  id,
  "userId",
  "firstName",
  "lastName",
  mobile,
  gender,
  age,
  experience,
  introduction,
  qualifications,
  "funFact",
  hobbies,
  "uniqueService",
  "additionalInfo",
  city,
  "postalCode",
  state,
  latitude,
  longitude,
  languages,
  services,
  photos,
  "hasVehicle",
  location,
  "whyEnjoyWork",
  "createdAt",
  "updatedAt"
) VALUES (
  ${escapeSQLString(id)},
  NULL,
  ${escapeSQLString(firstName)},
  ${escapeSQLString(lastName)},
  ${phone && phone.trim() !== '' ? escapeSQLString(phone) : 'NULL'},
  ${gender && gender.trim() !== '' ? escapeSQLString(gender) : 'NULL'},
  NULL,
  ${yearsOfExperience && yearsOfExperience.trim() !== '' ? yearsOfExperience : 'NULL'},
  ${aboutYou && aboutYou.trim() !== '' ? escapeSQLString(aboutYou) : 'NULL'},
  ${qualificationsAndCertifications && qualificationsAndCertifications.trim() !== '' ? escapeSQLString(qualificationsAndCertifications) : 'NULL'},
  ${funFact && funFact.trim() !== '' ? escapeSQLString(funFact) : 'NULL'},
  ${hobbiesAndInterests && hobbiesAndInterests.trim() !== '' ? escapeSQLString(hobbiesAndInterests) : 'NULL'},
  ${whatMakesBusinessUnique && whatMakesBusinessUnique.trim() !== '' ? escapeSQLString(whatMakesBusinessUnique) : 'NULL'},
  ${additionalInformation && additionalInformation.trim() !== '' ? escapeSQLString(additionalInformation) : 'NULL'},
  ${city && city.trim() !== '' ? escapeSQLString(city) : 'NULL'},
  ${postalZipCode && postalZipCode.trim() !== '' ? escapeSQLString(postalZipCode) : 'NULL'},
  ${state && state.trim() !== '' ? escapeSQLString(state) : 'NULL'},
  ${latitude && latitude.trim() !== '' ? latitude : 'NULL'},
  ${longitude && longitude.trim() !== '' ? longitude : 'NULL'},
  ${transformLanguages(languageSpoken)},
  ${transformServices(titleRole)},
  ${transformPhotos(profilePicture)},
  ${transformHasVehicle(hasVehicleAccess)},
  ${transformLocation(city, state, postalZipCode)},
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);`;

  sqlStatements.push(sql);
  successCount++;
}

// Write output file
const outputPath = path.join(path.dirname(csvFilePath), 'worker_profiles_insert.sql');

const sqlContent = `-- ================================================================
-- AUTO-GENERATED SQL INSERT STATEMENTS
-- Generated: ${new Date().toISOString()}
-- Source File: ${path.basename(csvFilePath)}
-- Total Records: ${successCount}
-- Skipped Records: ${skipCount}
-- ================================================================
-- INSTRUCTIONS:
-- 1. Switch to AUTHENTICATION branch in Neon
-- 2. Open SQL Editor
-- 3. Copy and paste this entire file
-- 4. Run the script
-- ================================================================

${sqlStatements.join('\n\n')}

-- ================================================================
-- VERIFICATION QUERY
-- Run this after the inserts complete successfully
-- ================================================================
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT id) as unique_ids,
  COUNT(CASE WHEN languages IS NOT NULL AND array_length(languages, 1) > 0 THEN 1 END) as with_languages,
  COUNT(CASE WHEN services IS NOT NULL AND array_length(services, 1) > 0 THEN 1 END) as with_services,
  COUNT(CASE WHEN photos IS NOT NULL AND jsonb_array_length(photos) > 0 THEN 1 END) as with_photos,
  COUNT(CASE WHEN "hasVehicle" = 'Yes' THEN 1 END) as with_vehicle
FROM public.worker_profiles;
`;

fs.writeFileSync(outputPath, sqlContent, 'utf-8');

console.log('\n✅ SUCCESS!');
console.log('📄 Output file:', outputPath);
console.log('📊 Statistics:');
console.log(`   - Processed: ${successCount} records`);
console.log(`   - Skipped: ${skipCount} incomplete records`);
console.log('\n📋 Next Steps:');
console.log('   1. Open the generated SQL file');
console.log('   2. Switch to AUTHENTICATION branch in Neon');
console.log('   3. Copy the entire SQL content');
console.log('   4. Paste into Neon SQL Editor');
console.log('   5. Run the script');
console.log('\n✨ Done!');
