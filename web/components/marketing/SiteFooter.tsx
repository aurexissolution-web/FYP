import Link from "next/link";
import Image from "next/image";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import { Container } from "./Container";

export function SiteFooter({
  lang,
  nav,
  footer,
}: {
  lang: Locale;
  nav: Dictionary["nav"];
  footer: Dictionary["footer"];
}) {
  return (
    <footer className="border-t border-outline/60 bg-cream-alt">
      <Container className="py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-3 pr-8">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-icon.png"
                alt=""
                width={30}
                height={30}
                className="rounded-[8px]"
              />
              <span className="text-base font-extrabold text-ink">
                EmoBuddy
              </span>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed max-w-xs">
              {footer.tagline}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">
              {footer.product}
            </span>
            <Link href={`/${lang}/features`} className="text-sm text-ink-soft hover:text-ink w-fit">
              {nav.features}
            </Link>
            <Link href={`/${lang}/how-it-works`} className="text-sm text-ink-soft hover:text-ink w-fit">
              {nav.howItWorks}
            </Link>
            <Link href={`/${lang}/research`} className="text-sm text-ink-soft hover:text-ink w-fit">
              {nav.research}
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">
              {footer.company}
            </span>
            <Link href={`/${lang}/about`} className="text-sm text-ink-soft hover:text-ink w-fit">
              {nav.about}
            </Link>
            <Link href={`/${lang}/privacy`} className="text-sm text-ink-soft hover:text-ink w-fit">
              {footer.privacy}
            </Link>
            <Link href={`/${lang}/help`} className="text-sm text-ink-soft hover:text-ink w-fit">
              {footer.getHelp}
            </Link>
            <Link href={`/${lang}/contact`} className="text-sm text-ink-soft hover:text-ink w-fit">
              {footer.contact}
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-outline/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-faint max-w-2xl leading-relaxed">
            {footer.disclaimer}
          </p>
          <p className="text-xs text-ink-faint whitespace-nowrap">
            {footer.rights}
          </p>
        </div>
      </Container>
    </footer>
  );
}
