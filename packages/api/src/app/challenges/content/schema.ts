import type { AppLocale } from "@/api/lib/locale";

export type ChallengeLocale = AppLocale;

export interface ChallengeFaqItem {
  q: string;
  a: string;
}

export interface ChallengeContent {
  locale: ChallengeLocale;
  title: string;
  shortName: string;
  description: string;
  heroTagline: string;
  heroImageUrl: string;
  whatIsTitle: string;
  whatIsParagraphs: string[];
  faqs: ChallengeFaqItem[];
}
