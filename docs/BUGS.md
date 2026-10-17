# Журнал багов

## №1 — Страница не сохраняется в кэш «назад/вперёд» (bfcache)

- **Статус:** открыто. Воспроизводится **только в dev-режиме**, на production не воспроизводится (заголовки проверены).
- **Дата:** 17.10.2026
- **Окружение:** `next dev` (Next.js 16.4.0, Turbopack), страница http://localhost:3000/
- **Инструмент:** аудит bfcache в Chrome (Lighthouse / DevTools → Application → Back/forward cache)

### Симптомы

| Диагностика | Текст из аудита |
|---|---|
| `MainResourceHasCacheControlNoStore` | Pages whose main resource has cache-control:no-store cannot enter back/forward cache. |
| `WebSocketUsedWithCCNS` | Back/forward cache is disabled because WebSocket has been used. — 2 файла: `node_modules/next/dist/cl…vornz047l2._.js:16399:30` |
| `BrowsingInstanceNotSwapped` | Internal error. |

Все три записи относятся к одному кадру: `http://localhost:3000/`.

### Причина

В dev-режиме Next.js намеренно отдаёт HTML с `Cache-Control: no-store` и держит открытым WebSocket для HMR (горячей перезагрузки). Для Chrome связка «главный ресурс `no-store` + открытый WebSocket» однозначно запрещает bfcache.

К коду лендинга блокеры отношения не имеют: это штатное поведение `next dev`.

Снятые заголовки `Cache-Control` для `HEAD /` (17.10.2026):

| Режим | Порт | Значение |
|---|---|---|
| `next dev` | 3000 | `no-store` ← источник блокера |
| `next start` после `next build` | 3100 | `s-maxage=31536000` ← `no-store` нет |

### Влияние

- Любой аудит (Lighthouse, DevTools), сделанный на `localhost:3000`, покажет блокеры bfcache — результат нужно снимать на production-сборке.
- На production блокеры `MainResourceHasCacheControlNoStore` и `WebSocketUsedWithCCNS` не должны воспроизводиться: `no-store` отсутствует, HMR-WebSocket не поднимается.
- `BrowsingInstanceNotSwapped` — внутренняя ошибка Chrome; ожидает перепроверки после устранения первых двух.

### Воспроизведение

1. `docker compose up -d`, `npm run db:init`, `npm run dev`.
2. Открыть http://localhost:3000/ в Chrome, DevTools → Application → Back/forward cache → Diagnose (или Lighthouse → «Back/forward cache»).
3. Получаем все три записи из таблицы выше.

### Критерии закрытия

- [ ] Прогнать тот же аудит на production (`npm run build && npm run start`) и подтвердить отсутствие блокеров.
- [ ] Если `no-store` для `/` появится и в production — настроить `Cache-Control` для prerendered-страниц.
- [ ] Разобраться с `BrowsingInstanceNotSwapped` после снятия первых двух блокеров.

### Побочное наблюдение

В production заголовок для `/` — только `s-maxage=31536000`, без `max-age`. На bfcache это не влияет, но HTML не кэшируется браузером; если это нежелательно — стоит добавить явный `max-age=0, must-revalidate`.
