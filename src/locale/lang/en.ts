import I18nTemplate from '../template';

export const en: I18nTemplate = {
  action: {
    add_locale: {
      import_from_file: 'Import from file',
      create_from_template: 'Create from template',
    },
    save_all: 'Save all',
    open_from_file: 'Open from file',
    open_from_env: 'Open from env',
    create_msg_id: 'Create msg id',
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
    undo: 'Undo',
    save: 'Save',
    comment: 'Comment',
    reset: 'Reset',
    settings: 'Settings',
  },
  editor: {
    label: {
      source_string: 'Source string',
      target_string: 'Target string',
    },
    alert: {
      confirm_delete: 'Are you sure you want to delete?',
    },
  },
  settings: {
    modules: 'Modules',
  },
};
