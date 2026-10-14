import { formatPhone } from "./phone";

/**
 * Всё, что мастерская захочет поменять в тексте о себе, собрано здесь.
 * Телефон указывайте в любом виде — на странице он отформатируется сам.
 */
const rawPhone = "+375291234567";

export const SITE = {
  brand: "кварта",
  tagline: "маленькая мастерская обжарки кофе",
  city: "Минск",
  foundedYear: 2019,
  phone: rawPhone,
  phoneLabel: formatPhone(rawPhone),
  phoneLink: `tel:${rawPhone}`,
  email: "hello@kvarta.by",
  telegramHandle: "@kvarta_coffee",
  telegramUrl: "https://t.me/kvarta_coffee",
  address: "Минск, ул. Короля, 9",
  addressNote: "самовывоз",
  hours: [
    { days: "пн–пт", time: "8:00–20:00" },
    { days: "сб–вс", time: "10:00–18:00" },
  ],
  deliveryNote: "Доставка по Минску в пятницу, от 50 BYN — бесплатно",
  roastDay: "по четвергам",
  deliveryDay: "по пятницам",
} as const;

export const NAV_LINKS = [
  { href: "#about", label: "О мастерской" },
  { href: "#coffee", label: "Кофе" },
  { href: "#visit", label: "Адрес" },
  { href: "#order", label: "Заявка" },
] as const;

/** Ссылки-заглушки: подставьте свои профили. */
export const SOCIAL_LINKS = [
  { id: "telegram", label: "Telegram", href: "https://t.me/kvarta_coffee" },
  { id: "instagram", label: "Instagram", href: "https://instagram.com/" },
  { id: "youtube", label: "YouTube", href: "https://youtube.com/" },
] as const;

export type SocialId = (typeof SOCIAL_LINKS)[number]["id"];

/** Считается один раз при сборке/старте — не делает страницу динамической. */
export const CURRENT_YEAR = new Date().getFullYear();
