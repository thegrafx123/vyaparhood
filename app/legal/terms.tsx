import React from 'react';
import { DELETE_AFTER_DAYS } from '../../src/config';
import { LegalPage } from '../../src/features/LegalPage';

/** 30 · Terms of Service. */
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
          body: "You sign in with your mobile number and a one-time code. You're responsible for the accuracy of your profile — including your business address — and for keeping access to your phone number secure. One account per person.",
        },
        {
          title: 'Membership & billing',
          body: "Vyaparhood is free while it's in beta. When paid plans start — ₹99 for one week or ₹299 per month — we'll show you the price and ask you to confirm before anything is charged. You can cancel anytime from Settings — no lock-in.",
        },
        {
          title: 'Acceptable use',
          body: 'No scraping profiles, impersonating others, spamming members or using Vyaparhood for anything illegal.',
        },
        {
          title: 'Deleting your account',
          body: `You can delete your account anytime from Settings. It is hidden from other members immediately and permanently deleted after ${DELETE_AFTER_DAYS} days. Logging back in before then restores it.`,
        },
        {
          title: 'Suspension & termination',
          body: 'We may suspend or remove accounts that violate these Terms or the Community Guidelines, with or without notice.',
        },
      ]}
    />
  );
}
