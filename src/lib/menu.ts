export type CoffeeItem = {
  /** Стабильный ключ позиции — используется в аналитике и в базе. */
  id: string;
  name: string;
  /** Дегустационные ноты или состав. Может быть пустым. */
  description?: string;
  /** Вес / количество / объём. */
  meta: string;
  price: string;
  badge?: string;
};

/**
 * Меню мастерской. Чтобы поменять ассортимент — правьте только этот массив,
 * блок на странице и список в форме обновятся сами.
 */
export const COFFEE_MENU: CoffeeItem[] = [
  {
    id: "ethiopia-irgacheffe",
    name: "Эфиопия Иргачеффе",
    description: "цветочный, бергамот, светлая обжарка",
    meta: "250 г",
    price: "32 BYN",
    badge: "Светлая обжарка",
  },
  {
    id: "colombia-huila",
    name: "Колумбия Уила",
    description: "карамель, красное яблоко",
    meta: "250 г",
    price: "29 BYN",
  },
  {
    id: "brazil-cerrado",
    name: "Бразилия Серрадо",
    description: "орех, шоколад, под эспрессо",
    meta: "250 г",
    price: "26 BYN",
    badge: "Под эспрессо",
  },
  {
    id: "drip-packets",
    name: "Дрип-пакеты, ассорти",
    meta: "10 штук",
    price: "18 BYN",
  },
  {
    id: "subscription",
    name: "Подписка",
    description: "2 пачки по 250 г раз в месяц, доставка бесплатно",
    meta: "2 × 250 г",
    price: "54 BYN / мес",
    badge: "Каждый месяц",
  },
];

/** Варианты мультивыбора «что заинтересовало» в форме заявки. */
export const INTEREST_OPTIONS: { value: string; label: string }[] = COFFEE_MENU.map(
  (item) => ({ value: item.id, label: item.name }),
);

export function interestLabelsFromIds(ids: string[]): string[] {
  return ids
    .map((id) => COFFEE_MENU.find((item) => item.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}
