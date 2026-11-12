/*!
 * views/plan.js — 今日计划
 */
window.Views = window.Views || {};
(function () {
  'use strict';
  var Core = window.Core, Store = window.Store, UI = window.UI;

  var selected = Core.ymd(new Date());
  var reviewTimer = null;

  var PRIO_OPTS = [{ v: 'high', t: '高' }, { v: 'mid', t: '中' }, { v: 'low', t: '低' }];

  function moduleOpts() {
    return Object.keys(UI.MODULES).map(function (k) { return { v: k, t: UI.MODULES[k].name }; });
  }

  function day(date) {
    var d = Store.get().plans[date];
    return d || { items: [], review: '' };
  }

  function ensureDay(state, date) {
    if (!state.plans[date]) state.plans[date] = { items: [], review: '' };
    return state.plans[date];
  }

  function sorted(items) {
    var rank = { high: 0, mid: 1, low: 2 };
    return items.slice().sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (a.time && b.time && a.time !== b.time) return a.time < b.time ? -1 : 1;
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      var d = (rank[a.priority] || 1) - (rank[b.priority] || 1);
      if (d) return d;
      return a.createdAt < b.createdAt ? -1 : 1;
    });
  }

  function itemHTML(it) {
    return '<div class="plan-item' + (it.done ? ' done' : '') + '" data-id="' + it.id + '">' +
      '<button class="check' + (it.done ? ' on' : '') + '" data-act="toggle" data-id="' + it.id + '" aria-label="完成">' + UI.icon('check', 12) + '</button>' +
      '<div class="grow">' +
        '<div class="plan-title">' + UI.esc(it.title) + '</div>' +
        '<div class="plan-meta">' +
          (it.priority !== 'low' ? '<span class="prio ' + it.priority + '" title="' + (it.priority === 'high' ? '高优先' : '中优先') + '"></span>' : '') +
          (it.time ? '<span class="tag">' + UI.icon('clock', 11) + ' ' + UI.esc(it.time) + '</span>' : '') +
          UI.moduleTag(it.module) +
          (it.source ? '<span class="tag info">来自模块</span>' : '') +
          (it.note ? '<span class="tag">' + UI.esc(it.note.slice(0, 16)) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="row" style="gap:0">' +
        '<button class="icon-btn" data-act="edit" data-id="' + it.id + '" title="编辑">' + UI.icon('edit') + '</button>' +
        '<button class="icon-btn danger" data-act="del" data-id="' + it.id + '" title="删除">' + UI.icon('trash') + '</button>' +
      '</div>' +
    '</div>';
  }

  function itemForm(values, after) {
    UI.formModal({
      title: values && values.id ? '编辑事项' : '新增今日事项',
      desc: '日期：' + Core.fmtDateCN(selected),
      fields: [
        { key: 'title', label: '要做什么', type: 'text', required: true, span: 2, placeholder: '例如：把首页的进度环调好' },
        { key: 'module', label: '所属方向', type: 'select', options: moduleOpts() },
        { key: 'priority', label: '优先级', type: 'select', options: PRIO_OPTS },
        { key: 'time', label: '时间点（可选）', type: 'time', hint: '例如 09:30，会排在列表前面' },
        { key: 'note', label: '备注（可选）', type: 'text' }
      ],
      values: values || { module: 'plan', priority: 'mid', time: '', note: '' },
      onSubmit: function (v) { after(v); }
    });
  }

  function render(el) {
    var state = Store.get();
    var d = day(selected);
    var stats = Core.planStats(d);
    var items = sorted(d.items);
    var open = items.filter(function (i) { return !i.done; });
    var done = items.filter(function (i) { return i.done; });
    var isToday = selected === Core.ymd(new Date());
    var ws = state.settings.weekStart;
    var week = Core.weekDates(selected, ws);

    var strip = week.map(function (date) {
      var dd = day(date);
      var hasOpen = dd.items.some(function (i) { return !i.done; });
      var w = ['日', '一', '二', '三', '四', '五', '六'][Core.toDate(date).getDay()];
      return '<button class="day' + (date === selected ? ' active' : '') + (hasOpen ? ' has' : '') + '" data-act="pick" data-date="' + date + '">' +
        '<span>' + w + '</span><b>' + Number(date.slice(8, 10)) + '</b><i class="pip"></i></button>';
    }).join('');

    el.innerHTML =
      '<div class="card">' +
        '<div class="spread" style="margin-bottom:12px;flex-wrap:wrap;gap:10px">' +
          '<div class="row">' +
            '<button class="icon-btn" data-act="prev" title="前一天">' + UI.icon('chevronLeft', 17) + '</button>' +
            '<div style="min-width:0">' +
              '<div class="cal-title">' + Core.fmtDateCN(selected) + (isToday ? ' <span class="tag brand">今天</span>' : '') + '</div>' +
              '<div class="small muted">' + (stats.total ? '共 ' + stats.total + ' 项 · 已完成 ' + stats.done + ' 项' : '这一天还没有安排') + '</div>' +
            '</div>' +
            '<button class="icon-btn" data-act="next" title="后一天">' + UI.icon('chevronRight', 17) + '</button>' +
          '</div>' +
          '<div class="row">' +
            '<input type="date" class="input" id="datePick" value="' + selected + '" style="width:150px">' +
            '<button class="btn btn-sm" data-act="today">回到今天</button>' +
            '<button class="btn btn-primary btn-sm" data-act="add">' + UI.icon('plus', 14) + ' 新增事项</button>' +
          '</div>' +
        '</div>' +
        '<div class="day-strip">' + strip + '</div>' +
      '</div>' +

      '<div class="grid g-home mt-16">' +
        '<div class="stack">' +
          '<div class="card">' +
            '<div class="card-head">' +
              '<div class="card-title">' + UI.icon('checkSquare') + ' 待办清单</div>' +
              '<div class="small muted">' + stats.rate + '% 完成</div>' +
            '</div>' +
            '<div class="progress ' + (stats.rate === 100 ? 'ok' : '') + '" style="margin-bottom:12px"><i style="width:' + stats.rate + '%"></i></div>' +
            '<div class="quick-add" style="margin-bottom:10px">' +
              '<input class="input" id="quickTitle" placeholder="快速添加一件事，回车确认…">' +
              '<button class="btn btn-soft" data-act="quick-add">' + UI.icon('plus', 14) + ' 添加</button>' +
            '</div>' +
            (items.length ? (
              '<div>' + open.map(itemHTML).join('') +
              (done.length ? '<div class="divider"></div><div class="small muted" style="padding:0 8px 4px">已完成 ' + done.length + ' 项</div>' + done.map(itemHTML).join('') : '') +
              '</div>'
            ) : UI.emptyState('checkSquare', '这一天还没有安排', '在上面输入框写点什么，或从自媒体/开发/咨询/健身模块把事项加进来', '')) +
            (done.length ? '<div class="mt-12" style="text-align:right"><button class="btn btn-sm btn-ghost" data-act="clear-done">清理已完成（' + done.length + '）</button></div>' : '') +
          '</div>' +
        '</div>' +

        '<div class="stack">' +
          '<div class="card">' +
            '<div class="card-head"><div class="card-title">' + UI.icon('target') + ' 完成情况</div></div>' +
            '<div class="row" style="gap:16px">' +
              UI.ring(stats.rate, { size: 74, stroke: 8 }) +
              '<div class="grow">' +
                '<div class="spread small"><span class="dim">未完成</span><b class="mono">' + stats.open + ' 项</b></div>' +
                '<div class="spread small mt-8"><span class="dim">高优先未完成</span><b class="mono" style="color:var(--danger)">' + stats.highOpen + ' 项</b></div>' +
                '<div class="spread small mt-8"><span class="dim">来自其他模块</span><b class="mono">' + d.items.filter(function (i) { return i.source; }).length + ' 项</b></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="card">' +
            '<div class="card-head"><div class="card-title">' + UI.icon('note') + ' 当日复盘</div><span class="small muted">自动保存</span></div>' +
            '<textarea class="textarea" id="review" placeholder="今天推进了什么？卡在哪里？明天第一件事做什么？" style="min-height:120px">' + UI.esc(d.review) + '</textarea>' +
          '</div>' +
          '<div class="hint-box">' + UI.icon('info') +
            '<div>各模块里的「加入今日计划」会把事项带到这里；勾选完成不会自动改模块状态，避免误操作。</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    /* ---- 事件 ---- */

    el.querySelectorAll('[data-act="pick"]').forEach(function (b) {
      b.addEventListener('click', function () { selected = b.dataset.date; render(el); });
    });
    el.querySelector('[data-act="prev"]').addEventListener('click', function () {
      selected = Core.addDays(selected, -1); render(el);
    });
    el.querySelector('[data-act="next"]').addEventListener('click', function () {
      selected = Core.addDays(selected, 1); render(el);
    });
    el.querySelector('[data-act="today"]').addEventListener('click', function () {
      selected = Core.ymd(new Date()); render(el);
    });
    var dp = el.querySelector('#datePick');
    dp.addEventListener('change', function () {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dp.value)) { selected = dp.value; render(el); }
    });

    function addQuick() {
      var input = el.querySelector('#quickTitle');
      var title = (input.value || '').trim();
      if (!title) { input.focus(); return; }
      Store.update(function (s) {
        var d2 = ensureDay(s, selected);
        d2.items.push({
          id: Core.uid('plan'), title: title, module: 'plan', time: '', priority: 'mid',
          done: false, doneAt: '', note: '', source: null, createdAt: Core.nowISO()
        });
      }, 'plan-add');
      render(el);
    }

    el.querySelector('[data-act="quick-add"]').addEventListener('click', addQuick);
    el.querySelector('#quickTitle').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addQuick(); }
    });

    el.querySelector('[data-act="add"]').addEventListener('click', function () {
      itemForm(null, function (v) {
        Store.update(function (s) {
          var d2 = ensureDay(s, selected);
          d2.items.push({
            id: Core.uid('plan'), title: v.title, module: v.module, time: v.time, priority: v.priority,
            done: false, doneAt: '', note: v.note, source: null, createdAt: Core.nowISO()
          });
        }, 'plan-add');
        render(el);
      });
    });

    UI.bind(el, 'click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.dataset.act, id = btn.dataset.id;
      if (act === 'toggle') {
        Store.update(function (s) {
          var d2 = ensureDay(s, selected);
          var it = Core.byId(d2.items, id);
          if (it) { it.done = !it.done; it.doneAt = it.done ? Core.nowISO() : ''; }
        }, 'plan-toggle');
        render(el);
      } else if (act === 'del') {
        Store.update(function (s) {
          var d2 = ensureDay(s, selected);
          d2.items = d2.items.filter(function (i) { return i.id !== id; });
        }, 'plan-del');
        render(el);
      } else if (act === 'edit') {
        var it = Core.byId(day(selected).items, id);
        if (!it) return;
        itemForm(it, function (v) {
          Store.update(function (s) {
            var d2 = ensureDay(s, selected);
            var target = Core.byId(d2.items, id);
            if (target) {
              target.title = v.title; target.module = v.module; target.time = v.time;
              target.priority = v.priority; target.note = v.note;
            }
          }, 'plan-edit');
          render(el);
        });
      } else if (act === 'clear-done') {
        UI.confirm({
          title: '清理已完成事项',
          message: '这一天已完成的 ' + done.length + ' 项会被删除，未完成的不受影响。',
          confirmText: '清理',
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          Store.update(function (s) {
            var d2 = ensureDay(s, selected);
            d2.items = d2.items.filter(function (i) { return !i.done; });
          }, 'plan-clear');
          render(el);
        });
      }
    });

    var review = el.querySelector('#review');
    review.addEventListener('input', function () {
      clearTimeout(reviewTimer);
      reviewTimer = setTimeout(function () {
        Store.update(function (s) {
          var d2 = ensureDay(s, selected);
          d2.review = review.value;
        }, 'plan-review');
      }, 350);
    });
  }

  window.Views.plan = {
    title: '今日计划',
    sub: function () { return '以日期为中心，一天一页 · 各模块的事项都可以排进来'; },
    render: render
  };
})();
