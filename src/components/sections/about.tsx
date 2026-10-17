import Image from "next/image";

import { Section } from "@/components/section";
import { SITE } from "@/lib/site";

const FACTS = [
  { value: "5 кг", label: "максимум на одну партию обжарки" },
  { value: "2019", label: "год, с которого обжариваем кофе" },
  { value: "Четверг", label: "день обжарки — раз в неделю" },
  { value: "1–3 дня", label: "от обжарки до вашей чашки" },
];

export function AboutSection() {
  return (
    <Section
      id="about"
      eyebrow={`Мастерская «${SITE.brand}» · ${SITE.city}`}
      headingLevel={1}
      title="Обжариваем кофе в Минске — маленькими партиями, по четвергам"
    >
      <figure>
        <Image
          src="/images/owners.png"
          alt="Аня и Дмитрий — основатели мастерской обжарки кофе «кварта»"
          width={1664}
          height={928}
          className="h-auto w-full rounded-3xl border border-line object-cover"
        />
        <figcaption className="mt-2 text-sm text-ink-soft">
          Аня и Дмитрий — основатели мастерской
        </figcaption>
      </figure>

      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-soft sm:text-base">
        Мы — Аня и Дмитрий. Оба много лет проработали бариста и хорошо знаем, как обидно
        открыть свежую на вид пачку, а внутри — плоский, бумажный вкус. Поэтому в 2019
        году открыли свою маленькую мастерскую и сами встали к ростору.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 md:gap-6">
        <div className="rounded-3xl border border-line bg-card p-5 sm:p-6">
          <h2 className="text-lg font-bold text-ink">
            Свежесть — то, что мы на самом деле продаём
          </h2>
          <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-soft">
            <p>
              Кофе живёт недолго: самые яркие недели — сразу после обжарки, дальше вкус тихо
              уходит. Поэтому мы не обжариваем «на склад».
            </p>
            <p>
              По четвергам обжариваем партии до 5 кг, по пятницам развозим по Минску — и зерно
              оказывается у вас на 1–3 день после обжарки, а не через месяц.
            </p>
            <p className="text-ink">
              Мы не продаём «премиум». Мы продаём свежесть и небольшие партии.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-sand p-5 sm:p-6">
          <h2 className="text-lg font-bold text-ink">Как устроена неделя в мастерской</h2>
          <ul className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-soft">
            <li>
              <span className="font-semibold text-ink">Пн–чт.</span> Собираем заявки и понимаем,
              сколько обжаривать.
            </li>
            <li>
              <span className="font-semibold text-ink">Четверг.</span> День обжарки: ростор
              работает, мастерская пахнет на весь двор.
            </li>
            <li>
              <span className="font-semibold text-ink">Пятница.</span> Фасуем и развозим по Минску
              — либо ждём вас за самовывозом.
            </li>
          </ul>
          <p className="mt-4 text-sm text-ink-soft">
            Аня отвечает за обжарку и дегустацию, Дмитрий — за общение с людьми и доставку.
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {FACTS.map((fact) => (
          <div
            key={fact.value}
            className="rounded-2xl border border-line/80 bg-cream px-4 py-4 text-center sm:text-left"
          >
            <dt className="sr-only">{fact.label}</dt>
            <dd>
              <span className="block text-xl font-extrabold tracking-tight text-coffee sm:text-2xl">
                {fact.value}
              </span>
              <span className="mt-1 block text-xs leading-snug text-ink-soft sm:text-[13px]">
                {fact.label}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
