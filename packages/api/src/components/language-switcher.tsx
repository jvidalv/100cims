"use client";

import { Check, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import type { AppLocale } from "@/api/lib/locale";
import { asAppLocale } from "@/api/lib/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LOCALES } from "@/i18n/routing";

type Locale = AppLocale;

interface Strings {
  label: string;
  en: string;
  ca: string;
  es: string;
}

interface Props {
  current: Locale;
  strings: Strings;
}

const FLAG_BG: Record<Locale, string> = {
  // English: UK Union Jack (simplified: cross of St George + St Andrew over blue)
  en: `linear-gradient(0deg, transparent 42%, #fff 42% 58%, transparent 58%),
       linear-gradient(90deg, transparent 42%, #fff 42% 58%, transparent 58%),
       linear-gradient(0deg, transparent 46%, #C8102E 46% 54%, transparent 54%),
       linear-gradient(90deg, transparent 46%, #C8102E 46% 54%, transparent 54%),
       #012169`,
  // Catalan senyera: 9 horizontal red/yellow stripes
  ca: `repeating-linear-gradient(
        180deg,
        #FCDD09 0 11.111%,
        #DA121A 11.111% 22.222%
      )`,
  // Spanish flag: red/yellow/red horizontal bands
  es: `linear-gradient(
        180deg,
        #AA151B 0 25%,
        #F1BF00 25% 75%,
        #AA151B 75% 100%
      )`,
};

const Flag = ({ locale, size = 18 }: { locale: Locale; size?: number }) => (
  <span
    aria-hidden
    className="inline-block rounded-full border border-border/40 shrink-0 shadow-sm"
    style={{
      width: size,
      height: size,
      background: FLAG_BG[locale],
      backgroundSize: "cover",
    }}
  />
);

export const LanguageSwitcher = ({ current, strings }: Props) => {
  const router = useRouter();
  const pathname = usePathname();

  const switchTo = (next: Locale) => {
    if (next === current) return;
    const segments = pathname.split("/").filter(Boolean);
    const first = segments[0] ?? "";
    if (asAppLocale(first) === first) {
      segments[0] = next;
    } else {
      segments.unshift(next);
    }
    const search = typeof window !== "undefined" ? window.location.search : "";
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    router.push(`/${segments.join("/")}${search}${hash}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={strings.label}
        className="inline-flex items-center gap-2 px-3 py-2 rounded border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
      >
        <Flag locale={current} />
        <span>{strings[current]}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {SUPPORTED_LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onSelect={() => switchTo(l)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <Flag locale={l} size={20} />
            <span className="flex-1">{strings[l]}</span>
            {l === current ? (
              <Check className="w-4 h-4 text-primary" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
