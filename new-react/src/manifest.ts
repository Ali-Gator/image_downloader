import packageData from '../package.json';

const isDev: boolean = process.env.NODE_ENV == 'development';

export default {
  name: `${isDev ? `0 ➡️ Dev ` : ''}__MSG_appName__`,
  description: '__MSG_shortDesc__',
  version: packageData.version,
  default_locale: 'en',
  manifest_version: 3,
  icons: {
    16: 'img/logo-16.png',
    32: 'img/logo-32.png',
    48: 'img/logo-48.png',
    64: 'img/logo-64.png',
    128: 'img/logo-128.png',
  },
  action: {
    default_icon: 'img/logo-48.png',
    default_popup: 'popup.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  permissions: [
    'scripting',
    'activeTab',
    'storage',
  ],
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/contentScript/content-script.ts'],
      run_at: 'document_end',
    },
  ],
  web_accessible_resources: [
    {
      resources: [
        'img/logo-16.png',
        'img/logo-32.png',
        'img/logo-48.png',
        'img/logo-64.png',
        'img/logo-128.png',
      ],
      matches: [],
    },
    {
      resources: ['icons/logo.png'],
      matches: ['<all_urls>'],
    },
  ],
  host_permissions: [
    '<all_urls>',
  ],
};
