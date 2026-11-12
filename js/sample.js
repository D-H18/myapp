/*!
 * sample.js — 示例数据（可选，手动载入，用于快速看到完整视觉效果）
 * 不会自动写入，只有在「数据与设置」里点「载入示例数据」时才会覆盖当前数据
 */
(function (root) {
  'use strict';
  var Core = root.Core;

  function build() {
    var today = Core.ymd(new Date());
    var d = Core.defaultData();
    var now = Core.nowISO();

    d.settings.name = '小林';
    d.meta = { createdAt: now, updatedAt: now };

    /* ---- 今日计划 ---- */
    var yest = Core.addDays(today, -1);
    var tmw = Core.addDays(today, 1);
    function planItem(title, module, time, priority, done) {
      return {
        id: Core.uid('plan'), title: title, module: module, time: time || '',
        priority: priority || 'mid', done: !!done, doneAt: done ? now : '',
        note: '', source: null, createdAt: now
      };
    }
    d.plans[today] = {
      items: [
        planItem('把首页数据概览的进度环调好', 'dev', '09:30', 'high', true),
        planItem('写「一个人做内容」的脚本', 'media', '11:00', 'high', false),
        planItem('下午 3 点和张先生过方案', 'consult', '15:00', 'high', false),
        planItem('练胸 + 三头', 'fitness', '19:30', 'mid', false),
        planItem('晚饭后散步 30 分钟', 'other', '21:00', 'low', true)
      ],
      review: ''
    };
    d.plans[yest] = {
      items: [planItem('把上周的发布数据补齐', 'media', '', 'mid', true), planItem('整理客户合同模板', 'consult', '', 'mid', true)],
      review: '数据补齐了。明天第一件事先写脚本，不要先刷后台。'
    };
    d.plans[tmw] = {
      items: [planItem('剪「桌面改造」第二版', 'media', '10:00', 'high', false), planItem('给李女士发报价单', 'consult', '14:00', 'mid', false)],
      review: ''
    };

    /* ---- 备忘 ---- */
    d.notes = [
      { id: Core.uid('note'), text: '想去试试那家新开的越南粉，周三中午', pinned: false, createdAt: now },
      { id: Core.uid('note'), text: '视频开头 3 秒必须给结论，别再铺垫了', pinned: true, createdAt: now },
      { id: Core.uid('note'), text: '读书笔记：《深度工作》第四章，排时间块的方法可以做成模板', pinned: false, createdAt: now }
    ];

    /* ---- 自媒体 ---- */
    d.media.accounts = [
      { id: Core.uid('acc'), platform: '抖音', name: '小林在做内容' },
      { id: Core.uid('acc'), platform: '小红书', name: '小林笔记' }
    ];
    function post(title, platform, daysAgo, views, likes, comments, shares, saves, followers, stage) {
      return {
        id: Core.uid('post'), title: title, platform: platform, stage: stage || 'published',
        publishDate: daysAgo === null ? '' : Core.addDays(today, -daysAgo),
        views: views || 0, likes: likes || 0, comments: comments || 0, shares: shares || 0,
        saves: saves || 0, followers: followers || 0, url: '', note: '', createdAt: now
      };
    }
    d.media.posts = [
      post('3 个提升效率的桌面习惯', '抖音', 18, 12400, 860, 74, 51, 320, 180),
      post('我用一周做了个记账小工具', 'B站', 14, 5300, 410, 62, 38, 210, 90),
      post('为什么你的计划总完不成', '小红书', 10, 8600, 720, 118, 44, 402, 210),
      post('桌面改造：500 元方案', '抖音', 5, 21500, 1680, 143, 96, 610, 420),
      post('接咨询前我踩过的 4 个坑', '视频号', 2, 3200, 210, 31, 22, 88, 45),
      post('标题党到底该不该用', '小红书', null, 0, 0, 0, 0, 0, 0, 'idea'),
      post('一个人做内容的完整流程', 'B站', null, 0, 0, 0, 0, 0, 0, 'script'),
      post('复盘我的时间账', '抖音', null, 0, 0, 0, 0, 0, 0, 'edit')
    ];

    /* ---- 开发工作 ---- */
    var p1 = { id: Core.uid('proj'), name: '个人站改版', color: '#6366f1', note: '' };
    var p2 = { id: Core.uid('proj'), name: '客户小程序', color: '#0ea5e9', note: '' };
    d.dev.projects = [p1, p2];
    function task(title, projectId, type, status, priority, due, estimate, doneDaysAgo) {
      return {
        id: Core.uid('task'), title: title, projectId: projectId, type: type, status: status,
        priority: priority, estimate: estimate, due: due || '',
        doneAt: status === 'done' ? Core.addDays(today, -(doneDaysAgo || 0)) + 'T10:00:00.000Z' : '',
        note: '', createdAt: now
      };
    }
    d.dev.items = [
      task('修复详情页在 Safari 下的横向滚动', p1.id, 'bug', 'todo', 'high', Core.addDays(today, -2), 2),
      task('重构数据请求层，去掉重复代码', p1.id, 'debt', 'todo', 'low', '', 5),
      task('首页增加数据概览模块', p1.id, 'feature', 'doing', 'high', Core.addDays(today, 2), 6),
      task('整理组件库命名', p2.id, 'task', 'doing', 'mid', Core.addDays(today, 4), 3),
      task('接入本地备份导出', p1.id, 'feature', 'review', 'mid', Core.addDays(today, 1), 4),
      task('配置自动测试脚本', p1.id, 'task', 'done', 'mid', '', 2, 2),
      task('修复移动端菜单遮挡内容', p2.id, 'bug', 'done', 'high', '', 1, 5)
    ];

    /* ---- 咨询工作 ---- */
    function client(name, company, contact, stage, tags) {
      return { id: Core.uid('client'), name: name, company: company, contact: contact, stage: stage, tags: tags || '', note: '', createdAt: now };
    }
    var c1 = client('张先生', '某教育公司 运营负责人', '微信 zhang', 'delivering', '转介绍,长期');
    var c2 = client('李女士', '独立设计师', '微信 li', 'signed', '个人品牌');
    var c3 = client('王同学', '应届生', '邮箱 wang@example.com', 'talking', '求职');
    var c4 = client('陈总', '制造企业 总经理', '电话 138****', 'lead', '内训');
    d.consult.clients = [c1, c2, c3, c4];
    function session(clientId, daysAgo, minutes, fee, topic) {
      return { id: Core.uid('session'), clientId: clientId, date: Core.addDays(today, -daysAgo), minutes: minutes, fee: fee, topic: topic, note: '' };
    }
    d.consult.sessions = [
      session(c1.id, 12, 60, 800, 'Q4 增长方案第一次评审'),
      session(c1.id, 5, 90, 1200, '内容团队分工梳理'),
      session(c2.id, 8, 60, 600, '个人品牌定位'),
      session(c2.id, 2, 60, 600, '报价与合同模板'),
      session(c3.id, 1, 45, 300, '简历与作品集修改'),
      session(c4.id, 25, 90, 1500, '内部培训体系诊断')
    ];

    /* ---- 健身 ---- */
    function fit(daysAgo, part, exercise, sets, reps, weight) {
      return {
        id: Core.uid('fit'), date: Core.addDays(today, -daysAgo), part: part, exercise: exercise,
        sets: sets, reps: reps, weight: weight || 0, note: '', createdAt: now
      };
    }
    d.fitness.sessions = [
      fit(0, 'chest', '杠铃卧推', 4, 8, 60),
      fit(0, 'chest', '上斜哑铃卧推', 3, 10, 20),
      fit(0, 'chest', '绳索夹胸', 3, 12, 15),
      fit(1, 'back', '引体向上', 4, 6, 0),
      fit(1, 'back', '杠铃划船', 4, 10, 50),
      fit(3, 'legs', '深蹲', 5, 5, 80),
      fit(3, 'legs', '罗马尼亚硬拉', 3, 10, 60),
      fit(5, 'shoulders', '哑铃肩推', 4, 8, 30),
      fit(5, 'shoulders', '侧平举', 3, 15, 8),
      fit(6, 'cardio', '爬坡快走', 1, 30, 0),
      fit(8, 'arms', '哑铃弯举', 3, 12, 12),
      fit(8, 'arms', '绳索下压', 3, 12, 20)
    ];

    /* ---- 饮食 ---- */
    function meal(daysAgo, type, name, kcal, protein, carbs, fat) {
      return { id: Core.uid('meal'), date: Core.addDays(today, -daysAgo), type: type, name: name, kcal: kcal, protein: protein, carbs: carbs, fat: fat, note: '' };
    }
    d.diet.meals = [
      meal(0, 'breakfast', '燕麦 + 鸡蛋 + 黑咖啡', 330, 18, 42, 9),
      meal(0, 'lunch', '鸡胸肉糙米饭', 620, 45, 68, 12),
      meal(0, 'snack', '希腊酸奶 + 蓝莓', 190, 14, 20, 4),
      meal(1, 'breakfast', '全麦吐司 + 花生酱', 380, 14, 45, 14),
      meal(1, 'lunch', '牛肉面', 720, 32, 88, 22),
      meal(1, 'dinner', '清蒸鱼 + 西兰花', 480, 38, 24, 18),
      meal(2, 'breakfast', '豆浆 + 包子', 420, 15, 62, 10),
      meal(2, 'lunch', '公司食堂套餐', 780, 35, 95, 26),
      meal(2, 'dinner', '沙拉 + 鸡胸', 400, 36, 20, 14),
      meal(3, 'lunch', '三文鱼饭', 690, 40, 70, 24),
      meal(4, 'breakfast', '蛋白粉 + 香蕉', 300, 26, 34, 4),
      meal(4, 'dinner', '番茄牛腩', 560, 34, 30, 26)
    ];
    d.diet.water[today] = 1250;
    d.diet.water[yest] = 1750;

    /* ---- 游戏 ---- */
    function game(name, platform, status, rating, hours, note) {
      return { id: Core.uid('game'), name: name, platform: platform, status: status, rating: rating, hours: hours, note: note || '', createdAt: now };
    }
    var g1 = game('塞尔达传说 王国之泪', 'Switch', 'playing', 9, 35, '还在慢慢逛地图');
    var g2 = game('黑神话：悟空', 'PC', 'playing', 8.5, 12, '卡在第三章');
    var g3 = game('哈迪斯', 'PC', 'done', 10, 26, '通关 3 周目');
    var g4 = game('空洞骑士：丝之歌', 'Switch', 'wish', 0, 0, '等打折');
    d.games.games = [g1, g2, g3, g4];
    function gsess(gameId, daysAgo, minutes, note) {
      return { id: Core.uid('gsess'), gameId: gameId, date: Core.addDays(today, -daysAgo), minutes: minutes, note: note || '' };
    }
    d.games.sessions = [
      gsess(g1.id, 1, 90, '打完风之神殿'),
      gsess(g1.id, 3, 120, ''),
      gsess(g2.id, 2, 60, '过了黄风岭'),
      gsess(g3.id, 6, 150, ''),
      gsess(g1.id, 8, 90, ''),
      gsess(g2.id, 10, 45, '')
    ];

    return d;
  }

  root.Sample = { build: build };
})(typeof globalThis !== 'undefined' ? globalThis : this);
