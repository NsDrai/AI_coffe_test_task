import type { ReactNode } from "react";

type SectionProps = {
  id: string;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Заголовок h1 нужен только на первом экране. */
  headingLevel?: 1 | 2;
  className?: string;
};

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  headingLevel = 2,
  className,
}: SectionProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-20 ${className ?? ""}`}>
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <header>
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-coffee">{eyebrow}</p>
          ) : null}
          <Heading
            id={`${id}-title`}
            className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight text-ink sm:text-4xl"
          >
            {title}
          </Heading>
          {description ? (
            <div className="mt-3 text-[15px] leading-relaxed text-ink-soft sm:text-base">
              {description}
            </div>
          ) : null}
        </header>
        <div className="mt-8 sm:mt-10">{children}</div>
      </div>
    </section>
  );
}
