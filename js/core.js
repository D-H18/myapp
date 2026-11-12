/*!
 * core.js — 纯逻辑层（无 DOM、无存储依赖，可在 Node 中直接测试）
 * 包含：日期工具、数字格式化、统计口径、数据结构规范化、备份校验
 */
(function (root, factory) {
  var api = factory();
  root.Core = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SCHEMA = 1;
  var WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  /* ---------------- 基础工具 ---------------- */

  function pad2(n) { return String(n).padStart(2, '0'); }

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function num(v, def) {
    var n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : (def === undefined ? 0 : def);
  }

  function clamp(v, min, max) { return Math.min(max, Math.max(min, num(v))); }

  function round1(v) { return Math.round(num(v) * 10) / 10; }

  function sum(list, pick) {
    return (Array.isArray(list) ? list : []).reduce(function (acc, it) {
      var v = pick ? pick(it) : it;
      return acc + num(v);
    }, 0);
  }

  function byId(list, id) {
    return (Array.isArray(list) ? list : []).find(function (it) { return it && it.id === id; }) || null;
  }

  function str(v, def) {
    if (typeof v === 'string') return v;
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    return def === undefined ? '' : def;
  }

  /* ---------------- 日期 ---------------- */

  function toDate(v) {
    if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    var s = str(v);
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    var d = new Date(s);
    if (isNaN(d.getTime())) return new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function ymd(v) {
    var d = toDate(v);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function addDays(v, n) {
    var d = toDate(v);
    d.setDate(d.getDate() + n);
    return ymd(d);
  }

  function diffDays(a, b) {
    return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86400000);
  }

  /** ws: 1 = 周一为一周第一天（默认），0 = 周日 */
  function startOfWeek(v, ws) {
    var d = toDate(v);
    var first = (ws === 0) ? 0 : 1;
    var shift = (d.getDay() - first + 7) % 7;
    d.setDate(d.getDate() - shift);
    return ymd(d);
  }

  function weekDates(v, ws) {
    var s = startOfWeek(v, ws);
    var out = [];
    for (var i = 0; i < 7; i++) out.push(addDays(s, i));
    return out;
  }

  function monthOf(v) { return ymd(v).slice(0, 7); }

  function addMonths(monthStr, n) {
    var y = Number(monthStr.slice(0, 4));
    var m = Number(monthStr.slice(5, 7));
    var d = new Date(y, m - 1 + n, 1);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
  }

  /** 返回该月的日历格子（含前后补齐），month: 1-12 */
  function monthGrid(year, month, ws) {
    var first = new Date(year, month - 1, 1);
    var total = new Date(year, month, 0).getDate();
    var lead = (first.getDay() - ((ws === 0) ? 0 : 1) + 7) % 7;
    var rows = Math.ceil((lead + total) / 7);
    var start = addDays(year + '-' + pad2(month) + '-01', -lead);
    var out = [];
    for (var i = 0; i < rows * 7; i++) {
      var date = addDays(start, i);
      out.push({
        date: date,
        day: Number(date.slice(8, 10)),
        inMonth: Number(date.slice(5, 7)) === month,
        weekday: toDate(date).getDay()
      });
    }
    return out;
  }

  function fmtDateCN(v) {
    var d = toDate(v);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + WEEK_CN[d.getDay()];
  }

  function fmtDateShort(v) {
    var d = toDate(v);
    return pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function fmtMonthCN(monthStr) {
    return Number(monthStr.slice(0, 4)) + '年' + Number(monthStr.slice(5, 7)) + '月';
  }

  function timeAgo(iso) {
    if (!iso) return '—';
    var t = new Date(iso).getTime();
    if (isNaN(t)) return '—';
    var s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return '刚刚';
    if (s < 3600) return Math.floor(s / 60) + ' 分钟前';
    if (s < 86400) return Math.floor(s / 3600) + ' 小时前';
    return Math.floor(s / 86400) + ' 天前';
  }

  /* ---------------- 格式化 ---------------- */

  function fmtNum(v) {
    var n = num(v);
    if (Math.abs(n) >= 100000000) return round1(n / 100000000) + '亿';
    if (Math.abs(n) >= 10000) return round1(n / 10000) + '万';
    if (Math.round(n) === n) return String(n);
    return String(round1(n));
  }

  function fmtMoney(v) {
    var n = Math.round(num(v));
    return '¥' + n.toLocaleString('zh-CN');
  }

  function fmtPct(v, digits) {
    var d = digits === undefined ? 0 : digits;
    return (Math.round(num(v) * Math.pow(10, d)) / Math.pow(10, d)) + '%';
  }

  function fmtDuration(min) {
    var m = Math.round(num(min));
    if (m < 60) return m + ' 分钟';
    var h = Math.floor(m / 60);
    var rest = m % 60;
    return rest ? h + ' 小时 ' + rest + ' 分' : h + ' 小时';
  }

  /* ---------------- 数据结构 ---------------- */

  function nowISO() { return new Date().toISOString(); }

  function defaultData() {
    return {
      schema: SCHEMA,
      meta: { createdAt: nowISO(), updatedAt: nowISO() },
      settings: {
        name: '我',
        theme: 'light',
        weekStart: 1,
        dietTargets: { kcal: 2000, protein: 120, carbs: 230, fat: 65, water: 2000 }
      },
      notes: [],
      plans: {},
      media: { accounts: [], posts: [] },
      dev: { projects: [], items: [] },
      consult: { clients: [], sessions: [] },
      fitness: { sessions: [] },
      diet: { meals: [], water: {} },
      games: { games: [], sessions: [] }
    };
  }

  function arr(v) { return Array.isArray(v) ? v : []; }

  function normalizeNote(v) {
    if (!v || typeof v !== 'object') return null;
    var text = str(v.text).trim();
    if (!text) return null;
    return { id: str(v.id) || uid('note'), text: text, pinned: !!v.pinned, createdAt: str(v.createdAt) || nowISO() };
  }

  function normalizePlanItem(v) {
    if (!v || typeof v !== 'object') return null;
    var title = str(v.title).trim();
    if (!title) return null;
    var priority = ['high', 'mid', 'low'].indexOf(v.priority) >= 0 ? v.priority : 'mid';
    return {
      id: str(v.id) || uid('plan'),
      title: title,
      module: str(v.module) || 'other',
      time: str(v.time),
      priority: priority,
      done: !!v.done,
      doneAt: str(v.doneAt),
      note: str(v.note),
      source: (v.source && typeof v.source === 'object' && v.source.module)
        ? { module: str(v.source.module), refId: str(v.source.refId) }
        : null,
      createdAt: str(v.createdAt) || nowISO()
    };
  }

  function normalizePlans(raw) {
    var out = {};
    if (!raw || typeof raw !== 'object') return out;
    Object.keys(raw).forEach(function (k) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return;
      var day = raw[k] || {};
      var items = arr(day.items).map(normalizePlanItem).filter(Boolean);
      out[k] = { items: items, review: str(day.review) };
    });
    return out;
  }

  function normalizeData(input) {
    var d = defaultData();
    if (!input || typeof input !== 'object') return d;

    var s = input.settings || {};
    var t = s.dietTargets || {};
    d.settings = {
      name: str(s.name, '我') || '我',
      theme: s.theme === 'dark' ? 'dark' : 'light',
      weekStart: s.weekStart === 0 ? 0 : 1,
      dietTargets: {
        kcal: num(t.kcal, 2000),
        protein: num(t.protein, 120),
        carbs: num(t.carbs, 230),
        fat: num(t.fat, 65),
        water: num(t.water, 2000)
      }
    };

    var meta = input.meta || {};
    d.meta = {
      createdAt: str(meta.createdAt) || d.meta.createdAt,
      updatedAt: str(meta.updatedAt) || d.meta.updatedAt
    };

    d.notes = arr(input.notes).map(normalizeNote).filter(Boolean);
    d.plans = normalizePlans(input.plans);

    /* 自媒体 */
    var media = input.media || {};
    d.media.accounts = arr(media.accounts).map(function (a) {
      if (!a || typeof a !== 'object' || !str(a.name).trim()) return null;
      return {
        id: str(a.id) || uid('acc'),
        platform: str(a.platform) || '其他',
        name: str(a.name).trim()
      };
    }).filter(Boolean);
    d.media.posts = arr(media.posts).map(function (p) {
      if (!p || typeof p !== 'object') return null;
      var title = str(p.title).trim();
      if (!title) return null;
      var stage = ['idea', 'script', 'shoot', 'edit', 'published'].indexOf(p.stage) >= 0 ? p.stage : 'idea';
      return {
        id: str(p.id) || uid('post'),
        title: title,
        platform: str(p.platform) || '其他',
        stage: p.publishDate ? 'published' : stage,
        publishDate: str(p.publishDate),
        views: num(p.views),
        likes: num(p.likes),
        comments: num(p.comments),
        shares: num(p.shares),
        saves: num(p.saves),
        followers: num(p.followers),
        url: str(p.url),
        note: str(p.note),
        createdAt: str(p.createdAt) || nowISO()
      };
    }).filter(Boolean);

    /* 开发 */
    var dev = input.dev || {};
    d.dev.projects = arr(dev.projects).map(function (p) {
      if (!p || typeof p !== 'object' || !str(p.name).trim()) return null;
      return { id: str(p.id) || uid('proj'), name: str(p.name).trim(), color: str(p.color) || '#6366f1', note: str(p.note) };
    }).filter(Boolean);
    d.dev.items = arr(dev.items).map(function (it) {
      if (!it || typeof it !== 'object') return null;
      var title = str(it.title).trim();
      if (!title) return null;
      return {
        id: str(it.id) || uid('task'),
        title: title,
        projectId: str(it.projectId),
        type: ['feature', 'bug', 'task', 'debt'].indexOf(it.type) >= 0 ? it.type : 'task',
        status: ['todo', 'doing', 'review', 'done'].indexOf(it.status) >= 0 ? it.status : 'todo',
        priority: ['high', 'mid', 'low'].indexOf(it.priority) >= 0 ? it.priority : 'mid',
        estimate: num(it.estimate),
        due: str(it.due),
        doneAt: str(it.doneAt),
        note: str(it.note),
        createdAt: str(it.createdAt) || nowISO()
      };
    }).filter(Boolean);

    /* 咨询 */
    var consult = input.consult || {};
    d.consult.clients = arr(consult.clients).map(function (c) {
      if (!c || typeof c !== 'object' || !str(c.name).trim()) return null;
      var stage = ['lead', 'talking', 'signed', 'delivering', 'done', 'lost'].indexOf(c.stage) >= 0 ? c.stage : 'lead';
      return {
        id: str(c.id) || uid('client'),
        name: str(c.name).trim(),
        company: str(c.company),
        contact: str(c.contact),
        stage: stage,
        tags: str(c.tags),
        note: str(c.note),
        createdAt: str(c.createdAt) || nowISO()
      };
    }).filter(Boolean);
    d.consult.sessions = arr(consult.sessions).map(function (x) {
      if (!x || typeof x !== 'object') return null;
      var date = str(x.date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
      return {
        id: str(x.id) || uid('session'),
        clientId: str(x.clientId),
        date: date,
        minutes: num(x.minutes, 60),
        topic: str(x.topic),
        fee: num(x.fee),
        note: str(x.note)
      };
    }).filter(Boolean);

    /* 健身 */
    var fitness = input.fitness || {};
    d.fitness.sessions = arr(fitness.sessions).map(function (f) {
      if (!f || typeof f !== 'object') return null;
      var date = str(f.date);
      var exercise = str(f.exercise).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !exercise) return null;
      return {
        id: str(f.id) || uid('fit'),
        date: date,
        part: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'].indexOf(f.part) >= 0 ? f.part : 'chest',
        exercise: exercise,
        sets: num(f.sets, 3),
        reps: num(f.reps, 10),
        weight: num(f.weight),
        note: str(f.note),
        createdAt: str(f.createdAt) || nowISO()
      };
    }).filter(Boolean);

    /* 饮食 */
    var diet = input.diet || {};
    d.diet.meals = arr(diet.meals).map(function (m) {
      if (!m || typeof m !== 'object') return null;
      var date = str(m.date);
      var name = str(m.name).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !name) return null;
      return {
        id: str(m.id) || uid('meal'),
        date: date,
        type: ['breakfast', 'lunch', 'dinner', 'snack'].indexOf(m.type) >= 0 ? m.type : 'lunch',
        name: name,
        kcal: num(m.kcal),
        protein: num(m.protein),
        carbs: num(m.carbs),
        fat: num(m.fat),
        note: str(m.note)
      };
    }).filter(Boolean);
    d.diet.water = {};
    if (diet.water && typeof diet.water === 'object') {
      Object.keys(diet.water).forEach(function (k) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(k)) d.diet.water[k] = num(diet.water[k]);
      });
    }

    /* 游戏 */
    var games = input.games || {};
    d.games.games = arr(games.games).map(function (g) {
      if (!g || typeof g !== 'object' || !str(g.name).trim()) return null;
      return {
        id: str(g.id) || uid('game'),
        name: str(g.name).trim(),
        platform: str(g.platform) || 'PC',
        status: ['wish', 'playing', 'done', 'paused'].indexOf(g.status) >= 0 ? g.status : 'wish',
        rating: clamp(num(g.rating), 0, 10),
        hours: num(g.hours),
        note: str(g.note),
        createdAt: str(g.createdAt) || nowISO()
      };
    }).filter(Boolean);
    d.games.sessions = arr(games.sessions).map(function (x) {
      if (!x || typeof x !== 'object') return null;
      var date = str(x.date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
      return {
        id: str(x.id) || uid('gsess'),
        gameId: str(x.gameId),
        date: date,
        minutes: num(x.minutes, 30),
        note: str(x.note)
      };
    }).filter(Boolean);

    return d;
  }

  /* ---------------- 统计口径 ---------------- */

  /** 今日计划 */
  function planStats(day) {
    var items = arr(day && day.items);
    var done = items.filter(function (i) { return i.done; }).length;
    return {
      total: items.length,
      done: done,
      open: items.length - done,
      rate: items.length ? Math.round((done / items.length) * 100) : 0,
      highOpen: items.filter(function (i) { return !i.done && i.priority === 'high'; }).length
    };
  }

  /** 自媒体：发布数据复盘 */
  function mediaStats(posts, opts) {
    opts = opts || {};
    var today = opts.today || ymd(new Date());
    var days = num(opts.days, 30);
    var start = opts.from || addDays(today, -(days - 1));
    var end = opts.to || today;
    var all = arr(posts);
    var published = all.filter(function (p) { return p.publishDate; });
    var scoped = published.filter(function (p) { return p.publishDate >= start && p.publishDate <= end; });

    var views = sum(scoped, function (p) { return p.views; });
    var likes = sum(scoped, function (p) { return p.likes; });
    var comments = sum(scoped, function (p) { return p.comments; });
    var shares = sum(scoped, function (p) { return p.shares; });
    var saves = sum(scoped, function (p) { return p.saves; });
    var followers = sum(scoped, function (p) { return p.followers; });

    var platformMap = {};
    scoped.forEach(function (p) {
      var key = p.platform || '其他';
      if (!platformMap[key]) platformMap[key] = { platform: key, count: 0, views: 0 };
      platformMap[key].count += 1;
      platformMap[key].views += num(p.views);
    });

    var series = scoped.slice()
      .sort(function (a, b) { return a.publishDate < b.publishDate ? -1 : a.publishDate > b.publishDate ? 1 : 0; })
      .map(function (p) {
        return { date: p.publishDate, label: fmtDateShort(p.publishDate), value: num(p.views), title: p.title };
      });

    var top = scoped.slice()
      .sort(function (a, b) { return num(b.views) - num(a.views); })
      .slice(0, 5)
      .map(function (p) { return { title: p.title, platform: p.platform, value: num(p.views) }; });

    var byPlatform = Object.keys(platformMap).map(function (k) { return platformMap[k]; })
      .sort(function (a, b) { return b.views - a.views; });

    var byStage = { idea: 0, script: 0, shoot: 0, edit: 0, published: 0 };
    all.forEach(function (p) { if (byStage[p.stage] !== undefined) byStage[p.stage] += 1; });

    return {
      from: start,
      to: end,
      totalPublished: published.length,
      count: scoped.length,
      views: views,
      likes: likes,
      comments: comments,
      shares: shares,
      saves: saves,
      followers: followers,
      engagement: views ? round1(((likes + comments + shares + saves) / views) * 100) : 0,
      series: series,
      top: top,
      byPlatform: byPlatform,
      byStage: byStage,
      avgViews: scoped.length ? Math.round(views / scoped.length) : 0
    };
  }

  /** 开发工作 */
  function devStats(items, opts) {
    opts = opts || {};
    var today = opts.today || ymd(new Date());
    var list = arr(items);
    var weekStart = startOfWeek(today, opts.weekStart);
    var st = { todo: 0, doing: 0, review: 0, done: 0 };
    var byType = { feature: 0, bug: 0, task: 0, debt: 0 };
    var overdue = 0, dueSoon = 0, doneThisWeek = 0, estimateOpen = 0;

    list.forEach(function (it) {
      if (st[it.status] !== undefined) st[it.status] += 1;
      if (byType[it.type] !== undefined) byType[it.type] += 1;
      if (it.status !== 'done') {
        estimateOpen += num(it.estimate);
        if (it.due && it.due < today) overdue += 1;
        else if (it.due && it.due <= addDays(today, 3)) dueSoon += 1;
      } else if (it.doneAt && it.doneAt.slice(0, 10) >= weekStart) {
        doneThisWeek += 1;
      }
    });

    return {
      total: list.length,
      todo: st.todo,
      doing: st.doing,
      review: st.review,
      done: st.done,
      open: st.todo + st.doing + st.review,
      overdue: overdue,
      dueSoon: dueSoon,
      doneThisWeek: doneThisWeek,
      estimateOpen: round1(estimateOpen),
      byType: byType,
      rate: list.length ? Math.round((st.done / list.length) * 100) : 0
    };
  }

  /** 咨询工作 */
  function consultStats(clients, sessions, opts) {
    opts = opts || {};
    var today = opts.today || ymd(new Date());
    var month = opts.month || monthOf(today);
    var cl = arr(clients);
    var ss = arr(sessions);
    var byStage = { lead: 0, talking: 0, signed: 0, delivering: 0, done: 0, lost: 0 };
    cl.forEach(function (c) { if (byStage[c.stage] !== undefined) byStage[c.stage] += 1; });

    var revenue = sum(ss, function (s) { return s.fee; });
    var monthRevenue = sum(ss.filter(function (s) { return monthOf(s.date) === month; }), function (s) { return s.fee; });
    var minutes = sum(ss, function (s) { return s.minutes; });
    var perClient = {};
    ss.forEach(function (s) {
      if (!perClient[s.clientId]) perClient[s.clientId] = { count: 0, minutes: 0, fee: 0, lastDate: '' };
      var e = perClient[s.clientId];
      e.count += 1;
      e.minutes += num(s.minutes);
      e.fee += num(s.fee);
      if (s.date > e.lastDate) e.lastDate = s.date;
    });

    return {
      totalClients: cl.length,
      byStage: byStage,
      active: byStage.talking + byStage.signed + byStage.delivering,
      signed: byStage.signed + byStage.delivering + byStage.done,
      revenue: revenue,
      monthRevenue: monthRevenue,
      minutes: minutes,
      hours: round1(minutes / 60),
      sessionCount: ss.length,
      monthSessions: ss.filter(function (s) { return monthOf(s.date) === month; }).length,
      perClient: perClient,
      avgFee: ss.length ? Math.round(revenue / ss.length) : 0
    };
  }

  /** 健身 */
  function fitnessStats(sessions, opts) {
    opts = opts || {};
    var today = opts.today || ymd(new Date());
    var month = opts.month || monthOf(today);
    var list = arr(sessions);
    var byDate = {};
    var partMap = {};

    list.forEach(function (s) {
      if (!byDate[s.date]) byDate[s.date] = { parts: {}, count: 0, sets: 0, volume: 0 };
      var d = byDate[s.date];
      d.parts[s.part] = (d.parts[s.part] || 0) + num(s.sets);
      d.count += 1;
      d.sets += num(s.sets);
      d.volume += num(s.sets) * num(s.reps) * num(s.weight);

      if (!partMap[s.part]) partMap[s.part] = { part: s.part, sets: 0, count: 0, volume: 0 };
      partMap[s.part].sets += num(s.sets);
      partMap[s.part].count += 1;
      partMap[s.part].volume += num(s.sets) * num(s.reps) * num(s.weight);
    });

    var dates = Object.keys(byDate).sort();
    var monthDates = dates.filter(function (d) { return d.slice(0, 7) === month; });

    /* 连续打卡：今天有就今天算起，否则从昨天算起 */
    var streak = 0;
    var cursor = byDate[today] ? today : addDays(today, -1);
    while (byDate[cursor]) { streak += 1; cursor = addDays(cursor, -1); }

    var week = weekDates(today, opts.weekStart);
    var weekDatesSet = week.filter(function (d) { return byDate[d]; });

    return {
      totalSessions: list.length,
      totalDays: dates.length,
      monthDays: monthDates.length,
      monthSessions: list.filter(function (s) { return s.date.slice(0, 7) === month; }).length,
      monthSets: sum(list.filter(function (s) { return s.date.slice(0, 7) === month; }), function (s) { return s.sets; }),
      weekDays: weekDatesSet.length,
      weekSessions: list.filter(function (s) { return week.indexOf(s.date) >= 0; }).length,
      streak: streak,
      byDate: byDate,
      byPart: Object.keys(partMap).map(function (k) { return partMap[k]; }).sort(function (a, b) { return b.sets - a.sets; }),
      volume: Math.round(sum(list, function (s) { return num(s.sets) * num(s.reps) * num(s.weight); })),
      lastDate: dates.length ? dates[dates.length - 1] : ''
    };
  }

  /** 饮食：单日汇总 */
  function dietDay(meals, date, targets, waterMl) {
    var list = arr(meals).filter(function (m) { return m.date === date; });
    var t = targets || defaultData().settings.dietTargets;
    var out = {
      date: date,
      count: list.length,
      kcal: sum(list, function (m) { return m.kcal; }),
      protein: round1(sum(list, function (m) { return m.protein; })),
      carbs: round1(sum(list, function (m) { return m.carbs; })),
      fat: round1(sum(list, function (m) { return m.fat; })),
      water: num(waterMl),
      byMeal: { breakfast: [], lunch: [], dinner: [], snack: [] },
      targets: t
    };
    list.forEach(function (m) {
      (out.byMeal[m.type] || out.byMeal.snack).push(m);
    });
    out.kcalTarget = num(t.kcal);
    out.remaining = out.kcalTarget - out.kcal;
    out.pct = out.kcalTarget ? Math.round(Math.min(1, out.kcal / out.kcalTarget) * 100) : 0;
    out.proteinPct = num(t.protein) ? Math.round((out.protein / t.protein) * 100) : 0;
    out.carbsPct = num(t.carbs) ? Math.round((out.carbs / t.carbs) * 100) : 0;
    out.fatPct = num(t.fat) ? Math.round((out.fat / t.fat) * 100) : 0;
    out.waterPct = num(t.water) ? Math.round((out.water / t.water) * 100) : 0;
    return out;
  }

  /** 饮食：区间日均 */
  function dietRange(meals, dates, targets) {
    var days = arr(dates);
    var total = 0, logged = 0;
    days.forEach(function (d) {
      var k = sum(arr(meals).filter(function (m) { return m.date === d; }), function (m) { return m.kcal; });
      if (k > 0) { logged += 1; total += k; }
    });
    return { days: days.length, loggedDays: logged, totalKcal: total, avgKcal: logged ? Math.round(total / logged) : 0 };
  }

  /** 游戏 */
  function gamesStats(games, sessions, opts) {
    opts = opts || {};
    var today = opts.today || ymd(new Date());
    var list = arr(games);
    var ss = arr(sessions);
    var byStatus = { wish: 0, playing: 0, done: 0, paused: 0 };
    list.forEach(function (g) { if (byStatus[g.status] !== undefined) byStatus[g.status] += 1; });

    var week = weekDates(today, opts.weekStart);
    var totalMinutes = sum(ss, function (s) { return s.minutes; });
    var weekMinutes = sum(ss.filter(function (s) { return week.indexOf(s.date) >= 0; }), function (s) { return s.minutes; });

    var platformMap = {};
    list.forEach(function (g) {
      var k = g.platform || '其他';
      if (!platformMap[k]) platformMap[k] = { platform: k, count: 0, minutes: 0 };
      platformMap[k].count += 1;
      platformMap[k].minutes += sum(ss.filter(function (s) { return s.gameId === g.id; }), function (s) { return s.minutes; });
    });

    var rated = list.filter(function (g) { return num(g.rating) > 0; });

    return {
      total: list.length,
      byStatus: byStatus,
      totalMinutes: totalMinutes,
      totalHours: round1(totalMinutes / 60),
      weekMinutes: weekMinutes,
      weekHours: round1(weekMinutes / 60),
      weekSessions: ss.filter(function (s) { return week.indexOf(s.date) >= 0; }).length,
      avgRating: rated.length ? round1(sum(rated, function (g) { return g.rating; }) / rated.length) : 0,
      byPlatform: Object.keys(platformMap).map(function (k) { return platformMap[k]; }).sort(function (a, b) { return b.minutes - a.minutes; })
    };
  }

  /* ---------------- 备份校验 ---------------- */

  var APP_ID = 'myapp';
  var KNOWN_KEYS = ['settings', 'notes', 'plans', 'media', 'dev', 'consult', 'fitness', 'diet', 'games'];

  function exportPayload(data) {
    return { app: APP_ID, schema: SCHEMA, exportedAt: nowISO(), data: data };
  }

  function validateImport(text) {
    var parsed;
    try {
      parsed = typeof text === 'string' ? JSON.parse(text) : text;
    } catch (e) {
      return { ok: false, error: '文件不是有效的 JSON，无法解析。' };
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, error: '文件内容不是 myapp 的备份格式。' };
    }
    if (parsed.app !== APP_ID) {
      return { ok: false, error: '这不是 myapp 的备份文件（缺少 app 标识）。' };
    }
    if (!parsed.data || typeof parsed.data !== 'object') {
      return { ok: false, error: '备份文件里没有 data 数据块。' };
    }
    var hasKnown = KNOWN_KEYS.some(function (k) { return parsed.data[k] !== undefined; });
    if (!hasKnown) {
      return { ok: false, error: '备份内容为空或结构不正确，已取消导入。' };
    }
    return { ok: true, data: normalizeData(parsed.data), schema: parsed.schema || SCHEMA };
  }

  return {
    SCHEMA: SCHEMA, APP_ID: APP_ID, WEEK_CN: WEEK_CN,
    uid: uid, num: num, clamp: clamp, round1: round1, sum: sum, byId: byId, str: str,
    ymd: ymd, toDate: toDate, addDays: addDays, diffDays: diffDays,
    startOfWeek: startOfWeek, weekDates: weekDates, monthOf: monthOf, addMonths: addMonths,
    monthGrid: monthGrid, fmtDateCN: fmtDateCN, fmtDateShort: fmtDateShort, fmtMonthCN: fmtMonthCN, timeAgo: timeAgo,
    fmtNum: fmtNum, fmtMoney: fmtMoney, fmtPct: fmtPct, fmtDuration: fmtDuration,
    defaultData: defaultData, normalizeData: normalizeData,
    planStats: planStats, mediaStats: mediaStats, devStats: devStats, consultStats: consultStats,
    fitnessStats: fitnessStats, dietDay: dietDay, dietRange: dietRange, gamesStats: gamesStats,
    exportPayload: exportPayload, validateImport: validateImport, nowISO: nowISO
  };
});
