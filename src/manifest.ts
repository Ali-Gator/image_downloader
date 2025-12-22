import { ManifestV3Export } from '@crxjs/vite-plugin';

import packageData from '../package.json';

const isDev: boolean = process.env.NODE_ENV == 'development';

const manifest: ManifestV3Export = {
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
  externally_connectable: {
    matches: ['https://onlineapp.pro/*', 'https://onlineapp.stream/*', 'https://onlineapp.live/*'],
  },
  permissions: ['activeTab', 'tabs', 'storage', 'downloads', 'declarativeNetRequest', 'scripting'],
  host_permissions: ['<all_urls>'],
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
  options_ui: {
    page: 'options.html',
    open_in_tab: true,
  },
  key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAid7c58IHBXEtwm6MCTdKuQIQ5eX3cXVor9a+dq4+NXvjQmlcK4se3wTCayUvW3RcBmP4DbWk+d1IlpwLfcJArrE13hLT+DZOQRo4W+pf20Z/lCsSkWCX9pri9pJDVNpdZub6SFrl5YdAUHYs5FW/JRMYWbycCGYx/rATWAHoSsM118V+A8CTC4RwO4L2+M6E6ehJNU1AbptsH24handeca3JSl5zThlZybXHXI7c4OVxEaLth4TryJhe/rQUya2+LcVbzcpY9t5pBRdWTO0B56ZH5ruYjrNF3K9oZzN0nahB36gXAb2rin73qFvVwHR6DplacVg9ROoCw1crqiTP8wIDAQAB"
};

export default manifest;
