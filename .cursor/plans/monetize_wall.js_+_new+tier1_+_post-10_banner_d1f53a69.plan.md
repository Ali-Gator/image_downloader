---
name: Monetize wall.js + NEW+Tier1 + post-10 banner
overview: Use existing wall.2.1.2.js (local file) with required MV3 manifest + background external-connect handlers; apply paywall only to NEW users that match Tier1 targeting; show soft banner after 10th success and open paywall on 11th click (no surprise).
todos:
  - id: move-wall-js
    content: Переместить `src/utils/wall.2.1.2.js` → `public/wall.2.1.2.js` и подключить в `page.html` через `<script src="./wall.2.1.2.js"></script>` максимально рано.
    status: pending
  - id: manifest-external-connectable
    content: В `src/manifest.ts` добавить `externally_connectable.matches` для onlineapp domains.
    status: pending
  - id: background-external-handlers
    content: В `src/background/index.ts` добавить `onConnectExternal`/`onMessageExternal`/storage adapter + `getUserId()` как в вашем шаблоне.
    status: pending
    dependencies:
      - manifest-external-connectable
  - id: new-install-date
    content: В `src/background/index.ts` на `onInstalled.reason==='install'` сохранить `installDate` в `chrome.storage.sync`.
    status: pending
  - id: pageurl-pipeline
    content: Прокинуть `pageUrl` из `content-script` → popup → page.html и сохранить в store.
    status: pending
  - id: gate-and-limit
    content: "Реализовать gate: только NEW+Tier1 считаем 10 уникальных pageUrl; после 10-го включаем баннер; на 11-й клик открываем paywall."
    status: pending
    dependencies:
      - move-wall-js
      - background-external-handlers
      - pageurl-pipeline
      - new-install-date
  - id: banner-ui
    content: Добавить баннер “Free limit reached” + Upgrade button в UI `page.html` (без счётчика).
    status: pending
    dependencies:
      - gate-and-limit
---

# Monetize интеграция (wall.2.1.2.js) + NEW+Tier1 + мягкий UX

## Ключевые требования

- **Paywall/лимит включается только** для пользователей, которые одновременно:
- **NEW** (installDate установлен при `onInstalled.reason === 'install'`)
- **Tier1** (через `countryMatch === true` из `paywall.getUser()`)
- Все **OLD** или **не Tier1** — скачивают бесплатно, paywall никогда не показываем.
- UX:
- **1–10**: “Скачать → success”, без paywall.
- **после успешного 10-го**: показываем **баннер** “Free limit reached. Upgrade to continue.” (без счётчика).
- **11-й клик Download**: открываем paywall (уже не внезапно, потому что был баннер).

Источники:

- NEW-only (`installDate`): [`Install SDK` → Step 5](https://monetize.software/docs-v2/paywall-api/install-paywall#step-5-optional-restrict-to-new-users-only)
- Tier1 gating: `countryMatch` из [`paywall.getUser()`](https://monetize.software/docs-v2/paywall-api/get-user)
- Paywall может не открыться: `country-not-match` из [`Open Paywall` → “When paywall won’t open”](https://monetize.software/docs-v2/paywall-api/open#when-paywall-wont-open)

---

## 1) Где должен лежать `wall.2.1.2.js`

Сейчас файл у вас в `src/utils/wall.2.1.2.js` (это неудобно, потому что Vite может попытаться трактовать как модуль).**План**:

- Переместить в **`public/wall.2.1.2.js`**.
- Vite скопирует его в корень билда рядом с `page.html`/`popup.html`.
- Тогда в HTML можно безопасно писать:
    - `<script src="./wall.2.1.2.js"></script>`

---

## 2) Подключение скрипта на нужной странице

В вашем расширении скачивания происходят на странице `page.html` (UI с выбором изображений).Popup (`popup.html`) только открывает `page.html` и отправляет туда изображения.**План**:

- Добавить `<script src="./wall.2.1.2.js"></script>` как можно ближе к началу в **`page.html`** (корень репо) и/или в шаблон, который реально попадает в build.
- Инициализировать paywall при загрузке UI (например, в самом начале приложения page): `window.paywall.init('711')`.

Примечание: в вашем `wall.2.1.2.js` есть fallback `_ensureInitialized()` который сам вызывает `this.init("711")`, но мы всё равно сделаем явный `init('711')` для предсказуемости.---

## 3) manifest (MV3): externally_connectable

У вас manifest генерируется из TypeScript файла: [`src/manifest.ts`](/Users/oleg/me/frontend/ext/image_downloader/src/manifest.ts).**План**: добавить в него `externally_connectable`:

- matches:
- `https://onlineapp.pro/*`
- `https://onlineapp.stream/*`
- `https://onlineapp.live/*`

Permissions:

- `storage` уже есть.
- `externally_connectable` — отдельная секция, не permission.

---

## 4) background (MV3 service worker): external-connect handlers + NEW flag

У вас background — это [`src/background/index.ts`](/Users/oleg/me/frontend/ext/image_downloader/src/background/index.ts) (MV3 service worker).

### 4.1 NEW-only installDate

Добавить в `chrome.runtime.onInstalled`:

- если `details.reason === 'install'` → записать `installDate` в `chrome.storage.sync`.

(Это соответствует доке Monetize: [`Install SDK` Step 5](https://monetize.software/docs-v2/paywall-api/install-paywall#step-5-optional-restrict-to-new-users-only))

### 4.2 Monetize external messaging

Реализовать по вашему присланному шаблону:

- `chrome.runtime.onConnectExternal`:
- принимать только домены `onlineapp.pro/live/stream`
- хранить порты в Set
- `chrome.runtime.onMessageExternal`:
- обслуживать адаптер хранения (source: `supabase-auth-adapter`) через `chrome.storage.sync`:
    - `getItem` / `setItem` / `removeItem`
- поддержать `broadcast`

Также добавить `getUserId()` и проставлять:

- `user_id`
- `pw-711-visitor-id`

(Это важно: ваш `wall.2.1.2.js` читает `pw-<wallId>-visitor-id` из `chrome.storage.sync`.)Опционально: `trackEvent('install')` — можно оставить, но обернуть в try/catch и без падений service worker.---

## 5) Прокидывание `pageUrl` (для лимита “10 уникальных страниц”)

Сейчас `page.html` не знает URL страницы, откуда собрали изображения.**План**:

- `content-script` (`GRAB_IMAGES`) возвращает `{ images, pageUrl: window.location.href }`.
- `popup` пересылает это в `page.html`.
- `page.html` сохраняет `pageUrl` в store.

Файлы:

- [`src/types/index.ts`](/Users/oleg/me/frontend/ext/image_downloader/src/types/index.ts)
- [`src/contentScript/content-script.ts`](/Users/oleg/me/frontend/ext/image_downloader/src/contentScript/content-script.ts)
- [`src/utils/messaging.ts`](/Users/oleg/me/frontend/ext/image_downloader/src/utils/messaging.ts)
- [`src/components/Popup/index.tsx`](/Users/oleg/me/frontend/ext/image_downloader/src/components/Popup/index.tsx)
- [`src/components/Page/index.tsx`](/Users/oleg/me/frontend/ext/image_downloader/src/components/Page/index.tsx)

---

## 6) Gate логика (NEW+Tier1) + “баннер после 10-го”

### 6.1 Tier1 проверка

- `safeGetUser()` вызывает `paywall.getUser()`.
- Берём `countryMatch`.
- Если 401/Unauthorized — трактуем как `countryMatch` по ответу (дока говорит, что в 401 есть `countryMatch/tier/country`): [`getUser`](https://monetize.software/docs-v2/paywall-api/get-user).

### 6.2 Лимит

- Только если `isNew && countryMatch`.
- Храним в `chrome.storage.local`:
- `usedPageUrls: string[]` (макс 10)
- `limitReachedAt?: string` (для UI баннера)
- Нормализация pageUrl: убираем `#hash`, остальное оставляем.

### 6.3 Когда открываем paywall

- **Никогда до скачивания**.
- На **11-й клик Download** (если `limitReached && !paid`) → `paywall.open()`.
- После успешного `paywall.open({ resolveEvent: 'success-purchase' })` (или проверки `paid`) — разрешаем повторить скачивание.

Точки интеграции:

- Single: [`src/utils/imageOperations.ts`](/Users/oleg/me/frontend/ext/image_downloader/src/utils/imageOperations.ts)
- Bulk: [`src/components/Page/components/Header/index.tsx`](/Users/oleg/me/frontend/ext/image_downloader/src/components/Page/components/Header/index.tsx)

---

## 7) UI баннер (без счётчика)

На `page.html` показываем баннер, если:

- `isNew && countryMatch && limitReached && !paid`

Баннер:

- текст: “Free limit reached. Upgrade to continue.”
- кнопка: `Upgrade` → `paywall.open()`

---

## Checklist готовности
