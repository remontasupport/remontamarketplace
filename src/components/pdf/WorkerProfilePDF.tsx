/**
 * Worker Profile PDF Template - PROFESSIONAL EDITION
 * Pixel-perfect replication of Remonta's design
 * Two-column layout: Beige (#F5E6D3) + Dark Navy (#0C1628)
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// ============================================================================
// STYLES - Exact Pixel-Perfect Design
// ============================================================================

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },

  // LEFT COLUMN - Brand Secondary Background (35%)
  leftColumn: {
    width: '35%',
    backgroundColor: '#B1C3CD',
    padding: '20px 25px',
    paddingTop: 200, // Space for circular photo
  },

  // RIGHT COLUMN - Dark Navy Background (65%)
  rightColumn: {
    width: '65%',
    backgroundColor: '#0C1628',
    padding: '25px 30px',
    color: '#FFFFFF',
  },

  // CIRCULAR PHOTO - Positioned absolutely to overlap both columns
  photoWrapper: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 180,
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 90,
    padding: 5,
    zIndex: 10,
  },
  photoInner: {
    width: 170,
    height: 170,
    borderRadius: 85,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  // REMONTA LOGO - Top right corner
  logoText: {
    position: 'absolute',
    top: 15,
    right: 25,
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },

  // SECTION HEADERS
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#2C3E50',
    marginBottom: 10,
    marginTop: 5,
  },
  sectionTitleWhite: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 8,
  },

  // CONTACT SECTION (Left column)
  contactItem: {
    fontSize: 9,
    color: '#2C3E50',
    marginBottom: 6,
    lineHeight: 1.4,
  },

  // ABOUT ME SECTION (Left column)
  aboutLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#2C3E50',
    marginTop: 8,
    marginBottom: 3,
  },
  aboutValue: {
    fontSize: 9,
    color: '#4A5568',
    marginLeft: 8,
    marginBottom: 2,
    lineHeight: 1.3,
  },

  // Worker Header Section with Tertiary Background
  workerHeaderTertiary: {
    backgroundColor: '#F8E8D8',
    padding: '20px 25px',
    marginLeft: -30,
    marginRight: -30,
    marginTop: 35,
    marginBottom: 20,
  },

  // NAME & TITLE (Right column header)
  workerName: {
    fontSize: 42,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  workerTitle: {
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: '3px solid #1f2937',
  },

  // BIO PARAGRAPH
  bioText: {
    fontSize: 10,
    color: '#1f2937',
    lineHeight: 1.6,
    marginTop: 12,
  },

  // SERVICES LIST (Right column)
  serviceItem: {
    fontSize: 10,
    color: '#FFFFFF',
    marginBottom: 8,
    marginLeft: 15,
    lineHeight: 1.4,
  },

  // QUOTES (Hobbies, unique service, why enjoy work)
  quoteSection: {
    marginTop: 15,
    marginBottom: 15,
  },
  quoteTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 9.5,
    color: '#E8E8E8',
    fontFamily: 'Helvetica-Oblique',
    lineHeight: 1.5,
    paddingLeft: 5,
  },

  // EXPERIENCE SECTION (Left column)
  experienceItem: {
    fontSize: 9,
    color: '#2C3E50',
    marginBottom: 8,
    marginLeft: 12,
    lineHeight: 1.4,
  },

  // SPACING
  spacer: {
    height: 15,
  },
  smallSpacer: {
    height: 8,
  },
});

// ============================================================================
// TYPES
// ============================================================================

interface WorkerProfilePDFProps {
  worker: {
    firstName: string;
    lastName: string;
    age: number | null;
    location: string | null;
    experience: string | null;
    introduction: string | null;
    qualifications: string | null;
    hasVehicle: string | null;
    funFact: string | null;
    hobbies: string | null;
    uniqueService: string | null;
    whyEnjoyWork: string | null;
    photos: string[];
    languages?: string[];
    services?: string[];
  };
}

// ============================================================================
// HELPER FUNCTION - Convert image URL to data URI for PDF
// ============================================================================

async function getImageDataUri(url: string): Promise<string> {
  try {
    // For now, return the URL directly
    // @react-pdf/renderer can handle remote URLs
    return url;
  } catch (error) {
    console.error('Failed to load image:', error);
    return '';
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

const WorkerProfilePDF: React.FC<WorkerProfilePDFProps> = ({ worker }) => {
  const mainPhoto = worker.photos && worker.photos.length > 0 ? worker.photos[0] : null;
  const languagesList = worker.languages && worker.languages.length > 0
    ? worker.languages.join(', ')
    : 'English';
  const displayName = `${worker.firstName} ${worker.lastName?.[0] || ''}.`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* CIRCULAR PHOTO - Overlapping both columns */}
        {mainPhoto && (
          <View style={styles.photoWrapper}>
            <View style={styles.photoInner}>
              <Image
                src={mainPhoto}
                style={styles.photo}
              />
            </View>
          </View>
        )}

        {/* LEFT COLUMN - Beige/Cream */}
        <View style={styles.leftColumn}>
          {/* CONTACT SECTION */}
          <View>
            <Text style={styles.sectionTitle}>Contact</Text>
            <Text style={styles.contactItem}>1300-134-153</Text>
            <Text style={styles.contactItem}>contact@remontaservices.com.au</Text>
            <Text style={styles.contactItem}>www.remontaservice.com.au</Text>
          </View>

          <View style={styles.spacer} />

          {/* ABOUT ME SECTION */}
          <View>
            <Text style={styles.sectionTitle}>About Me</Text>

            <Text style={styles.aboutLabel}>Language</Text>
            <Text style={styles.aboutValue}>• {languagesList}</Text>

            <Text style={styles.aboutLabel}>Years of Experience</Text>
            <Text style={styles.aboutValue}>• {worker.experience || '2 years'}</Text>

            <Text style={styles.aboutLabel}>Drive Access</Text>
            <Text style={styles.aboutValue}>• {worker.hasVehicle || 'Yes'}</Text>

            {worker.location && (
              <>
                <Text style={styles.aboutLabel}>Location</Text>
                <Text style={styles.aboutValue}>• {worker.location}</Text>
              </>
            )}
          </View>

          <View style={styles.spacer} />

          {/* EXPERIENCE SECTION */}
          <View>
            <Text style={styles.sectionTitle}>Experience</Text>

            {worker.qualifications && (
              <Text style={styles.experienceItem}>• {worker.qualifications}</Text>
            )}

            <Text style={styles.experienceItem}>
              • {worker.experience || '2 years'} of professional support work
            </Text>
          </View>
        </View>

        {/* RIGHT COLUMN - Dark Navy */}
        <View style={styles.rightColumn}>
          {/* REMONTA LOGO */}
          <Text style={styles.logoText}>♥ REMONTA</Text>

          {/* NAME & BIO SECTION - Tertiary Background */}
          <View style={styles.workerHeaderTertiary}>
            {/* WORKER NAME & TITLE */}
            <Text style={styles.workerName}>
              {displayName}
            </Text>
            <Text style={styles.workerTitle}>Support Worker</Text>

            {/* BIO / INTRODUCTION */}
            <Text style={styles.bioText}>
              {worker.introduction ||
                `Skilled in daily living support, community participation, and implementing trauma-informed care plans. Passionate about mentoring staff, implementing person-centered care plans, and coordinating supports that ensure client wellbeing, independence, and dignity.`}
            </Text>
          </View>

          {/* SERVICES SECTION */}
          <View>
            <Text style={styles.sectionTitleWhite}>Services</Text>

            {worker.services && worker.services.length > 0 ? (
              worker.services.map((service, index) => (
                <Text key={index} style={styles.serviceItem}>• {service}</Text>
              ))
            ) : (
              <>
                <Text style={styles.serviceItem}>• Personal care and assistance</Text>
                <Text style={styles.serviceItem}>• Capacity Building and Independence</Text>
                <Text style={styles.serviceItem}>• Support clients with mobility and physical needs</Text>
                <Text style={styles.serviceItem}>• Emotional support and companionship</Text>
                <Text style={styles.serviceItem}>• Care plan implementation</Text>
              </>
            )}
          </View>

          {/* HOBBIES */}
          {worker.hobbies && (
            <View style={styles.quoteSection}>
              <Text style={styles.quoteTitle}>Hobbies</Text>
              <Text style={styles.quoteText}>"{worker.hobbies}"</Text>
            </View>
          )}

          {/* WHAT MAKES YOUR SERVICES UNIQUE */}
          {worker.uniqueService && (
            <View style={styles.quoteSection}>
              <Text style={styles.quoteTitle}>What makes your services unique?</Text>
              <Text style={styles.quoteText}>"{worker.uniqueService}"</Text>
            </View>
          )}

          {/* WHY DO YOU ENJOY YOUR WORK */}
          <View style={styles.quoteSection}>
            <Text style={styles.quoteTitle}>Why do you enjoy your work?</Text>
            <Text style={styles.quoteText}>
              "{worker.whyEnjoyWork || 'I feel deeply fulfilled when I see my clients happy and content after our shift—it reminds me of the positive impact I can make in their daily lives'}"
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default WorkerProfilePDF;
