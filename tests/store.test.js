'use strict';
/**
 * store.test.js — 数据层测试
 * 覆盖：默认加载、持久化、重新加载、导出/导入往返、非法导入保护、存储异常、订阅
 * 运行：node --test tests/
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const Core = require('../js/core.js');
const Store = require('../js/store.js');

function makeBackend(opts = {}) {
  const map = new Map();
  let failNext = false;
  return {
    map,
    failNextSet() { failNext = true; },
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) {
      if (opts.readonly) throw new Error('QuotaExceededError');
      if (failNext) { failNext = false; throw new Error('QuotaExceededError: simulated'); }
      map.set(k, String(v));
    },
    removeItem(k) { map.delete(k); }
  };
}

function freshStore(opts) {
  const backend = makeBackend(opts);
  Store.setBackend(backend);
  Store.load();
  return { backend, store: Store };
}

test('首次加载：无数据时生成完整默认结构', () => {
  const { store } = freshStore();
  const s = store.get();
  assert.equal(s.settings.theme, 'light');
  assert.deepEqual(s.plans, {});
  assert.deepEqual(s.media.posts, []);
  assert.equal(s.store, undefined);
});

test('update：修改后立即写入存储，重新 load 数据仍在', () => {
  const { backend, store } = freshStore();
  store.update((s) => {
    s.plans['2024-05-15'] = { items: [{ id: 'x', title: '写测试', done: false, priority: 'high' }], review: '' };
  }, 'test');

  const raw = backend.getItem(Store.KEY);
  assert.ok(raw, '应写入 localStorage');
  const saved = JSON.parse(raw);
  assert.equal(saved.app, 'myapp');
  assert.equal(saved.data.plans['2024-05-15'].items[0].title, '写测试');

  // 模拟刷新页面
  const backend2 = { getItem: (k) => backend.map.get(k), setItem: (k, v) => backend.map.set(k, v), removeItem: (k) => backend.map.delete(k) };
  Store.setBackend(backend2);
  const reloaded = Store.load();
  assert.equal(reloaded.plans['2024-05-15'].items.length, 1);
  assert.equal(reloaded.plans['2024-05-15'].items[0].title, '写测试');
});

test('save：返回 true 并记录 lastSavedAt', () => {
  const { store } = freshStore();
  const ok = store.save('manual');
  assert.equal(ok, true);
  assert.ok(store.lastSavedAt());
  assert.equal(store.lastError(), null);
});

test('save：存储抛异常时返回 false 且记录错误，不崩溃', () => {
  const { backend, store } = freshStore();
  backend.failNextSet();
  const ok = store.save('manual');
  assert.equal(ok, false);
  assert.ok(store.lastError());
});

test('save：存储完全不可用时返回 false', () => {
  Store.setBackend({ getItem: () => null, setItem: () => { throw new Error('blocked'); }, removeItem: () => {} });
  Store.load();
  assert.equal(Store.save('manual'), false);
  assert.equal(Store.storageAvailable(), false);
});

test('storageAvailable：可用/不可用两种情况', () => {
  freshStore();
  assert.equal(Store.storageAvailable(), true);
  Store.setBackend(makeBackend({ readonly: true }));
  assert.equal(Store.storageAvailable(), false);
});

test('网络无关：localStorage 里的内容可被 JSON 解析且结构完整', () => {
  const { backend, store } = freshStore();
  store.update((s) => { s.notes.push({ id: 'n1', text: '备忘录', pinned: true, createdAt: Core.nowISO() }); });
  const parsed = JSON.parse(backend.getItem(Store.KEY));
  ['settings', 'notes', 'plans', 'media', 'dev', 'consult', 'fitness', 'diet', 'games']
    .forEach((k) => assert.ok(parsed.data[k] !== undefined, 'missing ' + k));
});

test('导出 → 清空 → 导入：数据完全恢复', () => {
  const { store } = freshStore();
  store.update((s) => {
    s.plans['2024-05-15'] = { items: [{ id: 'a', title: 'A', done: true, priority: 'mid' }], review: '复盘' };
    s.dev.items.push({ id: 'd1', title: '任务一', projectId: '', type: 'task', status: 'doing', priority: 'mid' });
    s.consult.clients.push({ id: 'c1', name: '客户甲', stage: 'signed' });
    s.fitness.sessions.push({ id: 'f1', date: '2024-05-15', part: 'back', exercise: '划船', sets: 4, reps: 10, weight: 40 });
    s.diet.meals.push({ id: 'm1', date: '2024-05-15', type: 'lunch', name: '饭', kcal: 600 });
    s.games.games.push({ id: 'g1', name: '游戏', platform: 'PC', status: 'playing' });
  });

  const backup = store.exportJSON();
  const before = {
    plan: store.get().plans['2024-05-15'].items.length,
    dev: store.get().dev.items.length,
    clients: store.get().consult.clients.length,
    fit: store.get().fitness.sessions.length,
    meals: store.get().diet.meals.length,
    games: store.get().games.games.length
  };

  store.reset();
  assert.equal(store.get().dev.items.length, 0);

  store.importJSON(backup);
  const after = store.get();
  assert.equal(after.plans['2024-05-15'].items.length, before.plan);
  assert.equal(after.plans['2024-05-15'].review, '复盘');
  assert.equal(after.dev.items.length, before.dev);
  assert.equal(after.dev.items[0].status, 'doing');
  assert.equal(after.consult.clients.length, before.clients);
  assert.equal(after.fitness.sessions.length, before.fit);
  assert.equal(after.diet.meals.length, before.meals);
  assert.equal(after.games.games.length, before.games);
});

test('导入非法内容：抛错且原数据不被破坏', () => {
  const { store } = freshStore();
  store.update((s) => { s.notes.push({ id: 'n1', text: '重要备忘', pinned: false, createdAt: Core.nowISO() }); });

  assert.throws(() => store.importJSON('not-json'), /JSON/);
  assert.throws(() => store.importJSON(JSON.stringify({ app: 'other', data: { notes: [] } })), /备份/);
  assert.throws(() => store.importJSON(JSON.stringify({ app: 'myapp', data: {} })), /结构/);

  assert.equal(store.get().notes.length, 1);
  assert.equal(store.get().notes[0].text, '重要备忘');
});

test('导入失败时错误带 IMPORT_INVALID 标记', () => {
  const { store } = freshStore();
  try {
    store.importJSON('{bad');
    assert.fail('应该抛错');
  } catch (e) {
    assert.equal(e.code, 'IMPORT_INVALID');
  }
});

test('reset：恢复默认结构并写入存储', () => {
  const { backend, store } = freshStore();
  store.update((s) => { s.dev.items.push({ id: 'd', title: 'x', status: 'todo', type: 'task' }); });
  store.reset();
  assert.equal(store.get().dev.items.length, 0);
  const saved = JSON.parse(backend.getItem(Store.KEY));
  assert.deepEqual(saved.data.dev.items, []);
});

test('subscribe：保存时收到事件，取消订阅后不再收到', () => {
  const { store } = freshStore();
  const events = [];
  const off = store.subscribe((e) => events.push(e));
  store.update((s) => { s.notes.push({ id: 'n', text: 'x', pinned: false, createdAt: Core.nowISO() }); }, 'test');
  assert.ok(events.some((e) => e.type === 'save' && e.ok === true));
  const count = events.length;
  off();
  store.save('manual');
  assert.equal(events.length, count);
});

test('订阅者抛异常不影响其他订阅者与保存流程', () => {
  const { store } = freshStore();
  let called = 0;
  store.subscribe(() => { throw new Error('boom'); });
  store.subscribe(() => { called += 1; });
  store.save('manual');
  assert.equal(called, 1);
});

test('损坏的存储内容：回退到默认数据且不抛错', () => {
  const backend = makeBackend();
  backend.map.set(Store.KEY, '{broken json');
  Store.setBackend(backend);
  const s = Store.load();
  assert.equal(s.dev.items.length, 0);
  assert.equal(s.settings.theme, 'light');
});
