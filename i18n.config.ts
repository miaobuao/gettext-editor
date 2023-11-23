export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  globalInjection: true,
  messages: {
    en: {
      action: {
        add_locale: {
          import_from_file: 'Import from file',
          create_from_template: 'Create from template',
        },
        open_from_file: 'Open from file',
        open_from_env: 'Open from env',
      },
      error: {
        file_not_found: 'File not found: {path}',
        failed_to_import_locale: 'Failed to import locale',
        invalid_po_file: 'Invalid PO file: {path}',
      },
    },
    zh: {
      action: {
        add_locale: {
          import_from_file: '从文件导入',
          create_from_template: '从模板创建',
        },
        open_from_file: '从文件打开',
        open_from_env: '从环境变量打开',
      },
      error: {
        file_not_found: '找不到文件: {path}',
        failed_to_import_locale: '导入语言失败',
        invalid_po_file: '无效的 PO 文件: {path}',
      },
    },
  },
}));
