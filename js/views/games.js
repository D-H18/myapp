/*!
 * views/games.js — 游戏娱乐：游戏库 + 游玩时长
 */
window.Views = window.Views || {};
(function () {
  'use strict';
  var Core = window.Core, Store = window.Store, UI = window.UI;

  var filter = 'all';

  var STATUS = [
    { key: 'wish', name: '想玩', cls: '', color: '#94a3b8' },
    { key: 'playing', name: '在玩', cls: 'brand', color: '#7c3aed' },
    { key: 'done', name: '已通关', cls: 'ok', color: '#10b981' },
    { key: 'paused', name: '搁置', cls: 'warn', color: '#f59e0b' }
  ];

  var PLATFORMS = ['PC', 'Switch', 'PS5', 'Xbox', '手机', '其他'];

  function statusOf(k) {
    return STATUS.find(function (s) { return s.key === k; }) || STATUS[0];
  }

  function gameForm(game) {
    UI.formModal({
      title: game ? '编辑游戏' : '新增游戏',
      fields: [
        { key: 'name', label: '游戏名称', type: 'text', required: true, span: 2, placeholder: '例如：塞尔达传说 王国之泪' },
        { key: 'platform', label: '平台', type: 'select', options: PLATFORMS.map(function (p) { return { v: p, t: p }; }) },
        { key: 'status', label: '状态', type: 'select', options: STATUS.map(function (s) { return { v: s.key, t: s.name }; }) },
        { key: 'rating', label: '评分（0-10）', type: 'number', min: 0, max: 10, step: 0.5 },
        { key: 'hours', label: '已玩时长（小时）', type: 'number', min: 0, step: 0.5, hint: '记录游玩会在此基础上累加展示' },
        { key: 'note', label: '备注', type: 'textarea', span: 2 }
      ],
      values: game || { name: '', platform: 'PC', status: 'wish', rating: 0, hours: 0, note: '' },
      onSubmit: function (v) {
        Store.update(function (s) {
          if (game) {
            var g = Core.byId(s.games.games, game.id);
            if (g) { g.name = v.name; g.platform = v.platform; g.status = v.status; g.rating = v.rating; g.hours = v.hours; g.note = v.note; }
          } else {
            s.games.games.push({
              id: Core.uid('game'), name: v.name, platform: v.platform, status: v.status,
              rating: v.rating, hours: v.hours, note: v.note, createdAt: Core.nowISO()
            });
          }
        }, 'games-game');
        window.App.refresh();
      }
    });
  }

  function sessionForm(game) {
    var games = Store.get().games.games;
    if (!games.length) { UI.toast('先添加一款游戏', 'err'); return; }
    UI.formModal({
      title: '记录一次游玩',
      desc: '时长会累加到本周与总计统计中',
      fields: [
        { key: 'gameId', label: '游戏', type: 'select', options: games.map(function (g) { return { v: g.id, t: g.name }; }) },
        { key: 'date', label: '日期', type: 'date', required: true },
        { key: 'minutes', label: '时长（分钟）', type: 'number', min: 0, step: 5 },
        { key: 'note', label: '备注（可选）', type: 'text' }
      ],
      values: { gameId: game ? game.id : games[0].id, date: Core.ymd(new Date()), minutes: 60, note: '' },
      onSubmit: function (v) {
        Store.update(function (s) {
          s.games.sessions.push({ id: Core.uid('gsess'), gameId: v.gameId, date: v.date, minutes: v.minutes, note: v.note });
        }, 'games-session');
        window.App.refresh();
        UI.toast('已记录 ' + v.minutes + ' 分钟', 'ok', 1400);
      }
    });
  }

  function gameCard(g, stats) {
    var sg = statusOf(g.status);
    var played = Core.sum(Store.get().games.sessions.filter(function (s) { return s.gameId === g.id; }), function (s) { return s.minutes; });
    var totalHours = Core.round1((Core.num(g.hours) * 60 + played) / 60);
    return '<div class="card gcard" style="--accent:' + sg.color + '">' +
      '<div class="cover"><span>' + UI.esc(g.name) + '</span></div>' +
      '<div class="row wrap" style="gap:5px">' +
        '<span class="tag" style="background:color-mix(in srgb, ' + sg.color + ' 14%, transparent);color:' + sg.color + '">' + sg.name + '</span>' +
        '<span class="tag">' + UI.esc(g.platform) + '</span>' +
        (g.rating ? '<span class="stars">' + '★'.repeat(Math.round(g.rating / 2)) + '<span class="muted">' + g.rating + '</span></span>' : '') +
      '</div>' +
      '<div class="spread small"><span class="muted">累计游玩</span><b class="mono">' + totalHours + ' 小时</b></div>' +
      (g.note ? '<div class="small muted truncate" title="' + UI.esc(g.note) + '">' + UI.esc(g.note) + '</div>' : '') +
      '<div class="row" style="gap:6px;margin-top:2px">' +
        '<button class="btn btn-sm btn-soft grow" data-act="play" data-id="' + g.id + '">' + UI.icon('play', 13) + ' 记录游玩</button>' +
        '<button class="icon-btn" data-act="edit" data-id="' + g.id + '">' + UI.icon('edit', 14) + '</button>' +
        '<button class="icon-btn danger" data-act="del" data-id="' + g.id + '">' + UI.icon('trash', 14) + '</button>' +
      '</div>' +
    '</div>';
  }

  function render(el) {
    var st = Store.get();
    var stats = Core.gamesStats(st.games.games, st.games.sessions, { today: Core.ymd(new Date()), weekStart: st.settings.weekStart });
    var list = st.games.games.filter(function (g) { return filter === 'all' || g.status === filter; });

    var recent = st.games.sessions.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 8);

    el.innerHTML =
      '<div class="grid g-4">' +
        UI.statCard('在玩游戏', stats.byStatus.playing + ' 款', '想玩 ' + stats.byStatus.wish + ' · 通关 ' + stats.byStatus.done, 'gamepad') +
        UI.statCard('本周时长', stats.weekHours + ' h', stats.weekSessions + ' 次游玩', 'clock') +
        UI.statCard('累计时长', stats.totalHours + ' h', '共 ' + stats.total + ' 款游戏', 'chart') +
        UI.statCard('平均评分', stats.avgRating || '—', '仅统计已评分', 'star') +
      '</div>' +

      '<div class="card mt-16">' +
        '<div class="spread" style="flex-wrap:wrap;gap:10px">' +
          '<div class="row wrap">' +
            '<button class="chip ' + (filter === 'all' ? 'active' : '') + '" data-act="filter" data-key="all">全部 ' + stats.total + '</button>' +
            STATUS.map(function (s) {
              return '<button class="chip ' + (filter === s.key ? 'active' : '') + '" data-act="filter" data-key="' + s.key + '">' +
                s.name + ' ' + stats.byStatus[s.key] + '</button>';
            }).join('') +
          '</div>' +
          '<div class="row">' +
            '<button class="btn btn-sm" data-act="play">' + UI.icon('play', 14) + ' 记录游玩</button>' +
            '<button class="btn btn-primary btn-sm" data-act="add">' + UI.icon('plus', 14) + ' 新增游戏</button>' +
          '</div>' +
        '</div>' +
        (list.length ? '<div class="grid g-3 mt-16">' + list.map(function (g) { return gameCard(g, stats); }).join('') + '</div>'
          : '<div class="mt-16">' + UI.emptyState('gamepad', '这里还没有游戏', '把想玩、在玩的游戏加进来，记录时长后能看到本周投入') + '</div>') +
      '</div>' +

      '<div class="card mt-16">' +
        '<div class="card-head"><div class="card-title">' + UI.icon('clock') + ' 最近游玩</div><span class="small muted">最近 8 条</span></div>' +
        (recent.length ? recent.map(function (s) {
          var g = Core.byId(st.games.games, s.gameId);
          return '<div class="timeline-item">' +
            '<span class="time">' + Core.fmtDateShort(s.date) + '</span>' +
            '<div class="grow"><div style="font-size:13px">' + (g ? UI.esc(g.name) : '<span class="muted">已删除的游戏</span>') + '</div>' +
              (s.note ? '<div class="small muted">' + UI.esc(s.note) + '</div>' : '') + '</div>' +
            '<span class="tag">' + Core.fmtDuration(s.minutes) + '</span>' +
            '<button class="icon-btn danger" data-act="del-session" data-id="' + s.id + '">' + UI.icon('trash', 14) + '</button>' +
          '</div>';
        }).join('') : '<div class="small muted">还没有游玩记录</div>') +
      '</div>';

    UI.bind(el, 'click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.dataset.act, id = btn.dataset.id;

      if (act === 'filter') { filter = btn.dataset.key; render(el); }
      else if (act === 'add') gameForm(null);
      else if (act === 'edit') gameForm(Core.byId(Store.get().games.games, id));
      else if (act === 'play') sessionForm(id ? Core.byId(Store.get().games.games, id) : null);
      else if (act === 'del') {
        var g = Core.byId(Store.get().games.games, id);
        UI.confirm({
          title: '删除游戏',
          message: '「' + UI.esc(g ? g.name : '') + '」及其游玩记录会被删除，统计会同步变化。',
          confirmText: '删除', danger: true
        }).then(function (ok) {
          if (!ok) return;
          Store.update(function (s) {
            s.games.games = s.games.games.filter(function (x) { return x.id !== id; });
            s.games.sessions = s.games.sessions.filter(function (x) { return x.gameId !== id; });
          }, 'games-del');
          render(el);
        });
      } else if (act === 'del-session') {
        Store.update(function (s) { s.games.sessions = s.games.sessions.filter(function (x) { return x.id !== id; }); }, 'games-del-session');
        render(el);
      }
    });
  }

  window.Views.games = {
    title: '游戏娱乐',
    sub: '游戏库 + 游玩时长 · 想玩、在玩、通关一目了然',
    render: render
  };
})();
