interface LocaleStruct {
  action: {
    add_locale: {
      import_from_file: string;
      create_from_template: string;
    };
    open_from_file: string;
    open_from_env: string;
  };
  error: {
    locale_already_exists: string;
    path_not_exist: string;
    file_not_found_: string;
    file_not_found: string;
    reuqires_dir_instead_of_file: string;
    failed_to_import_locale: string;
    invalid_po_file: string;
    field_required: string;
  };
  common: {
    close: string;
    open: string;
    cancel: string;
    submit: string;
    previous: string;
    next: string;
    ok: string;
    locale: string;
    path: string;
  };
}

const en: LocaleStruct = {
  action: {
    add_locale: {
      import_from_file: 'Import from file',
      create_from_template: 'Create from template',
    },
    open_from_file: 'Open from file',
    open_from_env: 'Open from env',
  },
  error: {
    locale_already_exists: 'Locale already exists',
    path_not_exist: 'Path not exist',
    reuqires_dir_instead_of_file: 'Requires directory instead of file',
    file_not_found_: 'File not found: {path}',
    file_not_found: 'File not found',
    failed_to_import_locale: 'Failed to import locale',
    invalid_po_file: 'Invalid PO file: {path}',
    field_required: 'Field is required',
  },
  common: {
    close: 'Close',
    open: 'Open',
    cancel: 'Cancel',
    submit: 'Submit',
    next: 'Next',
    previous: 'Previous',
    ok: 'OK',
    locale: 'Locale',
    path: 'Path',
  },
};

const zh: LocaleStruct = {
  action: {
    add_locale: {
      import_from_file: '从文件导入',
      create_from_template: '从模板创建',
    },
    open_from_file: '从文件打开',
    open_from_env: '从环境变量打开',
  },
  error: {
    locale_already_exists: '本地化已存在',
    path_not_exist: '路径不存在',
    reuqires_dir_instead_of_file: '需要目录而不是文件',
    file_not_found_: '文件未找到：{path}',
    file_not_found: '文件未找到',
    failed_to_import_locale: '导入本地化文件失败',
    invalid_po_file: '无效的 PO 文件：{path}',
    field_required: '字段为必填项',
  },
  common: {
    close: '关闭',
    open: '打开',
    cancel: '取消',
    submit: '提交',
    next: '下一个',
    previous: '上一个',
    ok: '确定',
    locale: '语言',
    path: '路径',
  },
};

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  globalInjection: true,
  messages: {
    zh,
    en,
  },
}));
