import I18nTemplate from '../template';

export const zh: I18nTemplate = {
  action: {
    add_locale: {
      import_from_file: '从文件导入',
      create_from_template: '从模板创建',
    },
    save_all: '保存所有更改',
    open_from_file: '从文件打开',
    open_from_env: '从环境变量打开',
    create_msg_id: '创建MsgID',
  },
  error: {
    locale_already_exists: '本地化已存在',
    path_not_exist: '路径不存在',
    reuqires_dir_instead_of_file: '需要目录而不是文件',
    file_not_found_: '文件未找到：{path}',
    file_not_found: '文件未找到',
    file_already_exists: '文件已存在',
    failed_to_import_locale: '导入本地化文件失败',
    invalid_po_file: '无效的 PO 文件：{path}',
    field_required: '字段为必填项',
    locale_not_found: '未找到本地化配置',
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
    undo: '撤销',
    save: '保存',
    comment: '注释',
    reset: '重置',
    settings: '设置',
    actions: '操作',
  },
  editor: {
    label: {
      source_string: '源字符串',
      target_string: '目标字符串',
    },
    alert: {
      confirm_delete: '确定要删除吗？',
    },
  },
  settings: {
    modules: '模块',
  },
};
