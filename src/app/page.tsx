import { AboutSection } from "@/components/sections/about";
import { CoffeeSection } from "@/components/sections/coffee";
import { OrderSection } from "@/components/sections/order";
import { VisitSection } from "@/components/sections/visit";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE } from "@/lib/site";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  name: `Мастерская обжарки кофе «${SITE.brand}»`,
  description:
    "Небольшая мастерская обжарки кофе в Минске: партии до 5 кг, обжарка по четвергам, доставка по городу в пятницу.",
  address: {
    "@type": "PostalAddress",
    addressLocality: SITE.city,
    addressCountry: "BY",
    streetAddress: "ул. Короля, 9",
  },
  telephone: SITE.phone,
  email: SITE.email,
  priceRange: "18–54 BYN",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday"],
      opens: "10:00",
      closes: "18:00",
    },
  ],
  sameAs: [
    SITE.telegramUrl,
    "https://instagram.com/",
    "https://youtube.com/",
  ],
};

export default function Home() {
  return (
    <>
      <div id="top" />
      <SiteHeader />
      <main className="flex-1">
        <AboutSection />
        <CoffeeSection />
        <VisitSection />
        <OrderSection />
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        // Структурированные данные для поиска: адрес, часы, цена
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
