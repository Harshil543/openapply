import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  hooks: {
    'build:publicAssets': (wxt, files) => {
      files.push(
        {
          absoluteSrc: resolve('assets/icons/icon16.png'),
          relativeDest: 'assets/icons/icon16.png',
        },
        {
          absoluteSrc: resolve('assets/icons/icon48.png'),
          relativeDest: 'assets/icons/icon48.png',
        },
        {
          absoluteSrc: resolve('assets/icons/icon128.png'),
          relativeDest: 'assets/icons/icon128.png',
        },
        {
          absoluteSrc: resolve('assets/icons/favicon.png'),
          relativeDest: 'assets/icons/favicon.png',
        },
      );
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'OpenApply — AI Job Assistant',
    description:
      'Find, score, and prepare job applications with privacy-first AI.',
    version: '1.0.0',
    permissions: ['storage', 'activeTab', 'scripting', 'sidePanel', 'contextMenus', 'alarms'],
    host_permissions: [
      'https://www.linkedin.com/*',
      'https://boards.greenhouse.io/*',
      'https://jobs.lever.co/*',
    ],
    side_panel: {
      default_path: 'sidepanel/index.html',
    },
    icons: {
      16: 'assets/icons/icon16.png',
      32: 'assets/icons/favicon.png',
      48: 'assets/icons/icon48.png',
      128: 'assets/icons/icon128.png',
    },
    action: {
      default_popup: 'popup.html',
      default_icon: {
        16: 'assets/icons/icon16.png',
        48: 'assets/icons/icon48.png',
      },
    },
    options_page: 'options.html',
    commands: {
      'open-side-panel': {
        suggested_key: {
          default: 'Ctrl+Shift+J',
          mac: 'Command+Shift+J',
        },
        description: 'Open OpenApply side panel',
      },
      'analyze-job': {
        suggested_key: {
          default: 'Ctrl+Shift+A',
          mac: 'Command+Shift+A',
        },
        description: 'Analyze current job posting',
      },
      'autofill-form': {
        suggested_key: {
          default: 'Ctrl+Shift+F',
          mac: 'Command+Shift+F',
        },
        description: 'Autofill application form',
      },
    },
  },
});
