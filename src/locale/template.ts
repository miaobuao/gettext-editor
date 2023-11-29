export default interface I18nTemplate {
  action: {
    add_locale: {
      import_from_file: string;
      create_from_template: string;
    };
    open_from_file: string;
    open_from_env: string;
    save_all: string;
    create_msg_id: string;
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
    save: string;
    undo: string;
    comment: string;
    reset: string;
    settings: string;
  };
  editor: {
    label: {
      source_string: string;
      target_string: string;
    };
    alert: {
      confirm_delete: string;
    };
  };
  settings: {
    modules: string;
  };
}
