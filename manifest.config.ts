import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Jaswinder',
  version: '0.1.0',
  description: 'Manage localStorage feature flags and apply them to the active tab.',
  action: {
    default_popup: 'index.html',
    default_title: 'Jaswinder',
  },
  permissions: ['storage', 'scripting', 'activeTab', 'tabs'],
});
