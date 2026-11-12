/*!
 * views/consult.js — 咨询工作：客户档案 + 咨询记录 + 收入
 */
window.Views = window.Views || {};
(function () {
  'use strict';
  var Core = window.Core, Store = window.Store, UI = window.UI;

  var tab = 'clients';
  var stageFilter = 'all';

  var STAGES = [
    { key: 'lead', name: '线索', cls: '', color: '#94a3b8' },
    { key: 'talking', name: '沟通中', cls: 'info', color: '#0ea5e9' },
    { key: 'signed', name: '已签约', cls: 'brand', color: '#6366f1' },
    { key: 'delivering', name: '交付中', cls: 'warn', color: '#f59e0b' },
    { key: 'done', name: '已结案', cls: 'ok', color: '#10b981' },
    { key: 'lost', name: '已流失', cls: 'danger', color: '#ef4444' }
  ];

  function stageOf(k) {
    return STAGES.find(function (s) { return s.key === k; }) || STAGES[0];
  }

  function clientOpts() {
    return Store.get().consult.clients.map(function (c) { return { v: c.id, t: c.name + (c.company ? ' · ' + c.company : '') }; });
  }

  function stageOpts() {
    return STAGES.map(function (s) { return { v: s.key, t: s.name }; });
  }

  /* ---- 表单 ---- */

  function clientForm(client) {
    UI.formModal({
      title: client ? '编辑客户' : '新增客户',
      desc: '客户阶段用来区分线索、沟通过、已签约和已结案',
      fields: [
        { key: 'name', label: '姓名 / 称呼', type: 'text', required: true, placeholder: '例如：张先生' },
        { key: 'company', label: '公司 / 身份', type: 'text', placeholder: '例如：某教育公司 运营负责人' },
        { key: 'contact', label: '联系方式', type: 'text', placeholder: '微信 / 手机 / 邮箱' },
        { key: 'stage', label: '阶段', type: 'select', options: stageOpts() },
        { key: 'tags', label: '标签（逗号分隔）', type: 'text', placeholder: '例如：转介绍, 长期' },
        { key: 'note', label: '备注', type: 'textarea', span: 2 }
      ],
      values: client || { name: '', company: '', contact: '', stage: 'lead', tags: '', note: '' },
      onSubmit: function (v) {
        Store.update(function (s) {
          if (client) {
            var c = Core.byId(s.consult.clients, client.id);
            if (c) { c.name = v.name; c.company = v.company; c.contact = v.contact; c.stage = v.stage; c.tags = v.tags; c.note = v.note; }
          } else {
            s.consult.clients.push({
              id: Core.uid('client'), name: v.name, company: v.company, contact: v.contact,
              stage: v.stage, tags: v.tags, note: v.note, createdAt: Core.nowISO()
            });
          }
        }, 'consult-client');
        window.App.refresh();
      }
    });
  }

  function sessionForm(session) {
    var clients = Store.get().consult.clients;
    if (!clients.length) {
      UI.toast('先添加一位客户，再记录咨询', 'err');
      return;
    }
    UI.formModal({
      title: session ? '编辑咨询记录' : '新增咨询记录',
      wide: true,
      fields: [
        { key: 'clientId', label: '客户', type: 'select', options: clientOpts() },
        { key: 'date', label: '日期', type: 'date', required: true },
        { key: 'minutes', label: '时长（分钟）', type: 'number', min: 0, step: 5 },
        { key: 'fee', label: '费用（元）', type: 'number', min: 0, step: 50 },
        { key: 'topic', label: '主题', type: 'text', span: 2, placeholder: '例如：第三季度增长方案复盘' },
        { key: 'note', label: '备注 / 结论', type: 'textarea', span: 2 }
      ],
      values: session || {
        clientId: clients[0].id, date: Core.ymd(new Date()), minutes: 60, fee: 0, topic: '', note: ''
      },
      onSubmit: function (v) {
        Store.update(function (s) {
          if (session) {
            var x = Core.byId(s.consult.sessions, session.id);
            if (x) {
              x.clientId = v.clientId; x.date = v.date; x.minutes = v.minutes;
              x.fee = v.fee; x.topic = v.topic; x.note = v.note;
            }
          } else {
            s.consult.sessions.push({
              id: Core.uid('session'), clientId: v.clientId, date: v.date,
              minutes: v.minutes, fee: v.fee, topic: v.topic, note: v.note
            });
          }
        }, 'consult-session');
        window.App.refresh();
        UI.toast('咨询记录已保存', 'ok', 1500);
      }
    });
  }

  /* ---- 渲染 ---- */

  function clientTable(st, stats) {
    var clients = st.consult.clients.filter(function (c) {
      return stageFilter === 'all' || c.stage === stageFilter;
    });
    clients = clients.slice().sort(function (a, b) {
      var ai = STAGES.findIndex(function (s) { return s.key === a.stage; });
      var bi = STAGES.findIndex(function (s) { return s.key === b.stage; });
      if (ai !== bi) return ai - bi;
      return a.createdAt < b.createdAt ? 1 : -1;
    });

    if (!clients.length) {
      return UI.emptyState('users', '还没有客户', '点右上角「新增客户」，把线索、沟通中、已签约的客户都记下来',
        '<button class="btn btn-primary btn-sm" data-act="add-client">+ 新增客户</button>');
    }

    return '<div class="table-scroll"><table class="table">' +
      '<thead><tr><th>客户</th><th>联系方式</th><th>阶段</th><th class="num">咨询次数</th>' +
      '<th class="num">累计费用</th><th>最近咨询</th><th style="width:120px"></th></tr></thead><tbody>' +
      clients.map(function (c) {
        var pc = stats.perClient[c.id] || { count: 0, fee: 0, lastDate: '' };
        var sg = stageOf(c.stage);
        return '<tr>' +
          '<td><div style="font-weight:600">' + UI.esc(c.name) + '</div>' +
            '<div class="small muted">' + UI.esc(c.company || '—') + '</div></td>' +
          '<td class="small dim">' + UI.esc(c.contact || '—') + '</td>' +
          '<td><span class="tag" style="background:color-mix(in srgb, ' + sg.color + ' 14%, transparent);color:' + sg.color + '">' + sg.name + '</span></td>' +
          '<td class="num">' + pc.count + '</td>' +
          '<td class="num">' + Core.fmtMoney(pc.fee) + '</td>' +
          '<td class="small dim mono">' + (pc.lastDate ? Core.fmtDateShort(pc.lastDate) : '—') + '</td>' +
          '<td><div class="row" style="justify-content:flex-end;gap:0">' +
            '<button class="icon-btn" data-act="plan" data-id="' + c.id + '" title="加入今日计划">' + UI.icon('target', 14) + '</button>' +
            '<button class="icon-btn" data-act="edit-client" data-id="' + c.id + '" title="编辑">' + UI.icon('edit', 14) + '</button>' +
            '<button class="icon-btn danger" data-act="del-client" data-id="' + c.id + '" title="删除">' + UI.icon('trash', 14) + '</button>' +
          '</div></td>' +
        '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  function sessionTable(st) {
    var list = st.consult.sessions.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    if (!list.length) {
      return UI.emptyState('clock', '还没有咨询记录', '每次咨询结束后记一条：时长、主题、费用',
        '<button class="btn btn-primary btn-sm" data-act="add-session">+ 新增咨询记录</button>');
    }
    return '<div class="table-scroll"><table class="table">' +
      '<thead><tr><th>日期</th><th>客户</th><th class="num">时长</th><th>主题</th><th class="num">费用</th><th></th></tr></thead><tbody>' +
      list.map(function (sx) {
        var c = Core.byId(st.consult.clients, sx.clientId);
        return '<tr>' +
          '<td class="mono small">' + Core.fmtDateShort(sx.date) + '</td>' +
          '<td>' + (c ? UI.esc(c.name) : '<span class="muted">已删除的客户</span>') + '</td>' +
          '<td class="num">' + Core.fmtDuration(sx.minutes) + '</td>' +
          '<td><div class="truncate" style="max-width:240px">' + UI.esc(sx.topic || '—') + '</div></td>' +
          '<td class="num">' + Core.fmtMoney(sx.fee) + '</td>' +
          '<td><div class="row" style="justify-content:flex-end;gap:0">' +
            '<button class="icon-btn" data-act="edit-session" data-id="' + sx.id + '">' + UI.icon('edit', 14) + '</button>' +
            '<button class="icon-btn danger" data-act="del-session" data-id="' + sx.id + '">' + UI.icon('trash', 14) + '</button>' +
          '</div></td>' +
        '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  function render(el) {
    var st = Store.get();
    var stats = Core.consultStats(st.consult.clients, st.consult.sessions, {});

    el.innerHTML =
      '<div class="grid g-4">' +
        UI.statCard('客户总数', stats.totalClients, '活跃 ' + stats.active + ' 位', 'users') +
        UI.statCard('本月收入', Core.fmtMoney(stats.monthRevenue), stats.monthSessions + ' 次咨询', 'chart') +
        UI.statCard('累计收入', Core.fmtMoney(stats.revenue), '均价 ' + Core.fmtMoney(stats.avgFee), 'target') +
        UI.statCard('累计时长', stats.hours + ' h', '共 ' + stats.sessionCount + ' 次咨询', 'clock') +
      '</div>' +

      '<div class="card mt-16">' +
        '<div class="spread" style="flex-wrap:wrap;gap:10px">' +
          '<div class="segmented">' +
            '<button data-act="tab" data-tab="clients" class="' + (tab === 'clients' ? 'active' : '') + '">客户（' + st.consult.clients.length + '）</button>' +
            '<button data-act="tab" data-tab="sessions" class="' + (tab === 'sessions' ? 'active' : '') + '">咨询记录（' + st.consult.sessions.length + '）</button>' +
          '</div>' +
          '<div class="row">' +
            '<button class="btn btn-sm" data-act="add-session">' + UI.icon('clock', 14) + ' 新增咨询记录</button>' +
            '<button class="btn btn-primary btn-sm" data-act="add-client">' + UI.icon('plus', 14) + ' 新增客户</button>' +
          '</div>' +
        '</div>' +

        (tab === 'clients' ? (
          '<div class="row wrap mt-12" style="margin-bottom:10px">' +
            '<button class="chip ' + (stageFilter === 'all' ? 'active' : '') + '" data-act="stage" data-key="all">全部</button>' +
            STAGES.map(function (s) {
              return '<button class="chip ' + (stageFilter === s.key ? 'active' : '') + '" data-act="stage" data-key="' + s.key + '">' +
                s.name + ' <span class="muted">' + stats.byStage[s.key] + '</span></button>';
            }).join('') +
          '</div>' + clientTable(st, stats)
        ) : sessionTable(st)) +
      '</div>' +

      '<div class="hint-box mt-16">' + UI.icon('info') +
        '<div>删除客户时，会一并删除该客户名下的 ' +
        '<b>咨询记录</b>；只想停用客户的话，把阶段改成「已流失」或「已结案」更安全。</div>' +
      '</div>';

    el.querySelectorAll('[data-act="tab"]').forEach(function (b) {
      b.addEventListener('click', function () { tab = b.dataset.tab; render(el); });
    });

    UI.bind(el, 'click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.dataset.act, id = btn.dataset.id;
      var s2 = Store.get();

      if (act === 'tab') return;

      if (act === 'add-client') clientForm(null);
      else if (act === 'add-session') sessionForm(null);
      else if (act === 'edit-client') clientForm(Core.byId(s2.consult.clients, id));
      else if (act === 'edit-session') sessionForm(Core.byId(s2.consult.sessions, id));
      else if (act === 'stage') { stageFilter = btn.dataset.key; render(el); }
      else if (act === 'plan') {
        var c = Core.byId(s2.consult.clients, id);
        if (!c) return;
        UI.addToPlan({ title: '跟进客户：' + c.name, module: 'consult', refId: 'client:' + c.id, note: c.company || '' });
        render(el);
      } else if (act === 'del-client') {
        var count = s2.consult.sessions.filter(function (x) { return x.clientId === id; }).length;
        var cl = Core.byId(s2.consult.clients, id);
        UI.confirm({
          title: '删除客户',
          message: '确定删除客户「' + UI.esc(cl ? cl.name : '') + '」吗？' +
            (count ? '该客户名下的 <b>' + count + '</b> 条咨询记录也会一起删除，且无法恢复。' : ''),
          confirmText: '删除客户',
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          Store.update(function (s) {
            s.consult.clients = s.consult.clients.filter(function (x) { return x.id !== id; });
            s.consult.sessions = s.consult.sessions.filter(function (x) { return x.clientId !== id; });
          }, 'consult-del-client');
          render(el);
          UI.toast('客户已删除', 'ok', 1500);
        });
      } else if (act === 'del-session') {
        UI.confirm({
          title: '删除咨询记录', message: '删除后无法恢复，收入统计会同步减少。',
          confirmText: '删除', danger: true
        }).then(function (ok) {
          if (!ok) return;
          Store.update(function (s) { s.consult.sessions = s.consult.sessions.filter(function (x) { return x.id !== id; }); }, 'consult-del-session');
          render(el);
        });
      }
    });
  }

  window.Views.consult = {
    title: '咨询工作',
    sub: '客户档案 + 每次咨询记录 · 阶段推进与收入一眼看清',
    render: render
  };
})();
