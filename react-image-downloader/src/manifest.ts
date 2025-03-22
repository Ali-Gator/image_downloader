import { defineManifest } from '@crxjs/vite-plugin';
import packageData from '../package.json';

const isDev: boolean = process.env.NODE_ENV === 'development';

export default defineManifest({
  name: `${isDev ? `0 ➡️ Dev ` : ''}__MSG_appName__`,
  description: '__MSG_shortDesc__',
  version: packageData.version,
  manifest_version: 3,
  default_locale: 'en',
  author: 'Image Downloader Team',
  icons: {
    16: 'icons/16.png',
    32: 'icons/32.png',
    48: 'icons/48.png',
    128: 'icons/128.png'
  },
  action: {
    default_popup: 'popup.html'
  },
  permissions: [
    "scripting",
    "activeTab",
    "downloads",
    "storage",
    "tabs"
  ],
  host_permissions: [
    "<all_urls>"
  ],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module'
  },
  commands: {
    "toggle-feature": {
      suggested_key: {
        default: "Ctrl+Shift+I",
        mac: "Command+Shift+I"
      },
      description: "Toggle image download panel"
    }
  }
}); 