import { Section } from "@/components/section";
import { COFFEE_MENU } from "@/lib/menu";

export function CoffeeSection() {
  return (
    <Section
      id="coffee"
      eyebrow="Кофе"
      title="Что есть сейчас"
      description="Все позиции — в зерне или в помоле, пачки по 250 г. Ассортимент немного меняется от партии к партии: если чего-то нет, подскажем, что взять вместо."
      className="bg-sand"
    >
      <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {COFFEE_MENU.map((item) => (
          <li
            key={item.id}
            className="flex h-full flex-col rounded-3xl border border-line bg-card p-5 transition-colors hover:border-latte"
          >
            {item.badge ? (
              <span className="mb-3 inline-block w-fit rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                {item.badge}
              </span>
            ) : null}

            <h3 className="text-lg font-bold text-ink">{item.name}</h3>

            {item.description ? (
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">
                {item.description}
              </p>
            ) : null}

            <div className="mt-auto flex items-end justify-between gap-3 pt-5">
              <span className="text-sm text-ink-soft">{item.meta}</span>
              <span className="text-lg font-extrabold tracking-tight text-coffee">
                {item.price}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-line bg-sand px-4 py-4 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <p>
          Нужен конкретный помол — под воронку, аэропресс или эспрессо-машину — напишите это в
          заявке.
        </p>
        <a
          href="#order"
          className="font-semibold text-coffee underline decoration-latte decoration-2 underline-offset-4 transition-colors hover:text-coffee-dark"
        >
          Оставить заявку
        </a>
      </div>
    </Section>
  );
}
