import 'tailwindcss/tailwind.css';
import 'vfonts/Lato.css';
import 'vfonts/FiraCode.css';
import 'vuetify/styles';
import '@mdi/font/scss/materialdesignicons.scss';

import App from './App.vue';
import router from './router';
import { i18n } from './locale';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createVuetify } from 'vuetify';

const vuetify = createVuetify({});

createApp(App)
  .use(i18n)
  .use(router)
  .use(vuetify)
  .use(createPinia())
  .mount('#app');
