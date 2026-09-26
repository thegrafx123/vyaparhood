import { PlanOffer } from "./types";

/** Single source of truth for the prices shown on the paywall. */
export const DEFAULT_OFFER: PlanOffer = {
  id: "vyaparhood_monthly",
  currency: "INR",
  introPrice: 99,
  introPeriod: "week",
  price: 500,
  period: "month",
  introNote: "while we're in beta",
};

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
