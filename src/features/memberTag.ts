import { TagTone } from '../ui/Form';

/**
 * The one coloured label on a Discover card ("Hiring baristas",
 * "Open to collabs", "Looking for co-founder"), picked from what the
 * member offers / is looking for.
 */
export function memberTag(m: { offers: string[]; looking_for: string[] }): { label: string; tone: TagTone } | null {
  const hiring = m.offers.find((o) => /^hiring/i.test(o));
  if (hiring) return { label: hiring, tone: 'orange' };
  const open = m.offers.find((o) => /^open to/i.test(o));
  if (open) return { label: open, tone: 'yellow' };
  if (m.looking_for[0]) return { label: `Looking for ${m.looking_for[0].toLowerCase()}`, tone: 'blue' };
  if (m.offers[0]) return { label: m.offers[0], tone: 'teal' };
  return null;
}
