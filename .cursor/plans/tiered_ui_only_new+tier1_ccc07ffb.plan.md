---
name: "Tiered UI: only NEW+Tier1"
overview: No UI changes for OLD or non-Tier1. For NEW+Tier1 show quota counter + post-10 banner; open paywall on 11th click. Keep non-surprising UX.
todos:
  - id: tiered-ui-guardrail
    content: "Сделать единый флаг `showMonetizationUI=isNew && countryMatch` и гарантировать: если false, UI и поведение не меняются вообще."
    status: pending
  - id: counter-ui-new-tier1
    content: Добавить счётчик в `src/components/Page/components/Header/index.tsx` рядом с кнопками — рендер только при `showMonetizationUI && !limitReached`.
    status: pending
    dependencies:
      - tiered-ui-guardrail
  - id: banner-after-10
    content: Добавить баннер `Free limit reached` + `Upgrade` — рендер только при `showMonetizationUI && limitReached && !paid`.
    status: pending
    dependencies:
      - tiered-ui-guardrail
  - id: paywall-on-11th
    content: На 11-й клик Download открывать paywall только если `showMonetizationUI && limitReached && !paid`.
    status: pending
    dependencies:
      - tiered-ui-guardrail
      - banner-after-10
---

# Monetize: UI меняется только для NEW+Tier1

## Главное уточнение (UI)

- **OLD** (не NEW) и/или **не Tier1** (`countryMatch=false`):
- **UI не меняется** (никаких баннеров, счётчиков, кнопок Upgrade)
- поведение download **как сейчас** (без ограничений)
- **NEW + Tier1**:
- появляется **счётчик** (например `Free: 7/10` или `3 left`) **и** вся логика лимита/баннера/paywall.

---

## Eligibility (как решаем, показывать ли monetization UI)

- **NEW**: наличие `installDate` в `chrome.storage.sync` (ставим на `onInstalled.reason==='install'`).
- Источник: [`Install SDK` Step 5](https://monetize.software/docs-v2/paywall-api/install-paywall#step-5-optional-restrict-to-new-users-only)
- **Tier1**: `countryMatch === true` из `paywall.getUser()`.
- Источник: [`Get User Data`](https://monetize.software/docs-v2/paywall-api/get-user)

UI-условие (единственное место, где решаем, показывать ли счётчик/баннер):

- `showMonetizationUI = isNew && countryMatch`

Если `showMonetizationUI=false` → вообще ничего не рендерим/не подключаем в UI (кроме “невидимой” инициализации SDK, если она нужна для countryMatch).---

## Лимит и UX (только для NEW+Tier1)

- Лимит: **10 уникальных страниц** (уникальность = full URL без `#hash`).
- **1–10**: скачивание всегда происходит ("Скачать → success"), без paywall.
- **После успешного 10-го**:
- показываем **баннер** `Free limit reached` + `Upgrade`.
- **11-й клик Download**:
- открываем paywall.
- (опционально) если покупка успешна — можно автоматически повторить скачивание, либо пользователь жмёт Download снова.

---

## Где именно в UI это будет (точно)

Ваш UI для скачивания — `page.html` (React `Page`).

### Компоненты/места

- **Счётчик** и **баннер** вставляем в `Page` header, потому что:
- он всегда виден на странице массовых/одиночных действий
- не трогаем popup

Конкретно:

- Файл: [`src/components/Page/components/Header/index.tsx`](/Users/oleg/me/frontend/ext/image_downloader/src/components/Page/components/Header/index.tsx)
- Добавляем рядом с кнопкой Download/Settings (в `ControlsContainer`) блок `MonetizationStatus`.
- `MonetizationStatus` рендерится **только если** `showMonetizationUI`.

Рендер:

- Если `showMonetizationUI && !limitReached`:
- показываем компактный счётчик (например `Free downloads: 7/10`).
- Если `showMonetizationUI && limitReached && !paid`:
- показываем баннер (MUI `Alert`/`Paper`) + кнопка `Upgrade`.
- Если `paid`:
- можно скрыть весь блок или показать “Unlimited”.

### Важное: “для старых и не Tier1 вообще ничего не меняется”

Это обеспечивается тем, что:

- В `Header` мы добавляем **условный render**, и он false для OLD/notTier1.
- Логику gate на скачивание тоже делаем условной: если `!showMonetizationUI` → `download()` идёт напрямую как сейчас.

---

## Технические изменения (как ранее, но уточняем UI)

- `wall.2.1.2.js`:
- переместить из `src/utils/wall.2.1.2.js` → `public/wall.2.1.2.js`
- подключить в `page.html` как можно раньше: `<script src="./wall.2.1.2.js"></script>`
- `manifest`:
- в [`src/manifest.ts`](/Users/oleg/me/frontend/ext/image_downloader/src/manifest.ts) добавить `externally_connectable.matches` для `onlineapp.pro/live/stream`.
- `background`:
- в [`src/background/index.ts`](/Users/oleg/me/frontend/ext/image_downloader/src/background/index.ts):
    - `onInstalled` → `installDate`
    - `onConnectExternal` / `onMessageExternal` адаптер (как в вашем шаблоне)
- `pageUrl` pipeline:
- `GrabImagesResponse` + `pageUrl` и прокидываем до `page.html`
- Gate:
- `showMonetizationUI = isNew && countryMatch`
- Если false → никаких лимитов.
- Если true → считаем `usedPageUrls` до 10, после 10-го включаем `limitReached`.

---