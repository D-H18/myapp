/*!
 * views/dev.js — 开发工作：项目 + 工作项看板
 */
window.Views = window.Views || {};
(function () {
  'use strict';
  var Core = window.Core, Store = window.Store, UI = window.UI;

  var filterProject = 'all';
  var filterType = 'all';

  var STATUS = [
    { key: 'todo', name: '待办' },
    { key: 'doing', name: '进行中' },
    { key: 'review', name: '评审中' },
    { key: 'done', name: '已完成' }
  ];

  var TYPES = {
    feature: { name: '需求', cls: 'brand' },
    bug: { name: '缺陷', cls: 'danger' },
    task: { name: '任务', cls: '' },
    debt: { name: '技术债', cls: 'warn' }
  };

  var COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899'];

  function projectOpts() {
    return [{ v: '', t: '未归类' }].concat(Store.get().dev.projects.map(function (p) {
      return { v: p.id, t: p.name };
    }));
  }

  function projectOf(id) {
    return Core.byId(Store.get().dev.projects, id);
  }

  /* ---- 表单 ---- */

  function itemForm(item) {
    UI.formModal({
      title: item ? '编辑工作项' : '新增工作项',
      desc: '工作项会进入对应状态列，可在看板上直接移动',
      wide: true,
      fields: [
        { key: 'title', label: '标题', type: 'text', required: true, span: 2, placeholder: '例如：修复详情页在 Safari 下的布局错位' },
        { key: 'projectId', label: '所属项目', type: 'select', options: projectOpts() },
        { key: 'type', label: '类型', type: 'select', options: Object.keys(TYPES).map(function (k) { return { v: k, t: TYPES[k].name }; }) },
        { key: 'status', label: '状态', type: 'select', options: STATUS.map(function (s) { return { v: s.key, t: s.name }; }) },
        { key: 'priority', label: '优先级', type: 'select', options: [{ v: 'high', t: '高' }, { v: 'mid', t: '中' }, { v: 'low', t: '低' }] },
        { key: 'estimate', label: '预估工时（小时）', type: 'number', min: 0, step: 0.5 },
        { key: 'due', label: '截止日期', type: 'date' },
        { key: 'note', label: '备注', type: 'textarea', span: 2 }
      ],
      values: item || { projectId: '', type: 'task', status: 'todo', priority: 'mid', estimate: 1, due: '', note: '' },
      onSubmit: function (v) {
        Store.update(function (s) {
          if (item) {
            var it = Core.byId(s.dev.items, item.id);
            if (it) {
              it.title = v.title; it.projectId = v.projectId; it.type = v.type; it.status = v.status;
              it.priority = v.priority; it.estimate = v.estimate; it.due = v.due; it.note = v.note;
              if (v.status === 'done' && !it.doneAt) it.doneAt = Core.nowISO();
              if (v.status !== 'done') it.doneAt = '';
            }
          } else {
            s.dev.items.push({
              id: Core.uid('task'), title: v.title, projectId: v.projectId, type: v.type, status: v.status,
              priority: v.priority, estimate: v.estimate, due: v.due, doneAt: v.status === 'done' ? Core.nowISO() : '',
              note: v.note, createdAt: Core.nowISO()
            });
          }
        }, 'dev-item');
        renderAfter();
      }
    });
  }

  function projectForm(proj, after) {
    UI.formModal({
      title: proj ? '编辑项目' : '新建项目',
      fields: [
        { key: 'name', label: '项目名称', type: 'text', required: true, span: 2, placeholder: '例如：客户官网改版' },
        { key: 'color', label: '颜色', type: 'select', options: COLORS.map(function (c) { return { v: c, t: c }; }) },
        { key: 'note', label: '备注', type: 'text' }
      ],
      values: proj || { name: '', color: COLORS[Store.get().dev.projects.length % COLORS.length], note: '' },
      onSubmit: function (v) {
        Store.update(function (s) {
          if (proj) {
            var p = Core.byId(s.dev.projects, proj.id);
            if (p) { p.name = v.name; p.color = v.color; p.note = v.note; }
          } else {
            s.dev.projects.push({ id: Core.uid('proj'), name: v.name, color: v.color, note: v.note });
          }
        }, 'dev-project');
        renderAfter();
        if (typeof after === 'function') after();
      }
    });
  }

  function renderAfter() {
    var host = document.querySelector('#view > div');
    if (host) render(host);
  }

  /* ---- 项目管理弹窗 ---- */

  function projectManager() {
    var m = UI.modal({
      title: '项目管理',
      desc: '项目用来给工作项分组，删除项目不会删除工作项',
      body: '<div id="projRows"></div>',
      foot: '<button class="btn" data-close-btn="1">关闭</button>' +
            '<button class="btn btn-primary" data-new="1">+ 新建项目</button>'
    });

    function paint() {
      var projects = Store.get().dev.projects;
      var rows = m.el.querySelector('#projRows');
      if (!projects.length) {
        rows.innerHTML = UI.emptyState('layers', '还没有项目', '新建一个项目，工作项就能按项目筛选了');
        return;
      }
      rows.innerHTML = projects.map(function (p) {
        var count = Store.get().dev.items.filter(function (i) { return i.projectId === p.id; }).length;
        return '<div class="spread" style="padding:9px 2px;border-bottom:1px solid var(--border)">' +
          '<div class="row"><span class="stripe" style="background:' + p.color + ';height:16px"></span>' +
          '<b style="font-size:13px">' + UI.esc(p.name) + '</b><span class="small muted">' + count + ' 项</span></div>' +
          '<div class="row" style="gap:2px">' +
            '<button class="icon-btn" data-pedit="' + p.id + '">' + UI.icon('edit', 14) + '</button>' +
            '<button class="icon-btn danger" data-pdel="' + p.id + '">' + UI.icon('trash', 14) + '</button>' +
          '</div></div>';
      }).join('');
    }

    paint();
    UI.bind(m.el, 'click', function (e) {
      var edit = e.target.closest('[data-pedit]');
      var del = e.target.closest('[data-pdel]');
      if (edit) projectForm(Core.byId(Store.get().dev.projects, edit.dataset.pedit), paint);
      if (del) {
        var id = del.dataset.pdel;
        UI.confirm({
          title: '删除项目', message: '项目下的工作项会变成「未归类」，不会被删除。',
          confirmText: '删除', danger: true
        }).then(function (ok) {
          if (!ok) return;
          Store.update(function (s) {
            s.dev.projects = s.dev.projects.filter(function (p) { return p.id !== id; });
            s.dev.items.forEach(function (i) { if (i.projectId === id) i.projectId = ''; });
          }, 'dev-project-del');
          paint();
          renderAfter();
        });
      }
    });
    m.el.querySelector('[data-new]').addEventListener('click', function () { projectForm(null, paint); });
    m.el.querySelector('[data-close-btn]').addEventListener('click', m.close);
  }

  /* ---- 渲染 ---- */

  function cardHTML(it, today) {
    var proj = projectOf(it.projectId);
    var t = TYPES[it.type] || TYPES.task;
    var overdue = it.status !== 'done' && it.due && it.due < today;
    var idx = STATUS.findIndex(function (s) { return s.key === it.status; });
    var inPlan = UI.inPlanToday(it.id);

    return '<div class="kcard">' +
      '<div class="row" style="align-items:flex-start;gap:7px">' +
        '<span class="stripe" style="background:' + (proj ? proj.color : 'var(--border-strong)') + '"></span>' +
        '<div class="grow"><div class="title">' + UI.esc(it.title) + '</div></div>' +
      '</div>' +
      '<div class="meta">' +
        '<span class="tag ' + t.cls + '">' + t.name + '</span>' +
        (proj ? '<span class="tag">' + UI.esc(proj.name) + '</span>' : '') +
        (it.priority === 'high' ? '<span class="tag danger">高优先</span>' : '') +
        (it.due ? '<span class="tag ' + (overdue ? 'danger' : '') + '">' + Core.fmtDateShort(it.due) + (overdue ? ' 逾期' : '') + '</span>' : '') +
        (it.estimate ? '<span class="tag">' + it.estimate + 'h</span>' : '') +
        (inPlan ? '<span class="tag info">已排入今日</span>' : '') +
      '</div>' +
      '<div class="ops">' +
        '<button class="icon-btn" data-act="move" data-id="' + it.id + '" data-dir="-1" title="左移"' + (idx === 0 ? ' disabled style="opacity:.3"' : '') + '>' + UI.icon('chevronLeft', 14) + '</button>' +
        '<button class="icon-btn" data-act="move" data-id="' + it.id + '" data-dir="1" title="右移"' + (idx === STATUS.length - 1 ? ' disabled style="opacity:.3"' : '') + '>' + UI.icon('chevronRight', 14) + '</button>' +
        '<span class="spacer"></span>' +
        '<button class="icon-btn" data-act="plan" data-id="' + it.id + '" title="加入今日计划">' + UI.icon('target', 14) + '</button>' +
        '<button class="icon-btn" data-act="edit" data-id="' + it.id + '" title="编辑">' + UI.icon('edit', 14) + '</button>' +
        '<button class="icon-btn danger" data-act="del" data-id="' + it.id + '" title="删除">' + UI.icon('trash', 14) + '</button>' +
      '</div>' +
    '</div>';
  }

  function render(el) {
    var st = Store.get();
    var today = Core.ymd(new Date());
    var s = Core.devStats(st.dev.items, { today: today, weekStart: st.settings.weekStart });

    var items = st.dev.items.filter(function (i) {
      if (filterProject !== 'all' && i.projectId !== filterProject) return false;
      if (filterType !== 'all' && i.type !== filterType) return false;
      return true;
    });

    var rank = { high: 0, mid: 1, low: 2 };
    function sortItems(list) {
      return list.slice().sort(function (a, b) {
        var p = (rank[a.priority] || 1) - (rank[b.priority] || 1);
        if (p) return p;
        if (a.due && b.due) return a.due < b.due ? -1 : 1;
        if (a.due) return -1;
        if (b.due) return 1;
        return a.createdAt < b.createdAt ? 1 : -1;
      });
    }

    el.innerHTML =
      '<div class="grid g-4">' +
        UI.statCard('待办', s.todo, '还没开始', 'layers') +
        UI.statCard('进行中', s.doing, '评审中 ' + s.review + ' 项', 'play') +
        UI.statCard('本周完成', s.doneThisWeek, '累计完成 ' + s.done + ' / ' + s.total, 'check') +
        UI.statCard('逾期', '<span style="color:' + (s.overdue ? 'var(--danger)' : 'inherit') + '">' + s.overdue + '</span>', '3 天内到期 ' + s.dueSoon + ' 项', 'alert') +
      '</div>' +

      '<div class="card mt-16">' +
        '<div class="spread" style="flex-wrap:wrap;gap:10px">' +
          '<div class="row wrap">' +
            '<span class="small muted">项目</span>' +
            '<button class="chip ' + (filterProject === 'all' ? 'active' : '') + '" data-act="filter-proj" data-key="all">全部</button>' +
            st.dev.projects.map(function (p) {
              return '<button class="chip ' + (filterProject === p.id ? 'active' : '') + '" data-act="filter-proj" data-key="' + p.id + '">' +
                '<span style="width:7px;height:7px;border-radius:50%;background:' + p.color + '"></span>' + UI.esc(p.name) + '</button>';
            }).join('') +
            '<button class="chip" data-act="filter-proj" data-key="">未归类</button>' +
            '<button class="chip" data-act="manage-projects" title="管理项目">' + UI.icon('settings', 13) + '</button>' +
          '</div>' +
          '<div class="row">' +
            '<select class="select" id="typeFilter" style="width:120px;height:32px">' +
              '<option value="all">全部类型</option>' +
              Object.keys(TYPES).map(function (k) {
                return '<option value="' + k + '"' + (filterType === k ? ' selected' : '') + '>' + TYPES[k].name + '</option>';
              }).join('') +
            '</select>' +
            '<button class="btn btn-primary" data-act="add">' + UI.icon('plus', 15) + ' 新增工作项</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="kanban mt-16">' + STATUS.map(function (stg) {
        var list = sortItems(items.filter(function (i) { return i.status === stg.key; }));
        return '<div class="kcol">' +
          '<div class="kcol-head"><b>' + stg.name + '</b><span class="count">' + list.length + '</span></div>' +
          (list.length ? list.map(function (it) { return cardHTML(it, today); }).join('') : '<div class="kcol-empty">还没有工作项</div>') +
          '<button class="kcard-new mt-8" data-act="add" data-status="' + stg.key + '">+ 加到「' + stg.name + '」</button>' +
        '</div>';
      }).join('') + '</div>' +

      '<div class="hint-box mt-16">' + UI.icon('info') +
        '<div>用卡片底部的 ← → 移动状态；带截止日期且超期的会标红。需要今天做掉的事，点靶心图标加入今日计划。</div>' +
      '</div>';

    /* 事件 */
    var tf = el.querySelector('#typeFilter');
    tf.addEventListener('change', function () { filterType = tf.value; render(el); });

    UI.bind(el, 'click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.dataset.act;
      var id = btn.dataset.id;

      if (act === 'add') {
        itemForm(null);
      } else if (act === 'filter-proj') {
        filterProject = btn.dataset.key === 'all' ? 'all' : btn.dataset.key;
        render(el);
      } else if (act === 'manage-projects') {
        projectManager();
      } else if (act === 'edit') {
        itemForm(Core.byId(Store.get().dev.items, id));
      } else if (act === 'del') {
        UI.confirm({
          title: '删除工作项', message: '删除后无法恢复，确定要删除这条工作项吗？',
          confirmText: '删除', danger: true
        }).then(function (ok) {
          if (!ok) return;
          Store.update(function (s2) { s2.dev.items = s2.dev.items.filter(function (i) { return i.id !== id; }); }, 'dev-del');
          render(el);
        });
      } else if (act === 'move') {
        var dir = Number(btn.dataset.dir);
        var it = Core.byId(Store.get().dev.items, id);
        if (!it) return;
        var idx = STATUS.findIndex(function (s2) { return s2.key === it.status; });
        var next = STATUS[idx + dir];
        if (!next) return;
        Store.update(function (s2) {
          var t = Core.byId(s2.dev.items, id);
          if (!t) return;
          t.status = next.key;
          t.doneAt = next.key === 'done' ? Core.nowISO() : '';
        }, 'dev-move');
        render(el);
      } else if (act === 'plan') {
        var item = Core.byId(Store.get().dev.items, id);
        if (!item) return;
        var proj = projectOf(item.projectId);
        UI.addToPlan({
          title: item.title,
          module: 'dev',
          refId: item.id,
          priority: item.priority,
          note: proj ? proj.name : ''
        });
        render(el);
      }
    });
  }

  window.Views.dev = {
    title: '开发工作',
    sub: '项目 + 工作项看板 · 按状态推进，逾期自动标红',
    render: render
  };
})();
