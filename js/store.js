/*!
 * store.js — 数据层
 * 负责：localStorage 读写、订阅通知、导出/导入/清空、保存状态
 * 依赖：core.js（Core）
 */
(function (root, factory) {
  var api = factory(root);
  root.Store = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var Core = root.Core;
  var KEY = 'myapp.data.v1';
  var ADAPTER = null;

  var state = null;
  var listeners = [];
  var lastSaved = null;
  var lastError = null;

  function backend() {
    if (ADAPTER) return ADAPTER;
    try {
      return root.localStorage || null;
    } catch (e) {
      return null;
    }
  }

  function setBackend(adapter) {
    ADAPTER = adapter || null;
    return API;
  }

  function storageAvailable() {
    var b = backend();
    if (!b) return false;
    try {
      var k = '__myapp_probe__';
      b.setItem(k, '1');
      b.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  function emit(evt) {
    listeners.slice().forEach(function (fn) {
      try { fn(evt); } catch (e) { /* 单个订阅者异常不影响其他人 */ }
    });
  }

  function load() {
    var b = backend();
    var raw = null;
    try { raw = b ? b.getItem(KEY) : null; } catch (e) { raw = null; }

    var parsed = null;
    if (raw) {
      try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
    }
    var payload = parsed && parsed.data ? parsed.data : parsed;
    state = Core.normalizeData(payload);
    lastSaved = (parsed && parsed.savedAt) || state.meta.updatedAt || null;
    lastError = null;
    emit({ type: 'load', key: KEY });
    return state;
  }

  function get() {
    if (!state) load();
    return state;
  }

  function serialize() {
    return JSON.stringify({
      app: Core.APP_ID,
      schema: Core.SCHEMA,
      savedAt: state.meta.updatedAt,
      data: state
    });
  }

  function save(reason) {
    if (!state) state = Core.defaultData();
    state.meta.updatedAt = Core.nowISO();
    lastSaved = state.meta.updatedAt;
    var b = backend();
    var ok = true;
    if (!b) {
      ok = false;
      lastError = new Error('当前浏览器不允许写入本地存储');
    } else {
      try {
        b.setItem(KEY, serialize());
        lastError = null;
      } catch (e) {
        ok = false;
        lastError = e;
      }
    }
    emit({ type: 'save', reason: reason || 'auto', ok: ok, error: lastError, at: lastSaved });
    return ok;
  }

  /** 修改并保存：mutator 直接改 state */
  function update(mutator, reason) {
    var s = get();
    var result = mutator ? mutator(s) : undefined;
    save(reason || 'update');
    return result;
  }

  function subscribe(fn) {
    if (typeof fn !== 'function') return function () {};
    listeners.push(fn);
    return function () {
      var i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  function exportJSON() {
    return JSON.stringify(Core.exportPayload(get()), null, 2);
  }

  /** 导入失败时抛错，且不修改现有数据 */
  function importJSON(text) {
    var checked = Core.validateImport(text);
    if (!checked.ok) {
      var err = new Error(checked.error);
      err.code = 'IMPORT_INVALID';
      throw err;
    }
    state = checked.data;
    var ok = save('import');
    if (!ok) throw new Error('导入成功但写入本地存储失败：' + (lastError && lastError.message));
    emit({ type: 'import' });
    return state;
  }

  function reset() {
    state = Core.defaultData();
    save('reset');
    emit({ type: 'reset' });
    return state;
  }

  var API = {
    KEY: KEY,
    load: load,
    get: get,
    save: save,
    update: update,
    subscribe: subscribe,
    exportJSON: exportJSON,
    importJSON: importJSON,
    reset: reset,
    setBackend: setBackend,
    storageAvailable: storageAvailable,
    lastSavedAt: function () { return lastSaved; },
    lastError: function () { return lastError; }
  };

  return API;
});
