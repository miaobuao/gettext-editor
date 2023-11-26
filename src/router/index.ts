import { createRouter, createWebHistory } from 'vue-router';

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'index',
      component: () => import('../App.vue'),
      children: [
        {
          path: '',
          name: 'file-picker',
          component: () => import('../pages/index.vue'),
        },
        {
          path: 'editor',
          name: 'editor',
          component: () => import('../pages/editor.vue'),
          children: [
            {
              path: '',
              name: 'editor-settings',
              component: () => import('../pages/editor/settings.vue'),
            },
            {
              path: ':locale',
              name: 'editor-locale',
              component: () => import('../pages/editor/locale.vue'),
            },
          ],
        },
      ],
    },
  ],
});
