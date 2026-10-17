Большую часть всего написала ИИ, был баг с валидацией который ИИ сам и пофиксил, 
 ещё мелкие визуальные баги, сам менял анимации выпадающего меню в мобильной версии,
 генерация фото владельцев, расположения по сайту и редактирование самого текста написаного ИИ. 
Использовал Opencode, с большего как по мне ИИ перемудрила с раскидыванием файлов по компонентом 
 и многие вещи я бы просто захардкодил с учётом того что это лендинговый сайт, 
 но не хочеться заниматься ненужной работай и терять время в пустую.
Изначально писал на базе БД mySQL, но с учётом хостинга на vercel попросил ИИ переписать на PostgreSQL.



# кварта — лендинг мастерской обжарки кофе

Одностраничный сайт небольшой мастерской обжарки кофе: рассказ о себе, меню,
адрес с часами работы и форма заявки. Заявки складываются в MySQL с пометкой
**откуда пришёл клиент** (реклама / объявление / страница), а о новых заявках
можно уведомлять Telegram-бот или отдельный проект бота.

Стек: **Next.js 16** (App Router, Server Actions) + **React 19** + **Tailwind CSS v4**
+ **MySQL**. Все тексты, цены и контакты — в одном месте (`src/lib/`).

---

## Быстрый старт

```bash
# 1. Поднять MySQL в контейнере (порт 13306, чтобы не мешать локальному 3306)
docker compose up -d

# 2. Настроить окружение
cp .env.example .env.local      # Windows: copy .env.example .env.local
# заполните ADMIN_API_TOKEN и, при желании, уведомления (см. таблицу ниже)

# 3. Создать таблицу заявок (или это сделает приложение при первой заявке)
npm run db:init

# 4. Запустить сайт
npm run dev                     # http://localhost:3000
```

Продакшн-сборка:

```bash
npm run build
npm run start
```

Проверка, что всё живо: `GET /api/health` → `{"ok":true,"database":"up",...}`.

---

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Дев-сервер на `http://localhost:3000` |
| `npm run build` | Продакшн-сборка |
| `npm run start` | Запуск собранного приложения |
| `npm run lint` | ESLint |
| `npm run typecheck` | Проверка типов (`tsc --noEmit`) |
| `npm run db:init` | Накатывает `db/schema.sql` на MySQL из `.env.local` |

---

## Переменные окружения

Полный список — в `.env.example`. Копируйте его в `.env.local` (файл в `.gitignore`).

### MySQL

| Переменная | Обязательна | По умолчанию | Описание |
| --- | --- | --- | --- |
| `MYSQL_HOST` | нет | `127.0.0.1` | Хост базы |
| `MYSQL_PORT` | нет | `3306` | Порт (в примере `13306` — как у docker-compose) |
| `MYSQL_USER` | нет | `root` | Пользователь |
| `MYSQL_PASSWORD` | нет | — | Пароль |
| `MYSQL_DATABASE` | нет | `kvarta` | Имя базы |
| `MYSQL_SSL` | нет | — | `true` для баз, требующих TLS |
| `DATABASE_URL` | нет | — | Одна строка подключения, приоритетнее параметров выше |
| `MYSQL_POOL_SIZE` | нет | `5` | Размер пула соединений |
| `DB_AUTO_MIGRATE` | нет | `true` | `false` — не создавать таблицу автоматически |

### API заявок (для бота/менеджера)

| Переменная | Обязательна | Описание |
| --- | --- | --- |
| `ADMIN_API_TOKEN` | для API | Секретный токен доступа к `/api/leads`. Без него API отвечает `503` |

Сгенерировать токен:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

### Уведомления о заявках

Можно включить **любой из каналов** или оба сразу — заявка уйдёт по всем настроенным.

| Переменная | Описание |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Токен бота от `@BotFather` (прямая отправка в чат) |
| `TELEGRAM_CHAT_ID` | ID чата/группы, куда писать |
| `TELEGRAM_MESSAGE_THREAD_ID` | Номер темы (topic) в супергруппе, если нужно |
| `BOT_WEBHOOK_URL` | URL отдельного проекта бота — ему уходит `POST { event, lead }` |
| `BOT_WEBHOOK_SECRET` | Если задан, уходит заголовком `x-bot-secret` |

### Сайт

| Переменная | Описание |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Адрес сайта для метаданных и canonical (напр. `https://kvarta.by`) |

---

## Как работает форма заявки

1. Клиент заполняет форму (имя, телефон, «что заинтересовало», примечание).
   Телефон проверяется на формат Беларуси `+375 (XX) XXX-XX-XX` — и в браузере
   (`pattern`), и на сервере (истина).
2. Вместе с полями уезжает **разметка источника**: UTM-метки, `yclid`/`gclid`/`fbclid`,
   реферер, страница первого захода и страница заявки. Значения собираются в браузере
   и кладутся в скрытые поля (первое касание за сессию + текущий заход по рекламе).
3. [Server Action](src/app/actions.ts) `submitLead` ещё раз всё проверяет, отсекает
   спам (скрытая `company`, лимит 5 отправок за 10 минут с адреса) и пишет строку в MySQL.
   Если JS был выключен и скрытые поля не доехали — метки вытащит из заголовка `Referer`.
4. Заявка уже сохранена, поэтому уведомление отправляется **после ответа** (`after()`)
   и не задерживает форму.

Ошибка записи в базу не теряется: пользователь увидит вежливое сообщение и телефон,
а детали попадут в лог сервера.

### Что сохраняется

`name`, `phone`, `interests` (названия позиций через запятую), `note`,
`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`,
`click_id` + `click_id_type`, `referrer`, `landing_page`, `page_url`,
`user_agent`, `ip`, `status` и служебные `created_at` / `updated_at`.

---

## API заявок (для отдельного бота)

Бот — отдельный проект. Сайт отдаёт ему заявки по REST и меняет статусы.
Все запросы требуют токен: заголовок `Authorization: Bearer <ADMIN_API_TOKEN>`
(или `x-api-token: <ADMIN_API_TOKEN>`).

### Статусы

`new` → `in_progress` → `done`, а также `rejected` и `spam`.

### `GET /api/leads`

Параметры запроса (все необязательны):

| Параметр | Описание |
| --- | --- |
| `status` | `new` \| `in_progress` \| `done` \| `rejected` \| `spam` (или `all`) |
| `limit` | От 1 до 100, по умолчанию `20` |
| `offset` | Сколько заявок пропустить, по умолчанию `0` |
| `order` | `desc` (свежие сверху, по умолчанию) или `asc` |
| `after_id` | Только заявки с `id` больше указанного — удобно опрашивать новые |
| `since` | Только новее ISO-даты, напр. `2026-10-14T00:00:00.000Z` |

Пример:

```bash
curl -s "http://localhost:3000/api/leads?status=new&limit=10&after_id=100" \
  -H "Authorization: Bearer $ADMIN_API_TOKEN"
```

Ответ:

```json
{
  "ok": true,
  "total": 12,
  "count": 10,
  "limit": 10,
  "offset": 0,
  "statuses": ["new", "in_progress", "done", "rejected", "spam"],
  "counts": { "new": 12, "in_progress": 0, "done": 0, "rejected": 0, "spam": 0 },
  "leads": [ { "id": 101, "name": "Аня", "phone": "+375297654321", "...": "..." } ]
}
```

### `GET /api/leads/:id`

Одна заявка. `404`, если не найдена.

### `PATCH /api/leads/:id`

Смена статуса из бота:

```bash
curl -X PATCH "http://localhost:3000/api/leads/101" \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "content-type: application/json" \
  -d '{"status":"in_progress","by":"@manager"}'
```

`by` — произвольная подпись «кто поменял» (например, юзернейм в Telegram),
сохраняется в `status_changed_by`. Неизвестный статус → `400` со списком допустимых.

### Коды ответов

| Код | Когда |
| --- | --- |
| `200` | Успех |
| `400` | Неверный параметр (статус, `after_id`, `since`, тело) |
| `401` | Токен не передан или неверный |
| `404` | Заявка не найдена |
| `503` | `ADMIN_API_TOKEN` не задан на сервере |

---

## Уведомления о новой заявке

Настраиваются в `.env.local`, включаются автоматически, если заданы переменные.

**Вариант 1 — бот пишет в чат напрямую.** Задайте `TELEGRAM_BOT_TOKEN` и
`TELEGRAM_CHAT_ID`. Сообщение приходит готовым HTML-текстом: имя, телефон
(кликабельный), интерес, примечание, блок «Откуда пришёл» и время по Минску.

**Вариант 2 — отдельный проект бота.** Задайте `BOT_WEBHOOK_URL` (и при желании
`BOT_WEBHOOK_SECRET`). Сайт сделает:

```
POST <BOT_WEBHOOK_URL>
x-bot-secret: <BOT_WEBHOOK_SECRET>
content-type: application/json

{ "event": "lead.created", "lead": { ...полная заявка... } }
```

Тот же бот может забирать заявки и менять статусы через REST API выше — получается
полный цикл: сайт ловит заявку → бот получает её → бот показывает и меняет статус.

---

## Где менять контент

| Что | Файл |
| --- | --- |
| Меню, цены, вес, варианты в форме | [`src/lib/menu.ts`](src/lib/menu.ts) |
| Название, телефон, адрес, часы, соцсети | [`src/lib/site.ts`](src/lib/site.ts) |
| Текст блока «О мастерской» | [`src/components/sections/about.tsx`](src/components/sections/about.tsx) |
| Блок адреса / как получить заказ | [`src/components/sections/visit.tsx`](src/components/sections/visit.tsx) |
| Блок заявки и подсказки | [`src/components/sections/order.tsx`](src/components/sections/order.tsx) |
| Метаданные, OG, structured data | [`src/app/layout.tsx`](src/app/layout.tsx), [`src/app/page.tsx`](src/app/page.tsx) |
| Цвета и шрифт | [`src/app/globals.css`](src/app/globals.css) |

Меню и список в форме связаны: добавьте позицию в `COFFEE_MENU` — она появится
и в блоке «Кофе», и в мультивыборе заявки.

---

## Что заменить перед продакшеном

В коде оставлены реалистичные заглушки — их нужно поменять на настоящие данные:

- телефон `+375291234567` — [`src/lib/site.ts`](src/lib/site.ts);
- e-mail `hello@kvarta.by` и Telegram `@kvarta_coffee`;
- ссылки на соцсети в `SOCIAL_LINKS` (сейчас Instagram и YouTube — заглушки,
  иконки в [`src/components/icons.tsx`](src/components/icons.tsx) можно заменить своими);
- `NEXT_PUBLIC_SITE_URL` на реальный домен;
- сменить пароли MySQL из docker-compose и заполнить `ADMIN_API_TOKEN`.

Если БД уже создана отдельно, поставьте `DB_AUTO_MIGRATE=false` и накатите
`db/schema.sql` заранее.

---

## Структура проекта

```
src/
  app/
    actions.ts            server action приёма заявки
    api/
      health/route.ts     проверка «жив ли сайт и база»
      leads/route.ts      GET список заявок (для бота)
      leads/[id]/route.ts GET одна заявка, PATCH смена статуса
    layout.tsx, page.tsx, globals.css
  components/
    sections/             блоки страницы (about, coffee, visit, order)
    lead-form.tsx         форма заявки
    interests-select.tsx  мультивыбор «что заинтересовало»
    site-header.tsx, site-footer.tsx, section.tsx, icons.tsx
  lib/
    db.ts                 пул MySQL + авто-создание таблицы
    leads-repo.ts         запросы к заявкам
    leads.ts              типы и валидация заявки
    phone.ts              белорусские телефоны
    attribution.ts        сбор источника заявки в браузере
    lead-source.ts        разбор меток и подстраховка через Referer
    notify.ts             уведомления (Telegram + вебхук бота)
    api-auth.ts, http.ts, rate-limit.ts
    site.ts, menu.ts
db/schema.sql             схема базы (ручной/операционный вариант)
docker-compose.yml        локальная MySQL
scripts/init-db.mjs       npm run db:init
```

---

## Заметки по развёртыванию

- Приложение рассчитано на Node.js-сервер (`next start`), а не на статику: нужны
  Server Actions и доступ к MySQL.
- docker-compose отдаёт базу на `13306`, потому что локальный MySQL обычно занял
  `3306`. В проде укажите свои `MYSQL_HOST` / `MYSQL_PORT`.
- Лимит отправок формы хранится в памяти процесса: при нескольких инстансах
  лимит считается по каждому отдельно. Для строгого ограничения используйте
  внешний сервис (Redis и т.п.).
