import React from 'react';
import { LegalPage } from '../../src/features/LegalPage';

/** 29 · Community Guidelines. */
export default function Guidelines() {
  return (
    <LegalPage
      title="Community Guidelines"
      updated="September 2026"
      sections={[
        {
          title: 'Be real',
          body: 'Use your real name and a real photo of yourself, and describe your business and its address accurately. Every member verifies their phone number, so people know they are talking to a real person.',
        },
        {
          title: 'Be respectful',
          body: 'No harassment, hate speech, threats or discriminatory behaviour of any kind, in profiles, messages or in person.',
        },
        {
          title: 'Keep it professional',
          body: 'Vyaparhood is a business network, not a dating or social app. Keep conversations and connection requests relevant to work.',
        },
        {
          title: 'No spam or solicitation',
          body: "Don't mass-message members with unsolicited offers, MLM pitches or unrelated promotions.",
        },
        {
          title: 'Meet safely',
          body: 'Meet in public places for first meetups, and never share OTPs, passwords or payment details in chat.',
        },
        {
          title: "Report what's wrong",
          body: 'Use Report or Block on any profile or chat that breaks these guidelines — our safety team reviews every report within 24 hours.',
        },
        {
          title: 'Consequences',
          body: 'Violating these guidelines can lead to a warning, temporary restriction or permanent removal from Vyaparhood.',
        },
      ]}
    />
  );
}
