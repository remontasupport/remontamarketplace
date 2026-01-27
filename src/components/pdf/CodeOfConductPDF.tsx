/**
 * Code of Conduct PDF Template
 * Generates a PDF document with full Code of Conduct content, signature, and date
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CODE_OF_CONDUCT_PART1, CODE_OF_CONDUCT_PART2, CODE_OF_CONDUCT_ACKNOWLEDGMENT } from '@/config/codeOfConductContent';

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },

  // Header
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#0C1628',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#0C1628',
    textAlign: 'center',
    marginBottom: 5,
  },

  // Purpose section
  purposeContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    marginBottom: 15,
    borderRadius: 4,
  },
  purposeTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    marginBottom: 5,
  },
  purposeText: {
    fontSize: 10,
    color: '#444',
    lineHeight: 1.5,
  },

  // Section styles
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0C1628',
    marginBottom: 6,
    backgroundColor: '#e8e8e8',
    padding: 6,
  },
  sectionContent: {
    paddingLeft: 10,
  },
  sectionItem: {
    fontSize: 9,
    color: '#333',
    lineHeight: 1.5,
    marginBottom: 3,
  },
  bullet: {
    marginRight: 5,
  },

  // Acknowledgment section
  acknowledgmentContainer: {
    backgroundColor: '#fff9e6',
    borderWidth: 1,
    borderColor: '#f0c36d',
    padding: 12,
    marginTop: 15,
    marginBottom: 15,
  },
  acknowledgmentTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#8b6914',
    marginBottom: 8,
  },
  acknowledgmentText: {
    fontSize: 10,
    color: '#5c4a0e',
    lineHeight: 1.6,
  },

  // Signature section
  signatureSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 15,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  signatureField: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    marginBottom: 5,
  },
  signatureBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    height: 60,
    backgroundColor: '#fafafa',
  },
  signatureImage: {
    width: '100%',
    height: 60,
    objectFit: 'contain',
  },
  dateBox: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 5,
    marginTop: 10,
  },
  dateText: {
    fontSize: 11,
    color: '#333',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#888',
  },
  pageNumber: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});

// ============================================================================
// TYPES
// ============================================================================

interface CodeOfConductPDFProps {
  workerName: string;
  signatureDataUrl: string;
  signatureDate: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CodeOfConductPDF: React.FC<CodeOfConductPDFProps> = ({
  workerName,
  signatureDataUrl,
  signatureDate,
}) => {
  const allSections = [...CODE_OF_CONDUCT_PART1.sections, ...CODE_OF_CONDUCT_PART2.sections];

  // Split sections for pagination (approximately 4-5 sections per page)
  const sectionsPerPage = 4;
  const pageCount = Math.ceil(allSections.length / sectionsPerPage) + 1; // +1 for signature page

  return (
    <Document>
      {/* Page 1: Purpose + Sections 1-4 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Remonta Code of Conduct</Text>
        </View>

        {/* Purpose Section */}
        <View style={styles.purposeContainer}>
          <Text style={styles.purposeTitle}>Purpose:</Text>
          <Text style={styles.purposeText}>{CODE_OF_CONDUCT_PART1.purpose}</Text>
        </View>

        {/* Sections 1-4 */}
        {allSections.slice(0, 4).map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.content.map((item, itemIndex) => (
                <Text key={itemIndex} style={styles.sectionItem}>
                  • {item}
                </Text>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.pageNumber}>Page 1 of 4</Text>
      </Page>

      {/* Page 2: Sections 5-8 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Remonta Code of Conduct</Text>
        </View>

        {allSections.slice(4, 8).map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.content.map((item, itemIndex) => (
                <Text key={itemIndex} style={styles.sectionItem}>
                  • {item}
                </Text>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.pageNumber}>Page 2 of 4</Text>
      </Page>

      {/* Page 3: Sections 9-12 */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Remonta Code of Conduct</Text>
        </View>

        {allSections.slice(8, 12).map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.content.map((item, itemIndex) => (
                <Text key={itemIndex} style={styles.sectionItem}>
                  • {item}
                </Text>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.pageNumber}>Page 3 of 4</Text>
      </Page>

      {/* Page 4: Acknowledgment + Signature */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Remonta Code of Conduct</Text>
        </View>

        {/* Acknowledgment */}
        <View style={styles.acknowledgmentContainer}>
          <Text style={styles.acknowledgmentTitle}>Acknowledgment</Text>
          <Text style={styles.acknowledgmentText}>{CODE_OF_CONDUCT_ACKNOWLEDGMENT}</Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            {/* Signature */}
            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Signature:</Text>
              <View style={styles.signatureBox}>
                {signatureDataUrl && (
                  <Image src={signatureDataUrl} style={styles.signatureImage} />
                )}
              </View>
            </View>

            {/* Date */}
            <View style={styles.signatureField}>
              <Text style={styles.signatureLabel}>Date:</Text>
              <View style={styles.dateBox}>
                <Text style={styles.dateText}>{signatureDate}</Text>
              </View>
            </View>
          </View>

          {/* Worker Name */}
          <View style={{ marginTop: 15 }}>
            <Text style={styles.signatureLabel}>Full Name:</Text>
            <View style={styles.dateBox}>
              <Text style={styles.dateText}>{workerName}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.pageNumber}>Page 4 of 4</Text>
      </Page>
    </Document>
  );
};

export default CodeOfConductPDF;
