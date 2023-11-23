export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      action: {
        add_locale: {
          import_from_file: 'Import from file',
          create_from_template: 'Create from template',
        },
      },
    },
    zh: {
      action: {
        add_locale: {
          import_from_file: '从文件导入',
          create_from_template: '从模板创建',
        },
      },
    },
  },
}));
