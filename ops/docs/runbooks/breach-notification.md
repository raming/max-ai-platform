# Breach Notification Runbook

**Document Owner**: Release Manager  
**Last Updated**: 2025-10-06  
**Revision**: 1.0  
**Related**: [ADR-0008](../adr/adr-0008-security-compliance.md), [Incident Response](./incident-response.md), [Security Baseline](../design/security-compliance.md)

## Executive Summary

This runbook defines breach notification procedures for the MaxAI Platform in compliance with data protection regulations including GDPR, CCPA, HIPAA (where applicable), and PCI DSS. It provides step-by-step guidance for breach assessment, notification timelines, and regulatory compliance requirements.

## Breach Definition and Classification

### Data Breach Definition
A data breach is any confirmed or suspected incident involving:
- Unauthorized access to personal data, PII, PHI, or payment information
- Accidental exposure of sensitive data
- Loss of data or systems containing sensitive information
- Compromise of data integrity or availability affecting user data

### Data Classification for Breach Assessment

#### Regulated Data (Highest Risk)
- **PHI/Health Data**: HIPAA-protected health information
- **PCI Data**: Payment card information, cardholder data
- **Financial Data**: Bank account information, financial records
- **Legal Data**: Attorney-client privileged communications

#### Personal Data (High Risk)  
- **PII**: Names, addresses, SSNs, government IDs
- **Authentication**: Passwords, tokens, biometric data
- **Communications**: Private messages, emails, call records
- **Location Data**: GPS coordinates, tracking information

#### Business Data (Medium Risk)
- **Customer Data**: Account information, preferences, usage data
- **Proprietary Data**: Trade secrets, algorithms, business intelligence
- **Internal Data**: Employee records, operational data

#### Public Data (Low Risk)
- **Marketing Data**: Public profiles, published content
- **System Data**: Non-sensitive logs, performance metrics

## Immediate Response (0-1 Hour)

### Discovery and Initial Assessment (First 30 Minutes)
1. **Stop the Incident**: Contain the breach to prevent further exposure
   - Isolate affected systems
   - Revoke compromised credentials
   - Block suspicious network activity
   - Preserve forensic evidence

2. **Initial Classification**: Determine data types and scope
   - Identify data categories affected
   - Estimate number of records/individuals
   - Assess attack vector and vulnerability
   - Document timeline of events

3. **Immediate Notifications**: Alert key personnel
   - **Incident Commander**: `release_manager.rohan-patel`
   - **Technical Lead**: `architect.morgan-lee`  
   - **Security Officer**: `security@maxai-platform.com`
   - **Legal Counsel**: `legal@maxai-platform.com`

### Rapid Assessment (Minutes 30-60)
1. **Impact Analysis**: Detailed scope assessment
   - Confirm data types and sensitivity levels
   - Identify affected individuals and jurisdictions
   - Assess likelihood of harm to data subjects
   - Determine business and compliance impact

2. **Legal Assessment**: Regulatory obligation evaluation
   - Identify applicable regulations (GDPR, CCPA, HIPAA, PCI)
   - Determine notification requirements and timelines
   - Assess potential fines and legal exposure
   - Engage external counsel if required

## Notification Timeline Matrix

### GDPR - European Union
- **Regulatory Authority**: 72 hours from awareness
- **Data Subjects**: Without undue delay when high risk of harm
- **Requirements**: 
  - Nature of breach and data categories
  - Approximate number of data subjects
  - Contact point for more information
  - Likely consequences and mitigation measures

### CCPA - California
- **Attorney General**: Without unreasonable delay
- **Consumers**: If personal information was compromised
- **Requirements**:
  - Categories of information involved
  - Contact information for questions
  - Actions taken to address breach

### HIPAA - Healthcare (If Applicable)
- **HHS/OCR**: 60 days from discovery
- **Individuals**: 60 days from discovery
- **Media**: Immediately if >500 individuals in a state
- **Requirements**:
  - Description of incident and PHI involved
  - Steps individuals should take
  - Actions being taken to investigate and mitigate

### PCI DSS - Payment Cards
- **Card Brands**: Immediately upon discovery
- **Acquiring Bank**: Immediately
- **PCI Council**: As required by agreements
- **Requirements**:
  - Incident details and cardholder data exposure
  - Forensic investigation plans
  - Remediation timeline and measures

### State Laws - US States
- **Timeline**: Varies by state (typically "without unreasonable delay")
- **Requirements**: Generally similar to CCPA with state-specific variations

## Breach Assessment Workflow

### Step 1: Containment and Preservation (Immediate)
```
Containment Actions:
□ Isolate affected systems and networks
□ Preserve logs and forensic evidence  
□ Revoke compromised credentials
□ Block malicious network traffic
□ Document all containment actions with timestamps

Evidence Preservation:
□ Create forensic images of affected systems
□ Preserve relevant log files and databases
□ Document incident timeline with evidence
□ Secure chain of custody for digital evidence
```

### Step 2: Investigation and Assessment (0-6 Hours)
```
Technical Investigation:
□ Determine root cause and attack vector
□ Identify all systems and data affected
□ Assess data exfiltration or unauthorized access
□ Determine timeline of unauthorized access
□ Collect evidence for forensic analysis

Legal Assessment:
□ Classify data types under applicable regulations
□ Determine jurisdictions of affected individuals
□ Assess likelihood and severity of harm
□ Calculate notification requirements and timelines
□ Engage external counsel if necessary
```

### Step 3: Notification Preparation (6-24 Hours)
```
Regulatory Notifications:
□ Prepare notifications for applicable authorities
□ Include required information per regulation
□ Coordinate with legal counsel on content
□ Submit within required timeframes

Individual Notifications:
□ Identify affected individuals and contact information
□ Prepare notification letters/emails per regulation
□ Include required elements and mitigation advice
□ Plan delivery method and timing
```

## Notification Templates

### Individual Notification Template
```
Subject: Important Security Notice - MaxAI Platform Data Incident

Dear [Customer Name],

We are writing to inform you of a data security incident that may have affected your personal information stored with MaxAI Platform.

WHAT HAPPENED:
On [Date], we discovered [description of incident]. We immediately took steps to secure the affected systems and launched an investigation.

INFORMATION INVOLVED:
The information that may have been affected includes: [specific data types]

WHAT WE ARE DOING:
- We immediately secured the affected systems
- We launched a comprehensive investigation with external cybersecurity experts
- We notified law enforcement and relevant regulatory authorities
- We are implementing additional security measures to prevent similar incidents

WHAT YOU CAN DO:
- Monitor your accounts for unusual activity
- [Specific recommendations based on data type]
- Consider placing fraud alerts with credit bureaus if applicable

MORE INFORMATION:
For questions about this incident, please contact us at:
- Email: security@maxai-platform.com
- Phone: [Phone Number]
- Website: [Incident Information Page]

We sincerely apologize for this incident and any inconvenience it may cause.

Sincerely,
MaxAI Platform Security Team
```

### Regulatory Notification Template
```
GDPR Supervisory Authority Notification

Article 33 GDPR Notification

1. NATURE OF BREACH:
   - Date/Time of breach: [Date/Time]
   - Discovery date: [Date/Time]  
   - Breach category: [Confidentiality/Integrity/Availability]
   - Source of breach: [Internal/External/Unknown]

2. DATA CATEGORIES AFFECTED:
   - Type of personal data: [Categories]
   - Number of data subjects: [Number/Range]
   - Number of records: [Number/Range]

3. CONTACT POINT:
   - Data Protection Officer: [Contact Information]
   - Organization contact: [Contact Information]

4. CONSEQUENCES:
   - Likely consequences: [Assessment]
   - Risk to data subjects: [Low/Medium/High]

5. MITIGATION MEASURES:
   - Immediate actions taken: [Actions]
   - Planned remediation: [Plans]
   - Individual notifications: [Plans/Completed]
```

## External Communications

### Law Enforcement Coordination
- **When to Report**: Any criminal activity suspected
- **Contacts**: FBI Internet Crime Complaint Center, Local law enforcement
- **Information**: Provide incident details while preserving investigation

### Customer Communication Strategy
- **Public Statement**: Prepared statement for media inquiries
- **Customer Support**: Train support team on incident details and FAQ
- **Stakeholder Updates**: Keep partners and vendors informed of relevant impacts

### Media Relations
- **Spokesperson**: Designated company spokesperson only
- **Message**: Consistent messaging focused on response actions
- **Transparency**: Balance transparency with investigation integrity

## Post-Breach Activities

### Investigation and Remediation (1-30 Days)
```
Forensic Investigation:
□ Engage third-party forensic investigators
□ Complete root cause analysis
□ Document all findings and evidence
□ Prepare forensic report for regulators/legal

System Remediation:
□ Patch vulnerabilities that caused breach
□ Implement additional security controls
□ Update incident response procedures
□ Conduct security assessment of all systems

Compliance Activities:
□ Respond to regulatory inquiries
□ Cooperate with investigations
□ Update privacy policies and notices
□ Document compliance with notification requirements
```

### Long-term Follow-up (30+ Days)
```
Monitoring and Support:
□ Provide ongoing support to affected individuals
□ Monitor for signs of misuse of compromised data
□ Maintain incident documentation for required retention period
□ Update breach response procedures based on lessons learned

Legal and Compliance:
□ Respond to any regulatory enforcement actions
□ Handle any legal claims or litigation
□ Update contracts and vendor agreements
□ Implement recommended security improvements
```

## Documentation Requirements

### Incident Documentation
- **Incident Log**: Chronological record of all actions
- **Evidence Chain**: Custody documentation for all evidence
- **Communication Log**: Record of all notifications sent
- **Decision Log**: Documentation of key decisions and rationale

### Compliance Documentation
- **Notification Records**: Proof of regulatory notifications
- **Individual Notices**: Records of individual notifications sent
- **Response Actions**: Documentation of all remediation measures
- **Follow-up Actions**: Long-term monitoring and support activities

## Training and Preparedness

### Team Training Requirements
- **Annual**: Data breach response training for all relevant personnel
- **Role-Specific**: Specialized training for incident response team members
- **Legal Updates**: Regular updates on changing regulatory requirements
- **Tabletop Exercises**: Simulated breach scenarios with full response

### Documentation Maintenance  
- **Quarterly Review**: Update procedures based on regulatory changes
- **Post-Incident**: Update procedures based on actual incident lessons
- **Legal Review**: Annual review by legal counsel for compliance
- **Stakeholder Training**: Ensure all team members understand current procedures

## Quick Reference - Critical Timelines

### Immediate (0-1 Hour)
- Contain incident and preserve evidence
- Notify key personnel and legal counsel
- Begin impact assessment

### 24 Hours
- Complete initial assessment and classification
- Engage external forensic investigators if needed
- Prepare regulatory notifications

### 72 Hours (GDPR)
- Submit notification to GDPR supervisory authority
- Complete detailed impact assessment
- Begin individual notifications if high risk

### 60 Days (HIPAA)
- Notify HHS/OCR of PHI breach
- Complete individual notifications
- Submit summary to HHS if <500 individuals

---

**Emergency Contact**: security@maxai-platform.com  
**Legal Counsel**: legal@maxai-platform.com  
**Incident Commander**: release_manager.rohan-patel

*This runbook must be reviewed and updated regularly to maintain compliance with evolving data protection regulations.*