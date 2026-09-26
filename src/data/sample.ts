import { CategoryId } from '../config';

export type TagTone = 'orange' | 'yellow' | 'blue' | 'teal';

export interface Member {
  id: string;
  name: string;
  role: string;
  category: CategoryId;
  area: string;
  city: string;
  /** Distance from the current user, computed by the backend later. */
  distanceKm: number;
  /** Member's own "Show my exact distance" setting. */
  sharesExactDistance: boolean;
  verified: boolean;
  tag?: { label: string; tone: TagTone };
  connections: number;
  memberSince: string;
  rating: number | null;
  about: string;
  offers: string[];
  lookingFor: string[];
  joinedOrder: number;
  /** Fixed radar angles so the prototype matches the design; others are hashed. */
  radarAngleDeg?: number;
}

export const MEMBERS: Member[] = [
  {
    id: 'riya',
    name: 'Riya Kapoor',
    role: 'Founder, Cafe Loom',
    category: 'food',
    area: 'Bandra West',
    city: 'Mumbai',
    distanceKm: 0.8,
    sharesExactDistance: true,
    verified: true,
    tag: { label: 'Hiring baristas', tone: 'orange' },
    connections: 42,
    memberSince: "Jan '24",
    rating: 4.9,
    about: 'Building third-wave coffee spaces for remote workers across Mumbai.',
    offers: ['Hiring baristas'],
    lookingFor: ['Co-founder'],
    joinedOrder: 3,
    radarAngleDeg: -128,
  },
  {
    id: 'arjun',
    name: 'Arjun Mehta',
    role: 'Strength & Conditioning Coach',
    category: 'fitness',
    area: 'Powai',
    city: 'Mumbai',
    distanceKm: 2.1,
    sharesExactDistance: true,
    verified: true,
    tag: { label: 'Open to collabs', tone: 'yellow' },
    connections: 67,
    memberSince: "Nov '23",
    rating: 4.8,
    about: 'Runs small-group strength sessions for startup teams and busy founders.',
    offers: ['Team fitness sessions', 'Corporate wellness'],
    lookingFor: ['Studio space', 'Collabs'],
    joinedOrder: 1,
    radarAngleDeg: -43,
  },
  {
    id: 'sana',
    name: 'Sana Iyer',
    role: 'Brand & Interior Designer',
    category: 'creative',
    area: 'Bandra West',
    city: 'Mumbai',
    distanceKm: 1.4,
    sharesExactDistance: true,
    verified: true,
    tag: { label: 'Looking for co-founder', tone: 'blue' },
    connections: 128,
    memberSince: "Mar '24",
    rating: 4.9,
    about:
      'Designs cafes and boutique retail spaces across Mumbai. Previously led interiors at a hospitality studio — now building my own practice one project at a time.',
    offers: ['Interior design', 'Space planning'],
    lookingFor: ['Co-founder', 'Contractor referrals'],
    joinedOrder: 4,
    radarAngleDeg: 54,
  },
  {
    id: 'dev',
    name: 'Dev Malhotra',
    role: 'Product Photographer',
    category: 'creative',
    area: 'Khar West',
    city: 'Mumbai',
    distanceKm: 1.2,
    sharesExactDistance: false,
    verified: true,
    tag: { label: 'Open to collabs', tone: 'yellow' },
    connections: 23,
    memberSince: "Jun '24",
    rating: 4.7,
    about: 'Shoots menus, products and spaces for small brands. Studio in Khar.',
    offers: ['Product shoots', 'Menu photography'],
    lookingFor: ['Brand collabs'],
    joinedOrder: 6,
    radarAngleDeg: 138,
  },
  {
    id: 'meera',
    name: 'Meera Joshi',
    role: 'Graphic Designer',
    category: 'creative',
    area: 'Andheri West',
    city: 'Mumbai',
    distanceKm: 6.2,
    sharesExactDistance: true,
    verified: true,
    tag: { label: 'Taking new clients', tone: 'teal' },
    connections: 54,
    memberSince: "Feb '24",
    rating: 4.8,
    about: 'Brand identities and packaging for food and D2C brands.',
    offers: ['Branding', 'Packaging design'],
    lookingFor: ['Printing partners'],
    joinedOrder: 5,
  },
  {
    id: 'ishaan',
    name: 'Ishaan Rao',
    role: 'Founder, Loop Retail',
    category: 'retail',
    area: 'Lower Parel',
    city: 'Mumbai',
    distanceKm: 8.3,
    sharesExactDistance: false,
    verified: false,
    tag: { label: 'Looking for suppliers', tone: 'blue' },
    connections: 12,
    memberSince: "Aug '24",
    rating: null,
    about: 'Opening a sustainable homeware store. Sourcing from local makers.',
    offers: ['Retail space for pop-ups'],
    lookingFor: ['Suppliers', 'Visual merchandiser'],
    joinedOrder: 8,
  },
  {
    id: 'pooja',
    name: 'Pooja Nair',
    role: 'Yoga Studio Owner',
    category: 'fitness',
    area: 'Chembur',
    city: 'Mumbai',
    distanceKm: 9.1,
    sharesExactDistance: true,
    verified: true,
    tag: { label: 'Open to collabs', tone: 'yellow' },
    connections: 31,
    memberSince: "Apr '24",
    rating: 4.9,
    about: 'Two studios in Chembur. Runs workshops for corporate teams.',
    offers: ['Corporate yoga'],
    lookingFor: ['Cafe partners'],
    joinedOrder: 2,
  },
  {
    id: 'rohan',
    name: 'Rohan Desai',
    role: 'Cafe Owner',
    category: 'food',
    area: 'Colaba',
    city: 'Mumbai',
    distanceKm: 12.4,
    sharesExactDistance: true,
    verified: true,
    tag: { label: 'Hiring chefs', tone: 'orange' },
    connections: 88,
    memberSince: "Dec '23",
    rating: 4.6,
    about: 'All-day cafe in Colaba. Planning a second outlet next year.',
    offers: ['Event space'],
    lookingFor: ['Head chef'],
    joinedOrder: 7,
  },
  {
    id: 'karan',
    name: 'Karan Shah',
    role: 'Co-working space founder',
    category: 'tech',
    area: 'Bandra East',
    city: 'Mumbai',
    distanceKm: 2.6,
    sharesExactDistance: true,
    verified: true,
    connections: 73,
    memberSince: "Oct '23",
    rating: 4.7,
    about: 'Runs a 120-seat co-working space in Bandra East.',
    offers: ['Desk space', 'Meeting rooms'],
    lookingFor: ['Vendors', 'Community partners'],
    joinedOrder: 9,
  },
  {
    id: 'neha',
    name: 'Neha Verma',
    role: 'Marketing consultant',
    category: 'creative',
    area: 'Santacruz',
    city: 'Mumbai',
    distanceKm: 3.4,
    sharesExactDistance: true,
    verified: true,
    connections: 96,
    memberSince: "Jan '24",
    rating: 4.8,
    about: 'Launch and growth marketing for new local businesses.',
    offers: ['Launch plans', 'Social media'],
    lookingFor: ['New clients'],
    joinedOrder: 10,
  },
];

/** Members who only exist in your Requests/Chats, not in Discover. */
export const HIDDEN_FROM_DISCOVER = ['karan', 'neha'];

export interface ConnectionRequest {
  id: string;
  memberId: string;
  note: string;
  direction: 'incoming' | 'outgoing';
  createdAt: string;
}

export const REQUESTS: ConnectionRequest[] = [
  {
    id: 'req-karan',
    memberId: 'karan',
    note: "Hey! Saw you're building in Bandra too — would love to swap notes on vendors.",
    direction: 'incoming',
    createdAt: '12 min ago',
  },
  {
    id: 'req-neha',
    memberId: 'neha',
    note: 'Would love to help with your launch marketing — happy to share a quick plan.',
    direction: 'incoming',
    createdAt: '1 hr ago',
  },
];

export interface Message {
  id: string;
  from: 'me' | 'them' | 'system';
  text: string;
  time?: string;
}

export interface Chat {
  id: string;
  memberId: string;
  online: boolean;
  unread: boolean;
  lastTime: string;
  messages: Message[];
}

export const CHATS: Chat[] = [
  {
    id: 'chat-neha',
    memberId: 'neha',
    online: true,
    unread: true,
    lastTime: '10:24 AM',
    messages: [
      { id: 'm1', from: 'system', text: 'Connection approved · You can chat now' },
      {
        id: 'm2',
        from: 'them',
        text: 'Would love to help with your launch marketing — happy to share a quick plan.',
      },
      { id: 'm3', from: 'me', text: "That would be amazing, thank you! Let's connect this week." },
      {
        id: 'm4',
        from: 'them',
        text: "Hi! That sounds exciting, let's set up a call this week.",
        time: '10:24 AM',
      },
    ],
  },
  {
    id: 'chat-riya',
    memberId: 'riya',
    online: false,
    unread: false,
    lastTime: 'Yesterday',
    messages: [
      { id: 'm1', from: 'system', text: 'Connection approved · You can chat now' },
      { id: 'm2', from: 'them', text: 'Come by the cafe on Friday around 4? We can talk branding.' },
      { id: 'm3', from: 'me', text: 'Sounds good, see you at the cafe!', time: 'Yesterday' },
    ],
  },
  {
    id: 'chat-arjun',
    memberId: 'arjun',
    online: false,
    unread: false,
    lastTime: 'Mon',
    messages: [
      { id: 'm1', from: 'system', text: 'Connection approved · You can chat now' },
      { id: 'm2', from: 'me', text: 'Would your sessions work for a team of eight?' },
      { id: 'm3', from: 'them', text: "Let's do a free trial session for your team", time: 'Mon' },
    ],
  },
];

export type NotificationKind = 'request' | 'approved' | 'badge' | 'message';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  memberId?: string;
  chatId?: string;
  text: string;
  bold: string;
  boldFirst: boolean;
  time: string;
  section: 'today' | 'earlier';
  unread: boolean;
}

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    kind: 'request',
    memberId: 'karan',
    bold: 'Karan Shah',
    text: ' sent you a connect request',
    boldFirst: true,
    time: '12 min ago',
    section: 'today',
    unread: true,
  },
  {
    id: 'n2',
    kind: 'approved',
    memberId: 'neha',
    chatId: 'chat-neha',
    bold: 'Neha Verma',
    text: ' approved your request',
    boldFirst: true,
    time: '1 hr ago',
    section: 'today',
    unread: false,
  },
  {
    id: 'n3',
    kind: 'badge',
    bold: 'verified badge',
    text: 'Your profile got a ',
    boldFirst: false,
    time: '2 days ago',
    section: 'earlier',
    unread: false,
  },
  {
    id: 'n4',
    kind: 'message',
    memberId: 'arjun',
    chatId: 'chat-arjun',
    bold: 'Arjun Mehta',
    text: ' sent you a message',
    boldFirst: true,
    time: '4 days ago',
    section: 'earlier',
    unread: false,
  },
];

export const SAVED_IDS = ['riya', 'arjun', 'sana'];

/** Used only if someone opens the main app without finishing sign-up (dev). */
export const FALLBACK_ME = {
  name: 'Riya Kapoor',
  building: 'Third-wave coffee shop in Bandra',
  role: 'Founder, Cafe Loom',
  category: 'food' as CategoryId,
  bio: 'Building third-wave coffee spaces for remote workers across Mumbai.',
  offers: ['Hiring baristas'],
  lookingFor: ['Co-founder'],
};
