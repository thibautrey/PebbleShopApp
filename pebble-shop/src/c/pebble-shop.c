#include <pebble.h>

static Window *s_window;
static MenuLayer *s_menu_layer;

// Periods: 0=daily, 1=weekly, 2=monthly
enum { PERIOD_DAILY = 0, PERIOD_WEEKLY = 1, PERIOD_MONTHLY = 2, PERIOD_COUNT = 3 };

// Row state
typedef enum { ROW_IDLE = 0, ROW_LOADING = 1, ROW_OK = 2, ROW_ERROR = 3 } RowState;
static RowState s_row_state[PERIOD_COUNT];
static char s_row_subtitle[PERIOD_COUNT][32]; // value, loading, or error
static time_t s_last_updated = 0;             // last successful fetch time
static int s_selected = 0;

static const char *period_label(int p) {
  switch (p % 3) {
    case 0: return "Daily";
    case 1: return "Weekly";
    case 2: return "Monthly";
  }
  return "Daily";
}

static void menu_update_row(int period) {
  // Reload a single row
  if (!s_menu_layer) return;
#ifdef PBL_ROUND
  menu_layer_reload_data(s_menu_layer);
#else
  layer_mark_dirty(menu_layer_get_layer(s_menu_layer));
#endif
}

static void send_request_for(int period) {
  // Set loading state for the row
  s_row_state[period] = ROW_LOADING;
  snprintf(s_row_subtitle[period], sizeof(s_row_subtitle[period]), "Loading...");
  menu_update_row(period);

  DictionaryIterator *iter;
  AppMessageResult res = app_message_outbox_begin(&iter);
  if (res != APP_MSG_OK || !iter) {
    APP_LOG(APP_LOG_LEVEL_ERROR, "Outbox begin failed: %d", res);
    return;
  }

  dict_write_int32(iter, MESSAGE_KEY_period, (int32_t)period);
  dict_write_end(iter);

  res = app_message_outbox_send();
  if (res != APP_MSG_OK) {
    APP_LOG(APP_LOG_LEVEL_ERROR, "Outbox send failed: %d", res);
  } else {
    APP_LOG(APP_LOG_LEVEL_DEBUG, "Requested data for %s", period_label(period));
  }
}

static void inbox_received_callback(DictionaryIterator *iter, void *context) {
  int32_t period = s_selected;
  Tuple *period_t = dict_find(iter, MESSAGE_KEY_period);
  if (period_t) {
    period = period_t->value->int32 % PERIOD_COUNT;
    if (period < 0) period = 0;
  }
  Tuple *status = dict_find(iter, MESSAGE_KEY_status);
  Tuple *error = dict_find(iter, MESSAGE_KEY_error);
  Tuple *total = dict_find(iter, MESSAGE_KEY_total);
  Tuple *currency = dict_find(iter, MESSAGE_KEY_currency);

  if (error && error->type == TUPLE_CSTRING) {
    s_row_state[period] = ROW_ERROR;
    snprintf(s_row_subtitle[period], sizeof(s_row_subtitle[period]), "Error: %s", error->value->cstring);
    menu_update_row(period);
    return;
  }

  if (status && status->type == TUPLE_CSTRING && strcmp(status->value->cstring, "error") == 0) {
    s_row_state[period] = ROW_ERROR;
    snprintf(s_row_subtitle[period], sizeof(s_row_subtitle[period]), "Error");
    menu_update_row(period);
    return;
  }

  if (total && total->type == TUPLE_CSTRING && currency && currency->type == TUPLE_CSTRING) {
    s_row_state[period] = ROW_OK;
    snprintf(s_row_subtitle[period], sizeof(s_row_subtitle[period]), "%s %s", total->value->cstring, currency->value->cstring);
    s_last_updated = time(NULL);
    menu_update_row(period);
    return;
  }

  if (status && status->type == TUPLE_CSTRING) {
    snprintf(s_row_subtitle[period], sizeof(s_row_subtitle[period]), "Status: %s", status->value->cstring);
    menu_update_row(period);
  }
}

static void inbox_dropped_callback(AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_WARNING, "Inbox message dropped: %d", reason);
}

static void outbox_failed_callback(DictionaryIterator *iter, AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_WARNING, "Outbox send failed: %d", reason);
}

static void outbox_sent_callback(DictionaryIterator *iter, void *context) {
  APP_LOG(APP_LOG_LEVEL_DEBUG, "Outbox send success");
}

// MenuLayer callbacks
static uint16_t menu_get_num_sections_callback(MenuLayer *menu_layer, void *data) {
  return 1;
}

static uint16_t menu_get_num_rows_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
  return PERIOD_COUNT;
}

static int16_t menu_get_header_height_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
  return MENU_CELL_BASIC_HEADER_HEIGHT;
}

static void menu_draw_header_callback(GContext *ctx, const Layer *cell_layer, uint16_t section_index, void *data) {
  char header[32];
  if (s_last_updated == 0) {
    snprintf(header, sizeof(header), "Updated --:--");
  } else {
    struct tm *tm_info = localtime(&s_last_updated);
    char timebuf[16];
    strftime(timebuf, sizeof(timebuf), "%H:%M", tm_info);
    snprintf(header, sizeof(header), "Updated %s", timebuf);
  }
  menu_cell_basic_header_draw(ctx, cell_layer, header);
}

static void menu_draw_row_callback(GContext *ctx, const Layer *cell_layer, MenuIndex *cell_index, void *data) {
  const int row = cell_index->row;
  menu_cell_basic_draw(ctx, cell_layer, period_label(row), s_row_subtitle[row], NULL);
}

static void menu_select_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
  s_selected = cell_index->row;
  send_request_for(s_selected);
}

static void prv_window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);

  // Initialize row state
  for (int i = 0; i < PERIOD_COUNT; i++) {
    s_row_state[i] = ROW_IDLE;
    snprintf(s_row_subtitle[i], sizeof(s_row_subtitle[i]), "--");
  }

  s_menu_layer = menu_layer_create(bounds);
  menu_layer_set_callbacks(s_menu_layer, NULL, (MenuLayerCallbacks) {
    .get_num_sections = menu_get_num_sections_callback,
    .get_num_rows = menu_get_num_rows_callback,
    .get_header_height = menu_get_header_height_callback,
    .draw_header = menu_draw_header_callback,
    .draw_row = menu_draw_row_callback,
    .select_click = menu_select_callback,
  });
  menu_layer_set_click_config_onto_window(s_menu_layer, window);
  layer_add_child(window_layer, menu_layer_get_layer(s_menu_layer));
}

static void prv_window_unload(Window *window) {
  if (s_menu_layer) {
    menu_layer_destroy(s_menu_layer);
    s_menu_layer = NULL;
  }
}

static void prv_init(void) {
  s_window = window_create();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .load = prv_window_load,
    .unload = prv_window_unload,
  });

  const bool animated = true;
  window_stack_push(s_window, animated);

  // Setup AppMessage
  app_message_register_inbox_received(inbox_received_callback);
  app_message_register_inbox_dropped(inbox_dropped_callback);
  app_message_register_outbox_failed(outbox_failed_callback);
  app_message_register_outbox_sent(outbox_sent_callback);
  app_message_open(app_message_inbox_size_maximum(), app_message_outbox_size_maximum());

  // Kick off initial requests for all periods
  for (int p = 0; p < PERIOD_COUNT; p++) {
    send_request_for(p);
  }
}

static void prv_deinit(void) {
  window_destroy(s_window);
}

int main(void) {
  prv_init();

  APP_LOG(APP_LOG_LEVEL_DEBUG, "Done initializing, pushed window: %p", s_window);

  app_event_loop();
  prv_deinit();
}
