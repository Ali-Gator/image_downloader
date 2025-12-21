---
name: Monetize NEW+Tier1 unified
overview: "Слить два плана в один master: подключить Monetize wall SDK, MV3 external messaging в background, NEW+Tier1 gate, лимит 10 уникальных pageUrl, UI счётчик до лимита + баннер после 10-го, paywall на 11-й клик. Для OLD/non-Tier1 UI и поведение не меняются."
todos:
  - id: move-wall-js
    content: Переместить `src/utils/wall.2.1.2.js` → `public/wall.2.1.2.js` и подключить в `page.html` максимально рано; добавить типы `window.paywall`.
    status: completed
  - id: manifest-external-connectable
    content: В `src/manifest.ts` добавить `externally_connectable.matches` для `onlineapp.pro/stream/live`.
    status: completed
  - id: background-external-handlers
    content: В `src/background/index.ts` добавить `onConnectExternal`/`onMessageExternal`, storage adapter (sync), `getUserId()` и ключи `user_id` + `pw-711-visitor-id`.
    status: completed
    dependencies:
      - manifest-external-connectable
  - id: new-install-date
    content: В `src/background/index.ts` на `onInstalled.reason==='install'` сохранить `installDate` в `chrome.storage.sync`.
    status: completed
  - id: pageurl-pipeline
    content: Прокинуть `pageUrl` из `content-script` → popup → page и сохранить в store (обновить `GrabImagesResponse`).
    status: completed
  - id: gate-and-limit
    content: Реализовать gate `showMonetizationUI=isNew && countryMatch`, учёт 10 уникальных pageUrl после success, баннер после 10-го, paywall на 11-й клик (single+bulk).
    status: completed
    dependencies:
      - move-wall-js
      - background-external-handlers
      - new-install-date
      - pageurl-pipeline
  - id: ui-counter-and-banner
    content: "Добавить в Header `MonetizationStatus`: счётчик до лимита и баннер+Upgrade после 10-го, рендер только при `showMonetizationUI`."
    status: completed
    dependencies:
      - gate-and-limit
  - id: plan-cleanup
    content: Удалить `.cursor/plans/tiered_ui_only_new+tier1_ccc07ffb.plan.md` после переноса содержания/требований в master план.
    status: completed
---

# Monetize: NEW+Tier1 + counter + post-10 banner (unified)

## Цель

- Интегрировать `wall.2.1.2.js` (Monetize) и включать монетизацию **только** для пользователей, которые одновременно:
- **NEW**: `installDate` присутствует в `chrome.storage.sync` (ставим на `onInstalled.reason === 'install'`).
- **Tier1**: `countryMatch === true` из `paywall.getUser()`.
- UX:
- **1–10 успешных скачиваний** с **уникальных страниц** (уникальность = полный URL без `#hash`) — бесплатно.
- После успешного 10-го — показать **баннер** “Free limit reached. Upgrade to continue.”
- **11-й клик Download** — открыть paywall (не раньше), потому что баннер уже предупредил.
- Guardrail: если `showMonetizationUI = isNew && countryMatch` **false**, то **UI и поведение не меняются вообще**.

## Источник правды (после слияния)

- Оставляем как master: `.cursor/plans/monetize_wall.js_+_new+tier1_+_post-10_banner_d1f53a69.plan.md`
- В него переносим UI/guardrail + счётчик из `.cursor/plans/tiered_ui_only_new+tier1_ccc07ffb.plan.md`
- После переноса удаляем второй план, чтобы не было расхождений.

## Изменения по коду (выполнение)

### 1) Подключить wall SDK на `page.html`

- Переместить `src/utils/wall.2.1.2.js` → `public/wall.2.1.2.js`.
- Подключить на странице загрузок (`page.html`) максимально рано:
- `<script src="./wall.2.1.2.js"></script>`
- В React entry `Page` (или раннем bootstrap) добавить явный `window.paywall?.init('711')` (с защитой от отсутствия SDK).
- Добавить типизацию глобала `window.paywall` (например `src/types/paywall.d.ts`).

### 2) MV3 manifest: externally_connectable

- В [`src/manifest.ts`](src/manifest.ts) добавить `externally_connectable.matches` для Monetize доменов:
- `https://onlineapp.pro/*`
- `https://onlineapp.stream/*`
- `https://onlineapp.live/*`

### 3) Background service worker: external messaging + NEW flag

- В [`src/background/index.ts`](src/background/index.ts):
- На `chrome.runtime.onInstalled` если `details.reason === 'install'` → записать `installDate` в `chrome.storage.sync`.
- Реализовать `chrome.runtime.onConnectExternal` / `onMessageExternal`:
    - принимать только ожидаемые домены `onlineapp.*`
    - хранить активные порты
    - обслуживать storage adapter (`getItem`/`setItem`/`removeItem`) через `chrome.storage.sync`
    - поддержать `broadcast`
- Реализовать `getUserId()` и выставлять ключи, которые ожидает SDK:
    - `user_id`
    - `pw-711-visitor-id`

### 4) Прокинуть `pageUrl` (для лимита “10 уникальных страниц”)

- В типах [`src/types/index.ts`](src/types/index.ts) расширить `GrabImagesResponse`, добавив `pageUrl: string`.
- В [`src/contentScript/content-script.ts`](src/contentScript/content-script.ts) в ответ `GRAB_IMAGES` вернуть `pageUrl: window.location.href`.
- В popup → page pipeline:
- [`src/components/Popup/index.tsx`](src/components/Popup/index.tsx): переслать `pageUrl` в сообщение, которое открывает/инициализирует `page.html`.
- [`src/components/Page/index.tsx`](src/components/Page/index.tsx): принять `pageUrl` и сохранить в store.

### 5) Gate + лимит (10 уникальных pageUrl) + paywall на 11-й клик

- Добавить единый вычисляемый флаг:
- `showMonetizationUI = isNew && countryMatch`
- `isNew`:
- читаем `installDate` из `chrome.storage.sync` (если нет — считаем OLD).
- `countryMatch`:
- `safeGetUser()` → `window.paywall.getUser()`
- если SDK возвращает 401 с телом, извлекаем `countryMatch` из ответа (как в доке).
- Лимит:
- хранить в `chrome.storage.local`:
    - `usedPageUrls: string[]` (макс 10)
    - `limitReachedAt?: string`
- нормализовать `pageUrl` (убрать `#hash`).
- Точка применения:
- single download: [`src/utils/imageOperations.ts`](src/utils/imageOperations.ts)
- bulk download: [`src/components/Page/components/Header/index.tsx`](src/components/Page/components/Header/index.tsx) (или через общий helper)
- Правило:
- до лимита — скачивание как сейчас, а при успехе учитываем pageUrl.
- после достижения 10 уникальных (и success) — выставляем `limitReachedAt`.
- на 11-й клик: если `showMonetizationUI && limitReached && !paid` → `paywall.open()`.

### 6) UI в Header: счётчик + баннер (только NEW+Tier1)

- В [`src/components/Page/components/Header/index.tsx`](src/components/Page/components/Header/index.tsx):
- вставить блок `MonetizationStatus` рядом с контролами.
- рендерить **только** если `showMonetizationUI`.
- состояния:
    - `showMonetizationUI && !limitReached`: компактный счётчик (например “Free: 7/10”).
    - `showMonetizationUI && limitReached && !paid`: баннер + кнопка `Upgrade` → `paywall.open()`.
    - `paid`: скрыть блок или показать “Unlimited”.

## Поток (упрощённо)

```mermaid
flowchart TD
  popup[Popup] -->|GRAB_IMAGES| contentScript[ContentScript]
  contentScript -->|{images,pageUrl}| popup
  popup -->|open page.html + send payload| page[Page_UI]
  page -->|compute showMonetizationUI| gate[Gate_NEW_and_Tier1]
  gate -->|allow| download[Download]
  gate -->|limitReached_and_unpaid| paywall[paywall.open_on_11th]
```