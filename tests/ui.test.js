'use strict';
/**
 * ui.test.js — 浏览器端验收测试（Playwright + Chromium）
 * 覆盖 PRD 第 10 节「可以实际检查的验收标准」中的交互与持久化条目
 * 运行：npm test（或 node --test tests/ui.test.js）
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('node:child_process');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (e) {
    const globalRoot = require('node:child_process').execSync('npm root -g').toString().trim();
    return require(path.join(globalRoot, 'playwright'));
  }
}

const { chromium } = loadPlaywright();

const PORT = 5199;
const BASE = 'http://127.0.0.1:' + PORT;

let server = null;
let browser = null;

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

test.before(async () => {
  server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js'), String(PORT)], { stdio: 'ignore' });
  await wait(600);
  browser = await chromium.launch();
});

test.after(async () => {
  if (browser) await browser.close();
  if (server) server.kill();
});

/** 每个用例一个干净的浏览器上下文（localStorage 为空） */
async function openApp(viewport) {
  const ctx = await browser.newContext({ viewport: viewport || { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  return { ctx, page, errors };
}

async function goto(page, key) {
  await page.click('.nav-item[data-key="' + key + '"]');
  await page.waitForTimeout(150);
}

const TOP_MODAL = '.modal-backdrop:last-of-type .modal';

async function fillModal(page, values) {
  for (const [name, value] of Object.entries(values)) {
    const sel = TOP_MODAL + ' [name="' + name + '"]';
    const tag = await page.$eval(sel, (el) => el.tagName.toLowerCase());
    if (tag === 'select') await page.selectOption(sel, String(value));
    else await page.fill(sel, String(value));
  }
  await page.click(TOP_MODAL + ' [data-submit]');
  await page.waitForTimeout(200);
}

async function confirmModal(page) {
  await page.click('.modal-backdrop [data-yes]');
  await page.waitForTimeout(200);
}

async function state(page) {
  return page.evaluate(() => Store.get());
}

test('导航：九个模块都能打开，标题正确，无控制台报错', async () => {
  const { ctx, page, errors } = await openApp();
  const expected = [
    ['home', '首页总览'], ['plan', '今日计划'], ['media', '自媒体'], ['dev', '开发工作'],
    ['consult', '咨询工作'], ['fitness', '健身计划'], ['diet', '饮食计划'],
    ['games', '游戏娱乐'], ['settings', '数据与设置']
  ];
  for (const [key, title] of expected) {
    await goto(page, key);
    assert.equal((await page.textContent('#pageTitle')).trim(), title, key + ' 标题不对');
    const len = await page.evaluate(() => document.querySelector('#view').innerHTML.length);
    assert.ok(len > 500, key + ' 页面内容为空');
  }
  assert.deepEqual(errors, [], '不应有控制台错误：' + errors.join(' | '));
  await ctx.close();
});

test('首页：快速添加今日事项 → 今日计划可见 → 刷新后仍在', async () => {
  const { ctx, page } = await openApp();
  await page.fill('#homeQuick', '买牛奶');
  await page.press('#homeQuick', 'Enter');
  await page.waitForTimeout(200);
  assert.ok((await page.textContent('#view')).includes('买牛奶'), '首页应出现新事项');

  await goto(page, 'plan');
  assert.ok((await page.textContent('#view')).includes('买牛奶'), '今日计划页应看到同一件事');

  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(page.url().includes('#/plan'), true, '刷新后应停留在今日计划');
  assert.ok((await page.textContent('#view')).includes('买牛奶'), '刷新后数据不应丢失');
  await ctx.close();
});

test('今日计划：勾选 3 条中的 2 条 → 完成率 67%，按日期隔离', async () => {
  const { ctx, page } = await openApp();
  await goto(page, 'plan');
  for (const t of ['事项一', '事项二', '事项三']) {
    await page.fill('#quickTitle', t);
    await page.press('#quickTitle', 'Enter');
    await page.waitForTimeout(120);
  }
  const checks = await page.$$('[data-act="toggle"]');
  assert.equal(checks.length, 3);
  await checks[0].click();
  await page.waitForTimeout(120);
  await (await page.$$('[data-act="toggle"]'))[1].click();
  await page.waitForTimeout(200);
  assert.ok((await page.textContent('#view')).includes('67% 完成'), '完成率应为 67%');

  const titles = () => page.$$eval('.plan-list .plan-item .plan-title, .plan-item .plan-title', (els) => els.map((e) => e.textContent.trim()));

  // 昨天新增，不影响今天
  await page.click('[data-act="prev"]');
  await page.waitForTimeout(150);
  assert.deepEqual(await titles(), [], '昨天不应看到今天的事项');
  await page.fill('#quickTitle', '昨天的事');
  await page.press('#quickTitle', 'Enter');
  await page.waitForTimeout(150);
  await page.click('[data-act="today"]');
  await page.waitForTimeout(150);
  const todayTitles = await titles();
  assert.ok(!todayTitles.includes('昨天的事'), '今天不应看到昨天的事项');
  assert.ok(todayTitles.includes('事项一'), '今天的事项应还在');

  const s = await state(page);
  const today = await page.evaluate(() => Core.ymd(new Date()));
  assert.equal(s.plans[today].items.length, 3);
  await ctx.close();
});

test('保存：手动保存按钮与 Ctrl+S 都生效，并显示保存时间', async () => {
  const { ctx, page } = await openApp();
  await page.click('#btnSave');
  await page.waitForTimeout(200);
  const txt = (await page.textContent('#saveState')).trim();
  assert.match(txt, /已保存 \d{2}:\d{2}:\d{2}/);

  await page.keyboard.press('Control+s');
  await page.waitForTimeout(150);
  assert.match((await page.textContent('#saveState')).trim(), /已保存/);
  await ctx.close();
});

test('开发工作：顶部按钮能新增工作项，卡片可移动状态，统计同步', async () => {
  const { ctx, page } = await openApp();
  await goto(page, 'dev');

  const addBtn = await page.$('.btn-primary[data-act="add"]');
  assert.ok(addBtn, '开发工作页必须有显眼的新增按钮');
  assert.ok((await addBtn.innerText()).includes('新增工作项'));

  await addBtn.click();
  await page.waitForTimeout(200);
  await fillModal(page, {
    title: '修复登录页报错',
    type: 'bug',
    status: 'todo',
    priority: 'high',
    due: '2020-01-01'
  });

  const board = await page.textContent('#view');
  assert.ok(board.includes('修复登录页报错'), '新工作项应出现在看板');
  assert.ok(board.includes('逾期'), '过期截止日期应标记逾期');

  // 移动到进行中
  await page.click('[data-act="move"][data-dir="1"]');
  await page.waitForTimeout(250);
  const s = await state(page);
  assert.equal(s.dev.items[0].status, 'doing');

  const kpiDoing = await page.$eval('.grid.g-4 .kpi:nth-child(2) .value', (el) => el.textContent.trim());
  assert.equal(kpiDoing, '1');
  await ctx.close();
});

test('开发工作：项目筛选可用，项目可新建', async () => {
  const { ctx, page } = await openApp();
  await goto(page, 'dev');
  await page.click('[data-act="manage-projects"]');
  await page.waitForTimeout(200);
  await page.click('.modal [data-new]');
  await page.waitForTimeout(200);
  await fillModal(page, { name: '个人站改版' });

  await page.click(TOP_MODAL + ' [data-close-btn]');
  await page.waitForTimeout(150);
  assert.ok((await page.textContent('#view')).includes('个人站改版'), '项目筛选条应出现新项目');

  await page.click('.btn-primary[data-act="add"]');
  await page.waitForTimeout(200);
  const opts = await page.$$eval(TOP_MODAL + ' select[name="projectId"] option', (els) => els.map((e) => e.textContent));
  assert.ok(opts.some((t) => t.includes('个人站改版')), '工作项表单应能选到新项目');
  await ctx.close();
});

test('自媒体：登记两条发布数据 → 三张图表都渲染', async () => {
  const { ctx, page } = await openApp();
  await goto(page, 'media');
  const dates = await page.evaluate(() => {
    const t = Core.ymd(new Date());
    return { y: Core.addDays(t, -1), t: t };
  });

  await page.click('[data-act="new-metrics"]');
  await page.waitForTimeout(200);
  await fillModal(page, {
    title: '第一条视频', platform: '抖音', publishDate: dates.y,
    views: 1200, likes: 100, comments: 10, shares: 5, saves: 20, followers: 30
  });

  await page.click('[data-act="new-metrics"]');
  await page.waitForTimeout(200);
  await fillModal(page, {
    title: '第二条视频', platform: 'B站', publishDate: dates.t,
    views: 800, likes: 60, comments: 5, shares: 2, saves: 10, followers: 12
  });

  await page.click('[data-act="tab"][data-tab="data"]');
  await page.waitForTimeout(300);

  const charts = await page.evaluate(() => ({
    linePaths: document.querySelectorAll('.chart-wrap svg path').length,
    donutCircles: document.querySelectorAll('.chart-wrap svg circle').length,
    bars: document.querySelectorAll('.bars-h .bh-fill').length,
    barWidth: document.querySelector('.bars-h .bh-fill') ? getComputedStyle(document.querySelector('.bars-h .bh-fill')).width : '0px',
    tableRows: document.querySelectorAll('.table tbody tr').length
  }));
  assert.ok(charts.linePaths >= 2, '折线图应有折线与面积');
  assert.ok(charts.donutCircles >= 2, '环形图应有平台分段');
  assert.equal(charts.bars, 2, 'Top5 应有两条');
  assert.notEqual(charts.barWidth, '0px', '条形图填充必须有宽度（防止行内元素高度失效）');
  assert.equal(charts.tableRows, 2, '发布记录表应有两条');

  const text = await page.textContent('#view');
  assert.ok(text.includes('11.3%'), '单条互动率应为 (100+10+5+20)/1200 = 11.3%');
  assert.ok(text.includes('10.6%'), '整体互动率应为 212/2000 = 10.6%');
  await ctx.close();
});

test('咨询：新增客户后可以删除（二次确认），咨询收入进入统计', async () => {
  const { ctx, page } = await openApp();
  await goto(page, 'consult');
  await page.click('[data-act="add-client"]');
  await page.waitForTimeout(200);
  await fillModal(page, { name: '张先生', company: '某教育公司', stage: 'signed' });
  assert.ok((await page.textContent('#view')).includes('张先生'));

  // 加一条咨询记录
  await page.click('[data-act="add-session"]');
  await page.waitForTimeout(200);
  await fillModal(page, { date: await page.evaluate(() => Core.ymd(new Date())), minutes: 60, fee: 800, topic: '方案评审' });
  const text = await page.textContent('#view');
  assert.ok(text.includes('¥800'), '本月收入应包含 800');

  // 删除客户
  await page.click('[data-act="del-client"]');
  await page.waitForTimeout(200);
  assert.ok((await page.textContent('.modal-backdrop')).includes('删除'), '应有二次确认');
  await confirmModal(page);

  const s = await state(page);
  assert.equal(s.consult.clients.length, 0, '客户应被删除');
  assert.equal(s.consult.sessions.length, 0, '该客户的咨询记录应级联删除');
  await ctx.close();
});

test('健身：点日历当天新增动作，格子显示部位与组数', async () => {
  const { ctx, page } = await openApp();
  await goto(page, 'fitness');
  const today = await page.evaluate(() => Core.ymd(new Date()));
  await page.click('.cal-cell[data-date="' + today + '"]');
  await page.waitForTimeout(200);

  await page.click('.card [data-act="add"]');
  await page.waitForTimeout(200);
  await fillModal(page, { part: 'chest', exercise: '杠铃卧推', sets: 4, reps: 8, weight: 60 });

  const cell = await page.$eval('.cal-cell[data-date="' + today + '"]', (el) => el.textContent);
  assert.ok(cell.includes('胸'), '日历格子应显示部位');
  assert.ok(cell.includes('4组'), '日历格子应显示组数');
  assert.ok((await page.textContent('#view')).includes('杠铃卧推'), '右侧应列出动作');
  await ctx.close();
});

test('饮食：记录午餐热量与饮水，刷新后保留', async () => {
  const { ctx, page } = await openApp();
  await goto(page, 'diet');
  const today = await page.evaluate(() => Core.ymd(new Date()));
  await page.click('.cal-cell[data-date="' + today + '"]');
  await page.waitForTimeout(200);
  await page.click('.card [data-act="add"]');
  await page.waitForTimeout(200);
  await fillModal(page, { type: 'lunch', name: '鸡胸饭', kcal: 500, protein: 40, carbs: 60, fat: 8 });

  assert.ok((await page.$eval('.cal-cell[data-date="' + today + '"]', (el) => el.textContent)).includes('500'));

  await page.click('[data-act="water-plus"]');
  await page.waitForTimeout(200);
  await page.reload({ waitUntil: 'networkidle' });
  const s = await state(page);
  assert.equal(s.diet.meals.length, 1);
  assert.equal(s.diet.water[today], 250);
  assert.ok((await page.textContent('#view')).includes('250 ml'), '饮水应保留');
  await ctx.close();
});

test('游戏：新增游戏并记录 90 分钟，本周时长同步', async () => {
  const { ctx, page } = await openApp();
  await goto(page, 'games');
  await page.click('[data-act="add"]');
  await page.waitForTimeout(200);
  await fillModal(page, { name: '塞尔达', platform: 'Switch', status: 'playing', rating: 9, hours: 0 });

  await page.click('[data-act="play"]');
  await page.waitForTimeout(200);
  await fillModal(page, { minutes: 90 });
  await ctx.close();

  const { ctx: c2, page: p2 } = await openApp();
  await goto(p2, 'games');
  await p2.click('[data-act="add"]');
  await p2.waitForTimeout(200);
  await fillModal(p2, { name: '黑神话', platform: 'PC', status: 'playing', rating: 8, hours: 0 });
  await p2.click('[data-act="play"]');
  await p2.waitForTimeout(200);
  await fillModal(p2, { minutes: 90 });
  await p2.waitForTimeout(200);
  const kpi = await p2.$eval('.grid.g-4 .kpi:nth-child(2) .value', (el) => el.textContent.trim());
  assert.equal(kpi, '1.5 h');
  await c2.close();
});

test('设置：导出备份文件名正确，导入非法文件被拒绝且数据不变', async () => {
  const { ctx, page } = await openApp();
  await goto(page, 'plan');
  await page.fill('#quickTitle', '不能丢的事');
  await page.press('#quickTitle', 'Enter');
  await page.waitForTimeout(200);

  await goto(page, 'settings');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-act="export"]')
  ]);
  assert.match(download.suggestedFilename(), /^myapp-backup-\d{8}-\d{4}\.json$/);

  const bad = path.join(os.tmpdir(), 'myapp-bad-' + Date.now() + '.json');
  fs.writeFileSync(bad, '{"app":"other","data":{"notes":[]}}');
  await page.setInputFiles('#importFile', bad);
  await page.waitForTimeout(400);
  const toast = await page.textContent('#toastWrap');
  assert.ok(toast.includes('不是 myapp 的备份文件'), '应提示格式错误：' + toast);

  const s = await state(page);
  const today = await page.evaluate(() => Core.ymd(new Date()));
  assert.equal(s.plans[today].items.length, 1, '导入失败不应破坏现有数据');
  fs.unlinkSync(bad);
  await ctx.close();
});

test('设置：清空数据需输入「清空」二字', async () => {
  const { ctx, page } = await openApp();
  await goto(page, 'plan');
  await page.fill('#quickTitle', '要被清空的事');
  await page.press('#quickTitle', 'Enter');
  await page.waitForTimeout(200);

  await goto(page, 'settings');
  await page.click('[data-act="clear"]');
  await page.waitForTimeout(200);
  await page.fill('.modal [name="word"]', '清空数据');
  await page.click('.modal [data-submit]');
  await page.waitForTimeout(300);
  let s = await state(page);
  const today = await page.evaluate(() => Core.ymd(new Date()));
  assert.equal(s.plans[today].items.length, 1, '输入不正确时不应清空');
  assert.ok((await page.textContent('.modal-backdrop')).includes('清空'), '应提示需要输入正确字样');

  await page.fill('.modal [name="word"]', '清空');
  await page.click('.modal [data-submit]');
  await page.waitForTimeout(300);
  s = await state(page);
  assert.deepEqual(s.plans, {}, '输入正确后应清空');
  await ctx.close();
});

test('首页摘要与模块统计一致（开发进行中 / 咨询活跃客户）', async () => {
  const { ctx, page } = await openApp();
  await page.evaluate(() => {
    Store.importJSON(JSON.stringify(Core.exportPayload(Sample.build())));
    App.refresh();
  });
  await page.waitForTimeout(300);

  const homeCards = await page.$$eval('.summary-card', (els) => els.map((e) => e.textContent.replace(/\s+/g, '').trim()));
  const st = await state(page);
  const today = await page.evaluate(() => Core.ymd(new Date()));
  const dev = await page.evaluate((t) => Core.devStats(Store.get().dev.items, { today: t, weekStart: 1 }), today);
  const consult = await page.evaluate((t) => Core.consultStats(Store.get().consult.clients, Store.get().consult.sessions, { today: t }), today);

  const n = (v) => String(v).replace(/\s+/g, '');
  assert.ok(homeCards.some((t) => t.includes(n(dev.doing + '项进行中'))), '首页进行中数量应与统计一致：' + homeCards.join(' | '));
  assert.ok(homeCards.some((t) => t.includes(n(consult.active + '位活跃客户'))), '首页活跃客户应与统计一致');
  assert.ok(homeCards.length === 6, '应有 6 张模块摘要卡');
  assert.equal(st.settings.name, '小林');
  await ctx.close();
});

test('主题：切换到深色后刷新仍保持', async () => {
  const { ctx, page } = await openApp();
  await page.click('#btnTheme');
  await page.waitForTimeout(200);
  assert.equal(await page.getAttribute('html', 'data-theme'), 'dark');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.getAttribute('html', 'data-theme'), 'dark');
  await ctx.close();
});

test('空状态：没有数据时各页显示引导而不是空白或报错', async () => {
  const { ctx, page, errors } = await openApp();
  for (const key of ['media', 'dev', 'consult', 'fitness', 'diet', 'games']) {
    await goto(page, key);
    const html = await page.evaluate(() => document.querySelector('#view').innerHTML.length);
    assert.ok(html > 800, key + ' 空状态内容过少');
  }
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('本地存储不可用时给出明确提示（不静默丢数据）', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    const thrower = { getItem: () => null, setItem: () => { throw new Error('blocked'); }, removeItem: () => {} };
    Object.defineProperty(window, 'localStorage', { get: () => thrower, configurable: true });
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const st = (await page.textContent('#saveState')).trim();
  assert.ok(st.includes('保存失败') || st.includes('不可用'), '应提示存储不可用：' + st);
  await ctx.close();
});
