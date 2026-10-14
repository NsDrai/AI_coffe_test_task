import {
  BeanMark,
  ClockIcon,
  InstagramIcon,
  PhoneIcon,
  PinIcon,
  TelegramIcon,
  TruckIcon,
  YoutubeIcon,
} from "@/components/icons";
import { SOCIAL_LINKS, SITE, CURRENT_YEAR, type SocialId } from "@/lib/site";

const SOCIAL_ICONS: Record<SocialId, (props: { className?: string }) => React.ReactElement> = {
  telegram: TelegramIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
};

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-cream-deep">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 sm:py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <BeanMark className="h-10 w-10 text-coffee" />
            <span className="flex flex-col leading-none">
              <span className="text-lg font-extrabold tracking-tight text-ink">{SITE.brand}</span>
              <span className="mt-0.5 text-[11px] text-ink-soft">
                {SITE.tagline} · с {SITE.foundedYear} года
              </span>
            </span>
          </div>

          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
            Обжариваем партиями по 5 кг {SITE.roastDay} и развозим {SITE.deliveryDay}.
          </p>

          <ul className="mt-5 flex items-center gap-2">
            {SOCIAL_LINKS.map((social) => {
              const Icon = SOCIAL_ICONS[social.id];
              return (
                <li key={social.id}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    title={social.label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-cream text-ink-soft transition-colors hover:border-coffee hover:text-coffee"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">Контакты</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a
                href={SITE.phoneLink}
                className="flex items-center gap-3 text-ink transition-colors hover:text-coffee"
              >
                <PhoneIcon className="h-5 w-5 shrink-0 text-coffee" />
                {SITE.phoneLabel}
              </a>
            </li>
            <li>
              <a
                href={SITE.telegramUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-3 text-ink transition-colors hover:text-coffee"
              >
                <TelegramIcon className="h-5 w-5 shrink-0 text-coffee" />
                {SITE.telegramHandle}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-3 break-all text-ink transition-colors hover:text-coffee"
              >
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-coffee">
                  @
                </span>
                {SITE.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">Мастерская</h2>
          <ul className="mt-4 space-y-3 text-sm text-ink">
            <li className="flex gap-3">
              <PinIcon className="h-5 w-5 shrink-0 text-coffee" />
              <span>
                {SITE.address}
                <span className="block text-ink-soft">{SITE.addressNote}</span>
              </span>
            </li>
            <li className="flex gap-3">
              <ClockIcon className="h-5 w-5 shrink-0 text-coffee" />
              <span>
                {SITE.hours.map((item) => (
                  <span key={item.days} className="block">
                    {item.days} {item.time}
                  </span>
                ))}
              </span>
            </li>
            <li className="flex gap-3">
              <TruckIcon className="h-5 w-5 shrink-0 text-coffee" />
              <span>{SITE.deliveryNote}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-5 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {CURRENT_YEAR} {SITE.brand} — обжарка кофе, {SITE.city}
          </p>
          <p>Самовывоз из мастерской и доставка по Минску</p>
        </div>
      </div>
    </footer>
  );
}
