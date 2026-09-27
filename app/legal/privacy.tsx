import React from 'react';
import { LegalPage } from '../../src/components/LegalPage';
import { DOCUMENT_RETENTION_DAYS } from '../../src/config';

/** 33 · Privacy Policy. Location and document lines added to match how the app works. */
export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="September 2026"
      sections={[
        {
          title: 'What we collect',
          body: 'Your name, phone number, email, date of birth, city, business details, verification documents, any photos you upload, and your location while you use the app (or the address you enter if location is off).',
        },
        {
          title: 'How we use it',
          body: 'To verify your identity, match you with relevant members nearby, and keep the community safe from fake accounts and abuse.',
        },
        {
          title: 'What we share',
          body: 'Your profile is visible to other verified members in your city. Other members only see how far away you are — never your location, exact address, ID documents or DOB. We never sell your data.',
        },
        {
          title: 'Verification documents',
          body: `Business proof and ID documents are used only for manual verification, stored encrypted, and permanently deleted within ${DOCUMENT_RETENTION_DAYS} days of submission. For Aadhaar we accept the masked version only.`,
        },
        {
          title: 'Your choices',
          body: 'You can edit, download or delete your profile anytime from Settings. Deleting your account removes your data within 30 days.',
        },
        {
          title: 'Contact us',
          body: 'Questions about your data? Reach us at privacy@vyaparhood.com',
        },
      ]}
    />
  );
}
