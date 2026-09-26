import React from 'react';
import { LegalPage } from '../../src/components/LegalPage';

/** 31 · Community Guidelines. */
export default function Guidelines() {
  return (
    <LegalPage
      title="Community Guidelines"
      updated="September 2026"
      sections={[
        {
          title: 'Be real',
          body: "Use your real name and photo, and represent your business accurately. Verification exists so members can trust who they're talking to.",
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
