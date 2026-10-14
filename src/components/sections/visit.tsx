import { ClockIcon, PinIcon, TruckIcon } from "@/components/icons";
import { Section } from "@/components/section";
import { SITE } from "@/lib/site";

const STEPS = [
  {
    title: "Пишете заявку",
    text: "Можно в любой день. Уточним, что вы пьёте, и предложим подходящий сорт.",
  },
  {
    title: "Обжариваем в четверг",
    text: "Свежая партия ровно под заказы, не «на склад».",
  },
  {
    title: "Забираете сами или ждёте пятницу",
    text: `Самовывоз — ${SITE.address}. Доставка по Минску в пятницу, от 50 BYN — бесплатно.`,
  },
];

export function VisitSection() {
  return (
    <Section
      id="visit"
      eyebrow="Мастерская"
      title="Где нас найти и как получить кофе"
      description="Мастерская небольшая, без витрины и кассы — сюда приезжают за уже собранным заказом. Если сомневаетесь, что выбрать, позвоните, подскажем."
    >
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <div className="rounded-3xl border border-line bg-card p-5 sm:p-6">
          <ul className="space-y-4">
            <li className="flex gap-3">
              <PinIcon className="h-5 w-5 shrink-0 text-coffee" />
              <div>
                <p className="font-semibold text-ink">{SITE.address}</p>
                <p className="text-sm text-ink-soft">
                  {SITE.addressNote} — приходите, когда заказ готов, мы напишем
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <ClockIcon className="h-5 w-5 shrink-0 text-coffee" />
              <div>
                <p className="font-semibold text-ink">Часы работы</p>
                <p className="text-sm text-ink-soft">
                  {SITE.hours.map((item) => (
                    <span key={item.days} className="block">
                      {item.days} {item.time}
                    </span>
                  ))}
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <TruckIcon className="h-5 w-5 shrink-0 text-coffee" />
              <div>
                <p className="font-semibold text-ink">Доставка</p>
                <p className="text-sm text-ink-soft">{SITE.deliveryNote}</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-line bg-sand p-5 sm:p-6">
          <h3 className="text-base font-bold text-ink">Как это работает</h3>
          <ol className="mt-4 space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coffee text-xs font-bold text-cream"
                >
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-ink">{step.title}</p>
                  <p className="text-sm leading-relaxed text-ink-soft">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}
