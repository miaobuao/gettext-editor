import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import vuetify from 'vite-plugin-vuetify';
import { resolve } from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'vue-i18n',
        '@vueuse/head',
        '@vueuse/core',
      ],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [NaiveUiResolver()],
      dirs: ['src/components'],
      extensions: ['vue'],
      deep: true,
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
});
