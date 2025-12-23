/**
 * Worker Profile PDF Template - Pixel-Perfect Canva Design
 * Two-column layout with tertiary backgrounds and circular photo
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// ============================================================================
// STYLES - Exact Browser Design Replication
// ============================================================================

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    position: 'relative',
  },

  // PHOTO TERTIARY BACKGROUND (Left side)
  photoTertiaryBg: {
    position: 'absolute',
    top: 44,
    left: 0,
    width: '35%',
    height: 206,
    backgroundColor: '#F8E8D8',
    zIndex: 1,
  },

  // CIRCULAR PHOTO - Centered in left column
  photoWrapper: {
    position: 'absolute',
    top: 39,
    left: 50,
    width: 224,
    height: 224,
    backgroundColor: '#FFFFFF',
    borderRadius: 112,
    padding: 5,
    zIndex: 10,
  },
  photoInner: {
    width: 214,
    height: 214,
    borderRadius: 107,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 107,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: 60,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },

  // LEFT COLUMN - Brand Secondary Background
  leftColumn: {
    width: '35%',
    backgroundColor: '#B1C3CD',
    padding: '20px 16px 24px 16px',
    paddingTop: 204,
    minHeight: 842,
  },

  // RIGHT COLUMN - Dark Navy Background
  rightColumn: {
    width: '65%',
    backgroundColor: '#0C1628',
    padding: '20px 24px',
    minHeight: 842,
    color: '#FFFFFF',
    position: 'relative',
  },

  // REMONTA LOGO
  remontaLogo: {
    position: 'absolute',
    top: 14,
    right: 284,
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },

  // NAME & BIO SECTION - Tertiary Background
  workerHeaderTertiary: {
    backgroundColor: '#F8E8D8',
    padding: '12px 20px',
    marginLeft: -24,
    marginRight: -24,
    marginTop: 24,
    marginBottom: 16,
    minHeight: 206,
  },

  // WORKER NAME & TITLE
  workerName: {
    fontSize: 48,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
    marginBottom: 4,
    lineHeight: 1.2,
  },
  workerTitle: {
    fontSize: 16,
    color: '#1f2937',
    paddingBottom: 6,
    borderBottomWidth: 3,
    borderBottomColor: '#1f2937',
    borderBottomStyle: 'solid',
    marginBottom: 8,
    width: 144,
  },

  // BIO TEXT
  bioText: {
    fontSize: 10,
    color: '#1f2937',
    lineHeight: 1.5,
    marginTop: 8,
  },

  // SECTION TITLES - Left Column
  leftSectionTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
    marginBottom: 8,
    marginTop: 0,
  },

  // SECTION TITLES - Right Column
  rightSectionTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 12,
  },

  // CONTACT SECTION
  contactItem: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 1.4,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    width: 8,
    height: 8,
    marginRight: 4,
  },

  // ABOUT ME SECTION
  aboutItem: {
    marginBottom: 8,
  },
  aboutLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  aboutValue: {
    fontSize: 11,
    color: '#4b5563',
    marginLeft: 4,
  },

  // EXPERIENCE SECTION
  experienceContainer: {
    marginTop: 24,
  },
  experienceItem: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 6,
  },
  experienceDot: {
    width: 8,
    height: 8,
    backgroundColor: '#0C1628',
    borderRadius: 4,
    marginRight: 6,
    marginTop: 3,
  },
  experienceText: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.5,
    flex: 1,
  },

  // SERVICES SECTION
  servicesContainer: {
    marginBottom: 16,
  },
  serviceItem: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 6,
  },
  serviceBullet: {
    width: 6,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    marginRight: 6,
    marginTop: 4,
  },
  serviceText: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 1.6,
    flex: 1,
  },

  // QUOTE SECTIONS
  quoteSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  quoteTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  quoteText: {
    fontSize: 12,
    color: '#d1d5db',
    fontFamily: 'Helvetica-Oblique',
    lineHeight: 1.6,
  },

  // SPACING
  spacer: {
    height: 24,
  },
});

// ============================================================================
// TYPES
// ============================================================================

interface WorkerProfilePDFProps {
  worker: {
    firstName: string;
    lastName: string;
    location?: string | null;
    languages?: string[];
    services?: string[];
  };
  croppedImageUrl?: string;
  selectedImageUrl?: string;
  editableData?: {
    languages?: string;
    location?: string;
    servicesItems?: string[];
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

const WorkerProfilePDF: React.FC<WorkerProfilePDFProps> = ({
  worker,
  croppedImageUrl,
  selectedImageUrl,
  editableData
}) => {
  // Use cropped/selected image, or fallback to original
  // Only use valid image URLs (not blob URLs which don't work in PDF)
  const mainPhoto = worker.photos?.[0] || null;
  const initials = `${worker.firstName?.[0] || ''}${worker.lastName?.[0] || ''}`;
  const displayName = `${worker.firstName} ${worker.lastName?.[0] || ''}.`;

  // Use editable data if available, otherwise use original data
  // Handle empty strings from editable fields
  const languages = (editableData?.languages && editableData.languages.trim()) ||
    (worker.languages && worker.languages.length > 0 ? worker.languages.join(', ') : 'English');
  const experience = (editableData?.experience && editableData.experience.trim()) || worker.experience || '2 years';
  const vehicle = (editableData?.vehicle && editableData.vehicle.trim()) || worker.hasVehicle || 'Yes';
  const location = (editableData?.location && editableData.location.trim()) || worker.location || '';

  const experienceItems = (editableData?.experienceItems && editableData.experienceItems.length > 0)
    ? editableData.experienceItems
    : [
        worker.qualifications,
        `${worker.experience || '2 years'} of professional support work`
      ].filter(Boolean);

  const servicesItems = (editableData?.servicesItems && editableData.servicesItems.length > 0)
    ? editableData.servicesItems
    : (worker.services || [
        'Personal care and assistance',
        'Capacity Building and Independence',
        'Support clients with mobility and physical needs',
        'Emotional support and companionship',
        'Care plan implementation'
      ]);


  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* PHOTO TERTIARY BACKGROUND */}
        <View style={styles.photoTertiaryBg} />

        {/* CIRCULAR PHOTO - Overlapping left column */}
        <View style={styles.photoWrapper}>
          <View style={styles.photoInner}>
            {mainPhoto ? (
              <Image src={mainPhoto} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>{initials}</Text>
              </View>
            )}
          </View>
        </View>

        {/* LEFT COLUMN - Brand Secondary Background */}
        <View style={styles.leftColumn}>
          {/* CONTACT SECTION */}
          <View>
            <Text style={styles.leftSectionTitle}>Contact</Text>
            <Text style={styles.contactItem}>📞 1300-134-153</Text>
            <Text style={styles.contactItem}>✉️ contact@remontaservices.com.au</Text>
            <Text style={styles.contactItem}>🌐 www.remontaservice.com.au</Text>
          </View>

          <View style={styles.spacer} />

          {/* ABOUT ME SECTION */}
          <View>
            <Text style={styles.leftSectionTitle}>About Me</Text>

            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>💬 Language</Text>
              <Text style={styles.aboutValue}>• {languages}</Text>
            </View>

            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>📅 Years of Experience</Text>
              <Text style={styles.aboutValue}>• {experience}</Text>
            </View>

            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>🚗 Drive Access</Text>
              <Text style={styles.aboutValue}>• {vehicle}</Text>
            </View>

            {location && (
              <View style={styles.aboutItem}>
                <Text style={styles.aboutLabel}>📍 Location</Text>
                <Text style={styles.aboutValue}>• {location}</Text>
              </View>
            )}
          </View>

          {/* EXPERIENCE SECTION */}
          <View style={styles.experienceContainer}>
            <Text style={styles.leftSectionTitle}>Experience</Text>
            {experienceItems.map((item, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.experienceDot} />
                <Text style={styles.experienceText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* RIGHT COLUMN - Dark Navy Background */}
        <View style={styles.rightColumn}>
          {/* REMONTA LOGO */}
          <Text style={styles.remontaLogo}>♥ REMONTA</Text>

          {/* NAME & BIO SECTION - Tertiary Background */}
          <View style={styles.workerHeaderTertiary}>
            {/* WORKER NAME & TITLE */}
            <Text style={styles.workerName}>{displayName}</Text>
            <Text style={styles.workerTitle}>Support Worker</Text>

            {/* BIO / INTRODUCTION */}
            <Text style={styles.bioText}>{introduction}</Text>
          </View>

          {/* SERVICES SECTION */}
          <View style={styles.servicesContainer}>
            <Text style={styles.rightSectionTitle}>Services</Text>
            {servicesItems.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <View style={styles.serviceBullet} />
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>

          {/* HOBBIES */}
          {hobbies && (
            <View style={styles.quoteSection}>
              <Text style={styles.quoteTitle}>Hobbies</Text>
              <Text style={styles.quoteText}>"{hobbies}"</Text>
            </View>
          )}

          {/* WHAT MAKES YOUR SERVICES UNIQUE */}
          {uniqueService && (
            <View style={styles.quoteSection}>
              <Text style={styles.quoteTitle}>What makes your services unique?</Text>
              <Text style={styles.quoteText}>"{uniqueService}"</Text>
            </View>
          )}

          {/* WHY DO YOU ENJOY YOUR WORK */}
          <View style={styles.quoteSection}>
            <Text style={styles.quoteTitle}>Why do you enjoy your work?</Text>
            <Text style={styles.quoteText}>"{whyEnjoy}"</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default WorkerProfilePDF;
