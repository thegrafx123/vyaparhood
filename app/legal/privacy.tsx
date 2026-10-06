import React from 'react';
import { DELETE_AFTER_DAYS, PRIVACY_EMAIL } from '../../src/config';
import { LegalPage } from '../../src/features/LegalPage';

/** 31 · Privacy Policy. Written to match exactly what the app stores. */
export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="September 2026"
      sections={[
        {
          title: 'What we collect',
          body: "Your mobile number, name, email, date of birth, city, business details and business address, one profile photo, and — only if you allow it — your phone's location while you use the app. We don't collect ID documents.",
        },
        {
          title: 'How we use your location',
          body: 'Your business address is how members nearby find your business. Your live location is used only as the starting point of your own Nearby search. Other members only ever see your area and an approximate distance — never your address, your live location or coordinates.',
        },
        {
          title: 'How we use the rest',
          body: 'To verify your phone number, show you relevant members, and keep the community safe from fake accounts and abuse.',
        },
        {
          title: 'What we share',
          body: 'Other members can see your name, photo, what you are building, your area and city. Your Instagram / LinkedIn handle is shared only with members you connect with. Your phone number, email, date of birth, address and location are never shown to other members. We never sell your data.',
        },
        {
          title: 'Your photo',
          body: 'We keep a single profile photo, stored privately and shown only to signed-in members. Uploading a new one replaces the old one.',
        },
        {
          title: 'Your choices',
          body: `You can edit your profile anytime. Deleting your account from Settings hides it immediately and permanently erases your data after ${DELETE_AFTER_DAYS} days — log back in before then to restore it.`,
        },
        {
          title: 'Contact us',
          body: `Questions about your data? Reach us at ${PRIVACY_EMAIL}`,
        },
      ]}
    />
  );
}
