/*!
 * views/home.js — 首页总览
 */
window.Views = window.Views || {};
(function () {
  'use strict';
  var Core = window.Core, Store = window.Store, UI = window.UI;

  function greeting() {
    var h = new Date().getHours();
    if (h < 5) return '凌晨好';
    if (h < 9) return '早上好';
    if (h < 12) return '上午好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  }

  function summaryCard(key, opts) {
    var m = UI.MODULES[key];
    return '<div class="card summary-card" data-act="go" data-key="' + key + '" style="--accent:' + m.color + '">' +
      '<div class="top"><span class="badge-ico">' + UI.icon(m.icon) + '</span>' +
        '<span class="name grow">' + m.name + '</span>' + UI.icon('chevronRight', 14) + '</div>' +
      '<div class="nums"><b>' + opts.main + '</b><small>' + (opts.unit || '') + '</small></div>' +
      '<div class="line"><span>' + opts.lineLeft + '</span><span>' + opts.lineRight + '</span></div>' +
      (opts.progress !== undefined ? '<div class="progress ' + (opts.progress >= 100 ? 'ok' : '') + '"><i style="width:' + Math.min(100, opts.progress) + '%"></i></div>' : '') +
    '</div>';
  }

  function render(el) {
    var st = Store.get();
    var today = Core.ymd(new Date());
    var planDay = st.plans[today] || { items: [], review: '' };
    var ps = Core.planStats(planDay);
    var ws = st.settings.weekStart;
    var week = Core.weekDates(today, ws);

    var media = Core.mediaStats(st.media.posts, { today: today, days: 30 });
    var weekPosts = st.media.posts.filter(function (p) { return p.publishDate && week.indexOf(p.publishDate) >= 0; }).length;
    var dev = Core.devStats(st.dev.items, { today: today, weekStart: ws });
    var consult = Core.consultStats(st.consult.clients, st.consult.sessions, { today: today });
    var fit = Core.fitnessStats(st.fitness.sessions, { today: today, month: Core.monthOf(today), weekStart: ws });
    var diet = Core.dietDay(st.diet.meals, today, st.settings.dietTargets, st.diet.water[today]);
    var games = Core.gamesStats(st.games.games, st.games.sessions, { today: today, weekStart: ws });

    var openItems = planDay.items.filter(function (i) { return !i.done; }).slice(0, 6);
    var doneCount = planDay.items.filter(function (i) { return i.done; }).length;
    var notes = st.notes.slice().sort(function (a, b) {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.createdAt < b.createdAt ? 1 : -1;
    }).slice(0, 8);

    el.innerHTML =
      '<div class="hero">' +
        '<div>' +
          '<h2>' + greeting() + '，' + UI.esc(st.settings.name || '我') + '</h2>' +
          '<p>' + Core.fmtDateCN(today) + ' · 今天有 ' + ps.open + ' 件事等着你，已完成 ' + ps.done + ' 件</p>' +
        '</div>' +
        '<div class="hero-stats">' +
          '<div><b>' + ps.rate + '%</b><span>今日完成</span></div>' +
          '<div><b>' + weekPosts + '</b><span>本周发布</span></div>' +
          '<div><b>' + fit.streak + '</b><span>连续训练(天)</span></div>' +
        '</div>' +
      '</div>' +

      '<div class="grid g-home mt-16">' +
        '<div class="stack">' +
          '<div class="card">' +
            '<div class="card-head">' +
              '<div class="card-title">' + UI.icon('checkSquare') + ' 今日计划' +
                '<span class="tag brand">' + ps.done + '/' + ps.total + '</span></div>' +
              '<div class="row"><button class="btn btn-sm btn-ghost" data-act="go" data-key="plan">查看全部' + UI.icon('chevronRight', 13) + '</button></div>' +
            '</div>' +
            '<div class="progress ' + (ps.rate === 100 && ps.total ? 'ok' : '') + '" style="margin-bottom:12px"><i style="width:' + ps.rate + '%"></i></div>' +
            (openItems.length ? '<div>' + openItems.map(function (it) {
              return '<div class="plan-item" data-id="' + it.id + '">' +
                '<button class="check" data-act="toggle" data-id="' + it.id + '" aria-label="完成">' + UI.icon('check', 12) + '</button>' +
                '<div class="grow"><div class="plan-title">' + UI.esc(it.title) + '</div>' +
                  '<div class="plan-meta">' + (it.time ? '<span class="tag">' + UI.esc(it.time) + '</span>' : '') + UI.moduleTag(it.module) + '</div></div>' +
              '</div>';
            }).join('') + '</div>'
              : (ps.total ? '<div class="empty" style="padding:16px"><b>今天的事都做完了 🎉</b><p>共 ' + ps.total + ' 项，全部完成</p></div>'
                : UI.emptyState('checkSquare', '今天还没有安排', '在下面直接写一件要做的事'))) +
            '<div class="quick-add mt-12">' +
              '<input class="input" id="homeQuick" placeholder="加一件事到今天，回车确认…">' +
              '<button class="btn btn-soft" data-act="quick-add">' + UI.icon('plus', 14) + '</button>' +
            '</div>' +
          '</div>' +

          '<div class="card">' +
            '<div class="card-head">' +
              '<div class="card-title">' + UI.icon('note') + ' 快速备忘 <span class="tag">' + st.notes.length + '</span></div>' +
              '<span class="small muted">顺手记，不占今日计划</span>' +
            '</div>' +
            '<div class="quick-add" style="margin-bottom:10px">' +
              '<input class="input" id="noteInput" placeholder="想到什么就记一句…">' +
              '<button class="btn btn-soft" data-act="note-add">记下</button>' +
            '</div>' +
            (notes.length ? '<div>' + notes.map(function (n) {
              return '<div class="note-item' + (n.pinned ? ' pinned' : '') + '">' +
                '<span style="color:var(--text-mute);margin-top:2px">' + UI.icon(n.pinned ? 'pin' : 'note', 14) + '</span>' +
                '<div class="grow"><div class="txt">' + UI.esc(n.text) + '</div>' +
                  '<div class="small muted" style="font-size:11px">' + Core.timeAgo(n.createdAt) + '</div></div>' +
                '<button class="icon-btn" data-act="note-pin" data-id="' + n.id + '" title="置顶/取消置顶">' + UI.icon('pin') + '</button>' +
                '<button class="icon-btn danger" data-act="note-del" data-id="' + n.id + '" title="删除">' + UI.icon('trash') + '</button>' +
              '</div>';
            }).join('') + '</div>' : UI.emptyState('note', '还没有备忘', '临时想法、灵感、待查资料都可以先丢在这里')) +
          '</div>' +
        '</div>' +

        '<div class="stack">' +
          '<div class="grid g-2">' +
            summaryCard('media', {
              main: weekPosts, unit: '条 / 本周发布',
              lineLeft: '近30天播放 ' + Core.fmtNum(media.views),
              lineRight: '互动率 ' + media.engagement + '%'
            }) +
            summaryCard('dev', {
              main: dev.doing, unit: '项进行中',
              lineLeft: '待办 ' + dev.todo + ' · 评审 ' + dev.review,
              lineRight: dev.overdue ? '<span style="color:var(--danger)">逾期 ' + dev.overdue + '</span>' : '无逾期'
            }) +
            summaryCard('consult', {
              main: consult.active, unit: '位活跃客户',
              lineLeft: '本月收入 ' + Core.fmtMoney(consult.monthRevenue),
              lineRight: '累计 ' + Core.fmtMoney(consult.revenue)
            }) +
            summaryCard('fitness', {
              main: fit.weekDays, unit: '天 / 本周训练',
              lineLeft: '连续打卡 ' + fit.streak + ' 天',
              lineRight: '本月 ' + fit.monthDays + ' 天'
            }) +
            summaryCard('diet', {
              main: Core.fmtNum(diet.kcal), unit: 'kcal / ' + Core.fmtNum(diet.kcalTarget),
              lineLeft: diet.remaining >= 0 ? '还可摄入 ' + Core.fmtNum(diet.remaining) + ' kcal' : '超出 ' + Core.fmtNum(-diet.remaining) + ' kcal',
              lineRight: '蛋白 ' + diet.protein + 'g',
              progress: diet.pct
            }) +
            summaryCard('games', {
              main: games.weekHours, unit: '小时 / 本周',
              lineLeft: '在玩 ' + games.byStatus.playing + ' 款',
              lineRight: '总时长 ' + games.totalHours + ' h'
            }) +
          '</div>' +
          '<div class="hint-box">' + UI.icon('info') +
            '<div>这里是只读汇总。数字都来自各模块的真实记录，点卡片进入对应模块维护。</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    /* ---- 事件 ---- */

    UI.bind(el, 'click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.dataset.act, id = btn.dataset.id;

      if (act === 'go') { window.App.go(btn.dataset.key); return; }

      if (act === 'toggle') {
        Store.update(function (s) {
          var d = s.plans[today] || (s.plans[today] = { items: [], review: '' });
          var it = Core.byId(d.items, id);
          if (it) { it.done = !it.done; it.doneAt = it.done ? Core.nowISO() : ''; }
        }, 'home-toggle');
        render(el);
      } else if (act === 'quick-add') {
        var input = el.querySelector('#homeQuick');
        var title = (input.value || '').trim();
        if (!title) { input.focus(); return; }
        Store.update(function (s) {
          var d = s.plans[today] || (s.plans[today] = { items: [], review: '' });
          d.items.push({
            id: Core.uid('plan'), title: title, module: 'plan', time: '', priority: 'mid',
            done: false, doneAt: '', note: '', source: null, createdAt: Core.nowISO()
          });
        }, 'home-quick-add');
        render(el);
        UI.toast('已加入今日计划', 'ok', 1400);
      } else if (act === 'note-add') {
        var ni = el.querySelector('#noteInput');
        var text = (ni.value || '').trim();
        if (!text) { ni.focus(); return; }
        Store.update(function (s) {
          s.notes.push({ id: Core.uid('note'), text: text, pinned: false, createdAt: Core.nowISO() });
        }, 'note-add');
        render(el);
      } else if (act === 'note-del') {
        Store.update(function (s) { s.notes = s.notes.filter(function (n) { return n.id !== id; }); }, 'note-del');
        render(el);
      } else if (act === 'note-pin') {
        Store.update(function (s) {
          var n = Core.byId(s.notes, id);
          if (n) n.pinned = !n.pinned;
        }, 'note-pin');
        render(el);
      }
    });

    var q = el.querySelector('#homeQuick');
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); el.querySelector('[data-act="quick-add"]').click(); }
    });
    var ni = el.querySelector('#noteInput');
    ni.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); el.querySelector('[data-act="note-add"]').click(); }
    });
  }

  window.Views.home = {
    title: '首页总览',
    sub: function () {
      var st = Store.get();
      var open = (st.plans[Core.ymd(new Date())] || { items: [] }).items.filter(function (i) { return !i.done; }).length;
      return '今天还有 ' + open + ' 件未完成 · 数据保存在本机，随时可导出备份';
    },
    render: render
  };
})();
