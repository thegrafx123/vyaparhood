import React from 'react';
import { LegalPage } from '../../src/components/LegalPage';

/** 32 · Terms of Service. */
export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="September 2026"
      sections={[
        {
          title: 'Who can use Vyaparhood',
          body: 'You must be 18 or older and a genuine business owner, freelancer or founder to create an account.',
        },
        {
          title: 'Your account',
          body: "You're responsible for the accuracy of your profile and for keeping your login secure. One account per person.",
        },
        {
          title: 'Membership & billing',
          body: 'Trial pricing auto-renews into a monthly plan unless cancelled. You can cancel anytime from Settings — no lock-in.',
        },
        {
          title: 'Acceptable use',
          body: 'No scraping profiles, impersonating others, spamming members or using Vyaparhood for anything illegal.',
        },
        {
          title: 'Suspension & termination',
          body: 'We may suspend or remove accounts that violate these Terms or the Community Guidelines, with or without notice.',
        },
      ]}
    />
  );
}
