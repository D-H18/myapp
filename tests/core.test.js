'use strict';
/**
 * core.test.js — 纯逻辑层测试
 * 覆盖：日期工具、统计口径（各模块）、数据规范化、备份校验
 * 运行：node --test tests/
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../js/core.js');

/* ---------------- 日期 ---------------- */

test('日期：ymd 输出补零的本地日期', () => {
  assert.equal(Core.ymd(new Date(2024, 0, 5)), '2024-01-05');
  assert.equal(Core.ymd('2024-11-30'), '2024-11-30');
});

test('日期：addDays 支持跨月、跨年、负向', () => {
  assert.equal(Core.addDays('2024-01-31', 1), '2024-02-01');
  assert.equal(Core.addDays('2024-02-28', 1), '2024-02-29'); // 闰年
  assert.equal(Core.addDays('2023-02-28', 1), '2023-03-01');
  assert.equal(Core.addDays('2024-01-01', -1), '2023-12-31');
  assert.equal(Core.addDays('2024-05-15', 30), '2024-06-14');
});

test('日期：diffDays 计算天数差', () => {
  assert.equal(Core.diffDays('2024-05-01', '2024-05-15'), 14);
  assert.equal(Core.diffDays('2024-05-15', '2024-05-01'), -14);
  assert.equal(Core.diffDays('2024-05-15', '2024-05-15'), 0);
});

test('日期：startOfWeek 支持周一/周日为起始', () => {
  // 2024-05-15 是周三
  assert.equal(Core.startOfWeek('2024-05-15', 1), '2024-05-13');
  assert.equal(Core.startOfWeek('2024-05-15', 0), '2024-05-12');
  // 周日当天，周一为起始时应回到 6 天前
  assert.equal(Core.startOfWeek('2024-05-19', 1), '2024-05-13');
  assert.equal(Core.startOfWeek('2024-05-19', 0), '2024-05-19');
});

test('日期：weekDates 返回 7 天且连续', () => {
  const w = Core.weekDates('2024-05-15', 1);
  assert.equal(w.length, 7);
  assert.equal(w[0], '2024-05-13');
  assert.equal(w[6], '2024-05-19');
  for (let i = 1; i < 7; i++) assert.equal(Core.diffDays(w[i - 1], w[i]), 1);
});

test('日期：monthGrid 覆盖整月且补齐前后，格子数为 7 的倍数', () => {
  const grid = Core.monthGrid(2024, 2, 1); // 闰年 2 月，共 29 天
  assert.equal(grid.length % 7, 0);
  assert.equal(grid.filter((c) => c.inMonth).length, 29);
  assert.equal(grid[0].date, '2024-01-29');
  const cells = Core.monthGrid(2024, 5, 1);
  assert.equal(cells.filter((c) => c.inMonth).length, 31);
  assert.ok(cells.every((c) => c.day >= 1 && c.day <= 31));
});

test('日期：addMonths 跨年', () => {
  assert.equal(Core.addMonths('2024-12', 1), '2025-01');
  assert.equal(Core.addMonths('2024-01', -1), '2023-12');
  assert.equal(Core.addMonths('2024-05', 7), '2024-12');
});

test('格式化：数字/金额/百分比/时长', () => {
  assert.equal(Core.fmtNum(999), '999');
  assert.equal(Core.fmtNum(12345), '1.2万');
  assert.equal(Core.fmtNum(0), '0');
  assert.equal(Core.fmtMoney(1200), '¥1,200');
  assert.equal(Core.fmtPct(12.34, 1), '12.3%');
  assert.equal(Core.fmtDuration(45), '45 分钟');
  assert.equal(Core.fmtDuration(90), '1 小时 30 分');
  assert.equal(Core.fmtDuration(120), '2 小时');
});

/* ---------------- 今日计划 ---------------- */

test('planStats：完成率四舍五入，空计划不除零', () => {
  const s = Core.planStats({ items: [{ done: true }, { done: true }, { done: false, priority: 'high' }] });
  assert.deepEqual({ total: s.total, done: s.done, open: s.open, rate: s.rate, highOpen: s.highOpen },
    { total: 3, done: 2, open: 1, rate: 67, highOpen: 1 });
  assert.equal(Core.planStats(null).rate, 0);
  assert.equal(Core.planStats({ items: [] }).total, 0);
});

/* ---------------- 自媒体 ---------------- */

const MEDIA_POSTS = [
  { id: 'p1', title: '视频A', platform: '抖音', stage: 'published', publishDate: '2024-05-01', views: 1000, likes: 100, comments: 10, shares: 5, saves: 5, followers: 30 },
  { id: 'p2', title: '视频B', platform: 'B站', stage: 'published', publishDate: '2024-05-10', views: 500, likes: 20, comments: 5, shares: 1, saves: 4, followers: 10 },
  { id: 'p3', title: '视频C', platform: '抖音', stage: 'published', publishDate: '2024-01-01', views: 9999, likes: 1, comments: 1, shares: 1, saves: 1, followers: 1 },
  { id: 'p4', title: '想法D', platform: '抖音', stage: 'idea', publishDate: '', views: 0, likes: 0, comments: 0, shares: 0, saves: 0, followers: 0 }
];

test('mediaStats：只统计区间内的已发布内容', () => {
  const s = Core.mediaStats(MEDIA_POSTS, { today: '2024-05-20', days: 30 });
  assert.equal(s.count, 2);              // p3 在区间外，p4 未发布
  assert.equal(s.totalPublished, 3);
  assert.equal(s.views, 1500);
  assert.equal(s.likes, 120);
  assert.equal(s.followers, 40);
  assert.equal(s.avgViews, 750);
  assert.equal(s.from, '2024-04-21');
  assert.equal(s.to, '2024-05-20');
});

test('mediaStats：互动率按 (赞+评+转+藏)/播放 计算并保留一位', () => {
  const s = Core.mediaStats(MEDIA_POSTS, { today: '2024-05-20', days: 30 });
  // (120 + 15 + 6 + 9) / 1500 = 10%
  assert.equal(s.engagement, 10);
  const zero = Core.mediaStats([], { today: '2024-05-20' });
  assert.equal(zero.engagement, 0);      // 播放为 0 时不产生 NaN
  assert.equal(zero.avgViews, 0);
});

test('mediaStats：趋势序列按日期升序，Top5 按播放降序，平台聚合正确', () => {
  const s = Core.mediaStats(MEDIA_POSTS, { today: '2024-05-20', days: 30 });
  assert.deepEqual(s.series.map((x) => x.date), ['2024-05-01', '2024-05-10']);
  assert.deepEqual(s.series.map((x) => x.value), [1000, 500]);
  assert.equal(s.top.length, 2);
  assert.equal(s.top[0].title, '视频A');
  assert.equal(s.byPlatform[0].platform, '抖音');
  assert.equal(s.byPlatform[0].views, 1000);
  assert.equal(s.byPlatform[0].count, 1);
  assert.equal(s.byStage.published, 3);
  assert.equal(s.byStage.idea, 1);
});

test('mediaStats：Top5 最多 5 条', () => {
  const many = Array.from({ length: 8 }, (_, i) => ({
    id: 'x' + i, title: 't' + i, platform: '抖音', stage: 'published',
    publishDate: '2024-05-0' + (i % 9 + 1), views: i * 100
  }));
  const s = Core.mediaStats(many, { today: '2024-05-20', days: 30 });
  assert.equal(s.top.length, 5);
  assert.equal(s.top[0].value, 700);
});

/* ---------------- 开发工作 ---------------- */

const DEV_ITEMS = [
  { id: 't1', title: '修 bug', projectId: 'a', type: 'bug', status: 'todo', priority: 'high', due: '2024-05-10', estimate: 3, doneAt: '' },
  { id: 't2', title: '写文档', projectId: 'a', type: 'task', status: 'doing', priority: 'mid', due: '2024-05-16', estimate: 2, doneAt: '' },
  { id: 't3', title: '重构', projectId: 'b', type: 'debt', status: 'review', priority: 'low', due: '', estimate: 5, doneAt: '' },
  { id: 't4', title: '上线', projectId: 'a', type: 'feature', status: 'done', priority: 'high', due: '', estimate: 1, doneAt: '2024-05-14T09:00:00.000Z' },
  { id: 't5', title: '旧任务', projectId: 'b', type: 'feature', status: 'done', priority: 'mid', due: '', estimate: 1, doneAt: '2024-04-01T09:00:00.000Z' }
];

test('devStats：各状态计数、逾期与本周完成', () => {
  const s = Core.devStats(DEV_ITEMS, { today: '2024-05-15', weekStart: 1 });
  assert.equal(s.total, 5);
  assert.equal(s.todo, 1);
  assert.equal(s.doing, 1);
  assert.equal(s.review, 1);
  assert.equal(s.done, 2);
  assert.equal(s.open, 3);
  assert.equal(s.overdue, 1);          // t1 截止 05-10 < 05-15
  assert.equal(s.dueSoon, 1);          // t2 截止 05-16 在 3 天内
  assert.equal(s.doneThisWeek, 1);     // t4 完成于本周（05-13 起），t5 不是
  assert.equal(s.estimateOpen, 10);    // 3 + 2 + 5
  assert.equal(s.byType.bug, 1);
  assert.equal(s.byType.feature, 2);
  assert.equal(s.rate, 40);
});

test('devStats：已完成任务的过期截止日不算逾期', () => {
  const s = Core.devStats([{ status: 'done', due: '2020-01-01', type: 'task', doneAt: '2024-05-15T00:00:00.000Z' }], { today: '2024-05-15' });
  assert.equal(s.overdue, 0);
});

/* ---------------- 咨询工作 ---------------- */

const CLIENTS = [
  { id: 'c1', name: '张三', stage: 'signed' },
  { id: 'c2', name: '李四', stage: 'talking' },
  { id: 'c3', name: '王五', stage: 'delivering' },
  { id: 'c4', name: '赵六', stage: 'lost' }
];
const SESSIONS = [
  { id: 's1', clientId: 'c1', date: '2024-05-08', minutes: 60, fee: 800 },
  { id: 's2', clientId: 'c1', date: '2024-05-15', minutes: 90, fee: 1200 },
  { id: 's3', clientId: 'c3', date: '2024-04-02', minutes: 30, fee: 300 }
];

test('consultStats：阶段计数、活跃客户数与收入统计', () => {
  const s = Core.consultStats(CLIENTS, SESSIONS, { today: '2024-05-20' });
  assert.equal(s.totalClients, 4);
  assert.equal(s.byStage.signed, 1);
  assert.equal(s.byStage.lost, 1);
  assert.equal(s.active, 3);            // talking + signed + delivering
  assert.equal(s.signed, 2);            // signed(张三) + delivering(王五) + done(0)
  assert.equal(s.revenue, 2300);
  assert.equal(s.monthRevenue, 2000);   // 5 月两场
  assert.equal(s.minutes, 180);
  assert.equal(s.hours, 3);
  assert.equal(s.sessionCount, 3);
  assert.equal(s.monthSessions, 2);
  assert.equal(s.avgFee, 767);          // 2300/3 四舍五入
  assert.equal(s.perClient.c1.count, 2);
  assert.equal(s.perClient.c1.fee, 2000);
  assert.equal(s.perClient.c1.lastDate, '2024-05-15');
});

test('consultStats：无数据时不出现 NaN', () => {
  const s = Core.consultStats([], [], { today: '2024-05-20' });
  assert.equal(s.revenue, 0);
  assert.equal(s.avgFee, 0);
  assert.equal(s.active, 0);
});

/* ---------------- 健身 ---------------- */

const FIT = [
  { id: 'f1', date: '2024-05-15', part: 'chest', exercise: '卧推', sets: 4, reps: 8, weight: 60 },
  { id: 'f2', date: '2024-05-15', part: 'chest', exercise: '飞鸟', sets: 3, reps: 12, weight: 15 },
  { id: 'f3', date: '2024-05-14', part: 'legs', exercise: '深蹲', sets: 5, reps: 5, weight: 80 },
  { id: 'f4', date: '2024-05-12', part: 'back', exercise: '划船', sets: 4, reps: 10, weight: 50 }
];

test('fitnessStats：按日聚合部位与组数', () => {
  const s = Core.fitnessStats(FIT, { today: '2024-05-15' });
  assert.equal(s.totalSessions, 4);
  assert.equal(s.totalDays, 3);
  assert.equal(s.monthDays, 3);
  assert.equal(s.byDate['2024-05-15'].count, 2);
  assert.equal(s.byDate['2024-05-15'].sets, 7);
  assert.equal(s.byDate['2024-05-15'].parts.chest, 7);
  assert.equal(s.byDate['2024-05-14'].parts.legs, 5);
});

test('fitnessStats：连续打卡遇到断点即停止', () => {
  const s = Core.fitnessStats(FIT, { today: '2024-05-15' });
  assert.equal(s.streak, 2);           // 05-15、05-14 连续，05-13 断开
  const t = Core.fitnessStats(FIT, { today: '2024-05-16' });
  assert.equal(t.streak, 2);           // 今天没练，从昨天往前算
  const none = Core.fitnessStats(FIT, { today: '2024-05-20' });
  assert.equal(none.streak, 0);
});

test('fitnessStats：部位分布按组数降序，容量 = 组×次×重量', () => {
  const s = Core.fitnessStats(FIT, { today: '2024-05-15' });
  assert.equal(s.byPart[0].part, 'chest');
  assert.equal(s.byPart[0].sets, 7);
  assert.equal(s.byPart[0].volume, 4 * 8 * 60 + 3 * 12 * 15);
  assert.equal(s.volume, 4 * 8 * 60 + 3 * 12 * 15 + 5 * 5 * 80 + 4 * 10 * 50);
  assert.equal(s.weekDays, 2);         // 05-15、05-14 在本周（05-13 起），05-12 是上周日
});

/* ---------------- 饮食 ---------------- */

const MEALS = [
  { id: 'm1', date: '2024-05-15', type: 'breakfast', name: '燕麦', kcal: 300, protein: 10, carbs: 50, fat: 5 },
  { id: 'm2', date: '2024-05-15', type: 'lunch', name: '鸡胸饭', kcal: 500, protein: 40, carbs: 60, fat: 8 },
  { id: 'm3', date: '2024-05-14', type: 'lunch', name: '面条', kcal: 700, protein: 20, carbs: 90, fat: 15 }
];

test('dietDay：汇总热量与三大营养素、剩余与百分比', () => {
  const t = { kcal: 2000, protein: 120, carbs: 230, fat: 65, water: 2000 };
  const d = Core.dietDay(MEALS, '2024-05-15', t, 1000);
  assert.equal(d.count, 2);
  assert.equal(d.kcal, 800);
  assert.equal(d.protein, 50);
  assert.equal(d.carbs, 110);
  assert.equal(d.fat, 13);
  assert.equal(d.remaining, 1200);
  assert.equal(d.pct, 40);
  assert.equal(d.proteinPct, 42);
  assert.equal(d.waterPct, 50);
  assert.equal(d.byMeal.lunch.length, 1);
  assert.equal(d.byMeal.dinner.length, 0);
});

test('dietDay：目标为 0 时不除零，超量时进度封顶 100', () => {
  const d = Core.dietDay(MEALS, '2024-05-15', { kcal: 0, protein: 0, carbs: 0, fat: 0, water: 0 }, 0);
  assert.equal(d.pct, 0);
  assert.equal(d.waterPct, 0);
  const over = Core.dietDay(MEALS, '2024-05-15', { kcal: 500, protein: 120, carbs: 230, fat: 65, water: 2000 }, 0);
  assert.equal(over.pct, 100);
  assert.equal(over.remaining, -300);
});

test('dietRange：只按有记录的天数算日均', () => {
  const r = Core.dietRange(MEALS, ['2024-05-13', '2024-05-14', '2024-05-15'], {});
  assert.equal(r.loggedDays, 2);
  assert.equal(r.totalKcal, 1500);
  assert.equal(r.avgKcal, 750);
});

/* ---------------- 游戏 ---------------- */

const GAMES = [
  { id: 'g1', name: '塞尔达', platform: 'Switch', status: 'playing', rating: 9, hours: 30 },
  { id: 'g2', name: '黑神话', platform: 'PC', status: 'wish', rating: 0, hours: 0 },
  { id: 'g3', name: '哈迪斯', platform: 'PC', status: 'done', rating: 10, hours: 20 }
];
const GAME_SESSIONS = [
  { id: 'gs1', gameId: 'g1', date: '2024-05-15', minutes: 90 },
  { id: 'gs2', gameId: 'g1', date: '2024-05-14', minutes: 60 },
  { id: 'gs3', gameId: 'g3', date: '2024-04-01', minutes: 120 }
];

test('gamesStats：状态计数、本周与总时长、平台聚合', () => {
  const s = Core.gamesStats(GAMES, GAME_SESSIONS, { today: '2024-05-15', weekStart: 1 });
  assert.equal(s.total, 3);
  assert.equal(s.byStatus.playing, 1);
  assert.equal(s.byStatus.wish, 1);
  assert.equal(s.byStatus.done, 1);
  assert.equal(s.totalMinutes, 270);
  assert.equal(s.totalHours, 4.5);
  assert.equal(s.weekMinutes, 150);
  assert.equal(s.weekHours, 2.5);
  assert.equal(s.weekSessions, 2);
  assert.equal(s.avgRating, 9.5);      // 只统计有评分的
  assert.equal(s.byPlatform[0].platform, 'Switch');
  assert.equal(s.byPlatform[0].minutes, 150);
});

/* ---------------- 规范化 ---------------- */

test('normalizeData：空输入返回完整默认结构', () => {
  const d = Core.normalizeData(null);
  ['settings', 'notes', 'plans', 'media', 'dev', 'consult', 'fitness', 'diet', 'games']
    .forEach((k) => assert.ok(d[k] !== undefined, 'missing ' + k));
  assert.equal(d.schema, Core.SCHEMA);
  assert.equal(d.settings.dietTargets.kcal, 2000);
  assert.deepEqual(d.diet.water, {});
});

test('normalizeData：丢弃非法条目但保留合法条目', () => {
  const d = Core.normalizeData({
    plans: {
      '2024-05-15': { items: [{ title: '有效事项' }, { title: '   ' }, null], review: '不错' },
      'bad-key': { items: [{ title: '应被丢弃' }] }
    },
    media: { posts: [{ title: '有效内容' }, { title: '' }] },
    dev: { items: [{ title: '任务', status: 'xxx', type: 'yyy' }, {}] },
    fitness: { sessions: [{ date: '2024-05-15', exercise: '卧推' }, { date: 'bad', exercise: 'x' }, { date: '2024-05-15', exercise: '' }] },
    diet: { meals: [{ date: '2024-05-15', name: '米饭', kcal: '300' }], water: { '2024-05-15': '500', bad: 1 } },
    games: { games: [{ name: '游戏A', rating: 99, status: 'unknown' }] }
  });
  assert.equal(d.plans['2024-05-15'].items.length, 1);
  assert.equal(d.plans['2024-05-15'].review, '不错');
  assert.equal(d.plans['bad-key'], undefined);
  assert.equal(d.media.posts.length, 1);
  assert.equal(d.media.posts[0].stage, 'idea');
  assert.equal(d.dev.items.length, 1);
  assert.equal(d.dev.items[0].status, 'todo');   // 非法状态回落默认
  assert.equal(d.dev.items[0].type, 'task');
  assert.equal(d.fitness.sessions.length, 1);
  assert.equal(d.diet.meals[0].kcal, 300);       // 字符串数字被转成 number
  assert.deepEqual(d.diet.water, { '2024-05-15': 500 });
  assert.equal(d.games.games[0].rating, 10);     // 评分夹在 0-10
  assert.equal(d.games.games[0].status, 'wish');
});

test('normalizeData：有发布日期的内容自动归入已发布阶段', () => {
  const d = Core.normalizeData({ media: { posts: [{ title: 'A', stage: 'edit', publishDate: '2024-05-01' }] } });
  assert.equal(d.media.posts[0].stage, 'published');
});

test('normalizeData：保留设置项并兜底非法值', () => {
  const d = Core.normalizeData({ settings: { name: '小林', theme: 'dark', weekStart: 0, dietTargets: { kcal: '1800' } } });
  assert.equal(d.settings.name, '小林');
  assert.equal(d.settings.theme, 'dark');
  assert.equal(d.settings.weekStart, 0);
  assert.equal(d.settings.dietTargets.kcal, 1800);
  assert.equal(d.settings.dietTargets.protein, 120);
  const bad = Core.normalizeData({ settings: { theme: 'rainbow', weekStart: 9 } });
  assert.equal(bad.settings.theme, 'light');
  assert.equal(bad.settings.weekStart, 1);
});

/* ---------------- 备份校验 ---------------- */

test('validateImport：拒绝非法 JSON、非本应用文件、缺 data、空数据', () => {
  assert.equal(Core.validateImport('{oops').ok, false);
  assert.equal(Core.validateImport('null').ok, false);
  assert.equal(Core.validateImport(JSON.stringify({ app: 'other', data: {} })).ok, false);
  assert.equal(Core.validateImport(JSON.stringify({ app: 'myapp' })).ok, false);
  assert.equal(Core.validateImport(JSON.stringify({ app: 'myapp', data: { foo: 1 } })).ok, false);
});

test('validateImport：合法备份被规范化后返回', () => {
  const payload = Core.exportPayload(Core.normalizeData({ notes: [{ text: '备忘一' }] }));
  const res = Core.validateImport(JSON.stringify(payload));
  assert.equal(res.ok, true);
  assert.equal(res.data.notes.length, 1);
  assert.equal(res.data.notes[0].text, '备忘一');
});

test('exportPayload：包含 app 与 schema 标识', () => {
  const p = Core.exportPayload(Core.defaultData());
  assert.equal(p.app, 'myapp');
  assert.equal(p.schema, 1);
  assert.ok(p.exportedAt);
  assert.ok(p.data.plans);
});
