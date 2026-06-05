import { defineManifest } from '@crxjs/vite-plugin';

const icons = {
  '16': 'icons/16.png',
  '32': 'icons/32.png',
  '48': 'icons/48.png',
  '128': 'icons/128.png',
};

export default defineManifest({
  manifest_version: 3,
  name: 'Jaswinder',
  version: '0.1.0',
  description: 'Manage localStorage feature flags and apply them to the active tab.',
  action: {
    default_popup: 'index.html',
    default_title: 'Jaswinder',
    default_icon: icons,
  },
  icons,
  permissions: ['storage', 'scripting', 'activeTab', 'tabs'],
});
