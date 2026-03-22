import '@testing-library/jest-dom';

// Chrome API global mock
const chromeStorageData: Record<string, unknown> = {};

global.chrome = {
  runtime: {
    id: 'test-extension-id',
    lastError: undefined,
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
    onConnect: { addListener: vi.fn() },
    onConnectExternal: { addListener: vi.fn() },
    onMessageExternal: { addListener: vi.fn() },
    getManifest: vi.fn(() => ({ content_scripts: [{ js: ['content-script.js'] }] })),
    connect: vi.fn(() => ({ onDisconnect: { addListener: vi.fn() }, disconnect: vi.fn() })),
    setUninstallURL: vi.fn(),
    getURL: vi.fn((path: string) => `chrome-extension://test-extension-id/${path}`),
  },
  storage: {
    local: {
      get: vi.fn((_keys, cb) => cb({})),
      set: vi.fn((_data, cb) => {
        Object.assign(chromeStorageData, _data);
        cb?.();
      }),
      remove: vi.fn((_keys, cb) => cb?.()),
    },
    sync: {
      get: vi.fn((_keys, cb) => cb({})),
      set: vi.fn((_data, cb) => cb?.()),
      remove: vi.fn((_keys, cb) => cb?.()),
    },
  },
  downloads: {
    download: vi.fn(),
    onDeterminingFilename: { addListener: vi.fn() },
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
    sendMessage: vi.fn(),
  },
  scripting: {
    executeScript: vi.fn(),
  },
  sidePanel: {
    open: vi.fn(),
    setOptions: vi.fn(),
    setPanelBehavior: vi.fn(),
  },
  action: {
    onClicked: { addListener: vi.fn() },
  },
  declarativeNetRequest: {
    getSessionRules: vi.fn(async () => []),
    updateSessionRules: vi.fn(async () => {}),
    RuleActionType: { MODIFY_HEADERS: 'modifyHeaders' },
    HeaderOperation: { SET: 'set' },
    ResourceType: {
      IMAGE: 'image',
      MEDIA: 'media',
      XMLHTTPREQUEST: 'xmlhttprequest',
      OTHER: 'other',
      MAIN_FRAME: 'main_frame',
      SUB_FRAME: 'sub_frame',
    },
  },
} as unknown as typeof chrome;
