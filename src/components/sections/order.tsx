import { LeadForm } from "@/components/lead-form";
import { Section } from "@/components/section";
import { PhoneIcon, TelegramIcon } from "@/components/icons";
import { SITE } from "@/lib/site";

const NEXT_STEPS = [
  "Перезвоним в рабочее время и уточним детали.",
  "Обжарим вашу партию в ближайший четверг.",
  "В пятницу развезём по Минску или скажем, когда забрать.",
];

export function OrderSection() {
  return (
    <Section
      id="order"
      eyebrow="Заявка"
      title="Оставить заявку"
      description="Напишите, что интересно: перезвоним в рабочее время, поможем выбрать сорт и помол. Мы не звоним «просто так» и не рассылаем рассылки."
      className="bg-cream-deep"
    >
      <div className="grid gap-4 md:grid-cols-[1.5fr_1fr] md:gap-6">
        <div className="rounded-3xl border border-line bg-sand p-5 sm:p-6">
          <LeadForm />
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-line bg-card p-5">
            <h3 className="text-base font-bold text-ink">Не любите формы?</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Позвоните или напишите в Telegram — ответим сами.
            </p>
            <div className="mt-4 space-y-2">
              <a
                href={SITE.phoneLink}
                className="flex items-center gap-3 rounded-2xl border border-line bg-cream px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-coffee hover:text-coffee"
              >
                <PhoneIcon className="h-5 w-5 shrink-0 text-coffee" />
                {SITE.phoneLabel}
              </a>
              <a
                href={SITE.telegramUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-3 rounded-2xl border border-line bg-cream px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-coffee hover:text-coffee"
              >
                <TelegramIcon className="h-5 w-5 shrink-0 text-coffee" />
                {SITE.telegramHandle}
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-card p-5">
            <h3 className="text-base font-bold text-ink">Что будет дальше</h3>
            <ol className="mt-3 space-y-3">
              {NEXT_STEPS.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-latte text-[11px] font-bold text-ink"
                  >
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </Section>
  );
}
