/*!
 * views/media.js — 自媒体：内容管线 + 发布数据复盘 + 账号
 */
window.Views = window.Views || {};
(function () {
  'use strict';
  var Core = window.Core, Store = window.Store, UI = window.UI;

  var tab = 'pipeline';

  var STAGES = [
    { key: 'idea', name: '想法', color: '#94a3b8' },
    { key: 'script', name: '脚本', color: '#0ea5e9' },
    { key: 'shoot', name: '拍摄', color: '#f59e0b' },
    { key: 'edit', name: '剪辑', color: '#8b5cf6' },
    { key: 'published', name: '已发布', color: '#10b981' }
  ];

  function platforms() {
    var list = ['抖音', '小红书', 'B站', '视频号', 'YouTube', '其他'];
    Store.get().media.accounts.forEach(function (a) {
      if (a.platform && list.indexOf(a.platform) < 0) list.push(a.platform);
    });
    return list;
  }

  function platformOpts() {
    return platforms().map(function (p) { return { v: p, t: p }; });
  }

  function engagement(p) {
    return p.views ? Math.round(((p.likes + p.comments + p.shares + p.saves) / p.views) * 1000) / 10 : 0;
  }

  /* ---- 表单 ---- */

  function contentForm(post) {
    UI.formModal({
      title: post ? '编辑内容' : '新增内容',
      desc: '内容从想法走到发布，阶段随时可以调整',
      fields: [
        { key: 'title', label: '标题 / 选题', type: 'text', required: true, span: 2, placeholder: '例如：3 个提升效率的桌面习惯' },
        { key: 'platform', label: '平台', type: 'select', options: platformOpts() },
        { key: 'stage', label: '阶段', type: 'select', options: STAGES.map(function (s) { return { v: s.key, t: s.name }; }) },
        { key: 'note', label: '备注（可选）', type: 'text', span: 2, placeholder: '脚本要点、封面想法…' }
      ],
      values: post || { platform: '抖音', stage: 'idea', note: '' },
      onSubmit: function (v) {
        Store.update(function (s) {
          if (post) {
            var p = Core.byId(s.media.posts, post.id);
            if (p) { p.title = v.title; p.platform = v.platform; p.stage = v.stage; p.note = v.note; }
          } else {
            s.media.posts.push({
              id: Core.uid('post'), title: v.title, platform: v.platform, stage: v.stage,
              publishDate: '', views: 0, likes: 0, comments: 0, shares: 0, saves: 0, followers: 0,
              url: '', note: v.note, createdAt: Core.nowISO()
            });
          }
        }, 'media-content');
        window.App.refresh();
      }
    });
  }

  function metricsForm(post) {
    var isNew = !post;
    UI.formModal({
      title: isNew ? '登记发布数据' : '更新发布数据',
      desc: '数据用于生成播放趋势、平台占比与 Top5 图表',
      wide: true,
      fields: [
        { key: 'title', label: '标题', type: 'text', required: true, span: 2 },
        { key: 'platform', label: '平台', type: 'select', options: platformOpts() },
        { key: 'publishDate', label: '发布日期', type: 'date', required: true },
        { key: 'views', label: '播放量', type: 'number', min: 0, step: 1 },
        { key: 'likes', label: '点赞', type: 'number', min: 0 },
        { key: 'comments', label: '评论', type: 'number', min: 0 },
        { key: 'shares', label: '分享', type: 'number', min: 0 },
        { key: 'saves', label: '收藏', type: 'number', min: 0 },
        { key: 'followers', label: '涨粉', type: 'number' },
        { key: 'url', label: '链接（可选）', type: 'text' },
        { key: 'note', label: '备注（可选）', type: 'text' }
      ],
      values: post || {
        platform: '抖音', publishDate: Core.ymd(new Date()),
        views: 0, likes: 0, comments: 0, shares: 0, saves: 0, followers: 0, url: '', note: ''
      },
      onSubmit: function (v) {
        Store.update(function (s) {
          if (post) {
            var p = Core.byId(s.media.posts, post.id);
            if (p) {
              p.title = v.title; p.platform = v.platform; p.publishDate = v.publishDate; p.stage = 'published';
              p.views = v.views; p.likes = v.likes; p.comments = v.comments; p.shares = v.shares;
              p.saves = v.saves; p.followers = v.followers; p.url = v.url; p.note = v.note;
            }
          } else {
            s.media.posts.push({
              id: Core.uid('post'), title: v.title, platform: v.platform, stage: 'published',
              publishDate: v.publishDate, views: v.views, likes: v.likes, comments: v.comments,
              shares: v.shares, saves: v.saves, followers: v.followers, url: v.url, note: v.note,
              createdAt: Core.nowISO()
            });
          }
        }, 'media-metrics');
        window.App.refresh();
        UI.toast(isNew ? '已记录发布数据' : '已更新发布数据', 'ok', 1500);
      }
    });
  }

  function accountForm(acc) {
    UI.formModal({
      title: acc ? '编辑账号' : '新增账号',
      fields: [
        { key: 'platform', label: '平台', type: 'select', options: platformOpts() },
        { key: 'name', label: '账号名', type: 'text', required: true, placeholder: '例如：小林在做内容' }
      ],
      values: acc || { platform: '抖音', name: '' },
      onSubmit: function (v) {
        Store.update(function (s) {
          if (acc) {
            var a = Core.byId(s.media.accounts, acc.id);
            if (a) { a.platform = v.platform; a.name = v.name; }
          } else {
            s.media.accounts.push({ id: Core.uid('acc'), platform: v.platform, name: v.name });
          }
        }, 'media-account');
        window.App.refresh();
      }
    });
  }

  /* ---- 渲染 ---- */

  function kpis(m) {
    return '<div class="grid g-4">' +
      UI.statCard('近30天播放', Core.fmtNum(m.views), '发布 ' + m.count + ' 条 · 均播 ' + Core.fmtNum(m.avgViews), 'play') +
      UI.statCard('互动率', m.engagement + '%', '赞 ' + Core.fmtNum(m.likes) + ' · 评 ' + Core.fmtNum(m.comments) + ' · 藏 ' + Core.fmtNum(m.saves), 'chart') +
      UI.statCard('新增粉丝', Core.fmtNum(m.followers), '近30天累计', 'users') +
      UI.statCard('内容管线', Object.keys(m.byStage).reduce(function (a, k) { return a + (k === 'published' ? 0 : m.byStage[k]); }, 0) + ' 条', '在想法/脚本/拍摄/剪辑中', 'layers') +
    '</div>';
  }

  function pipelineView(posts) {
    return '<div class="kanban cols-5">' + STAGES.map(function (stage) {
      var list = posts.filter(function (p) { return p.stage === stage.key; });
      return '<div class="kcol">' +
        '<div class="kcol-head"><b><span class="prio" style="background:' + stage.color + ';margin:0"></span>' + stage.name + '</b>' +
          '<span class="count">' + list.length + '</span></div>' +
        (list.length ? '' : '<div class="kcol-empty">暂无内容</div>') +
        list.map(function (p) {
          var idx = STAGES.findIndex(function (s) { return s.key === p.stage; });
          return '<div class="kcard">' +
            '<div class="title">' + UI.esc(p.title) + '</div>' +
            '<div class="meta"><span class="tag">' + UI.esc(p.platform) + '</span>' +
              (p.publishDate ? '<span class="tag ok">' + Core.fmtDateShort(p.publishDate) + '</span>' : '') +
              (p.stage === 'published' ? '<span class="tag">' + Core.fmtNum(p.views) + ' 播放</span>' : '') +
            '</div>' +
            '<div class="ops">' +
              '<button class="icon-btn" data-act="move" data-id="' + p.id + '" data-dir="-1" title="上一阶段"' + (idx === 0 ? ' disabled style="opacity:.3"' : '') + '>' + UI.icon('chevronLeft', 14) + '</button>' +
              '<button class="icon-btn" data-act="move" data-id="' + p.id + '" data-dir="1" title="下一阶段"' + (idx === STAGES.length - 1 ? ' disabled style="opacity:.3"' : '') + '>' + UI.icon('chevronRight', 14) + '</button>' +
              '<span class="spacer"></span>' +
              (p.stage === 'published'
                ? '<button class="icon-btn" data-act="metrics" data-id="' + p.id + '" title="数据">' + UI.icon('chart', 14) + '</button>'
                : '<button class="icon-btn" data-act="edit" data-id="' + p.id + '" title="编辑">' + UI.icon('edit', 14) + '</button>') +
              '<button class="icon-btn danger" data-act="del" data-id="' + p.id + '" title="删除">' + UI.icon('trash', 14) + '</button>' +
            '</div>' +
          '</div>';
        }).join('') +
        '<button class="kcard-new mt-8" data-act="add" data-stage="' + stage.key + '">+ 新增</button>' +
      '</div>';
    }).join('') + '</div>';
  }

  function dataView(st, m) {
    var published = st.media.posts.filter(function (p) { return p.publishDate; })
      .sort(function (a, b) { return a.publishDate < b.publishDate ? 1 : -1; });

    return kpis(m) +
      '<div class="grid g-2 mt-16">' +
        '<div class="card">' +
          '<div class="card-head"><div class="card-title">' + UI.icon('chart') + ' 单条播放走势</div>' +
            '<span class="small muted">按发布日期 · 近30天</span></div>' +
          UI.chartLine(m.series, { emptyHint: '登记两条以上发布数据后，这里会显示播放走势' }) +
        '</div>' +
        '<div class="card">' +
          '<div class="card-head"><div class="card-title">' + UI.icon('layers') + ' 平台播放占比</div>' +
            '<span class="small muted">近30天</span></div>' +
          UI.chartDonut(m.byPlatform.map(function (x) { return { label: x.platform, value: x.views }; }), { unit: '总播放' }) +
        '</div>' +
      '</div>' +

      '<div class="card mt-16">' +
        '<div class="card-head"><div class="card-title">' + UI.icon('target') + ' 单条播放 Top 5</div>' +
          '<span class="small muted">按播放量降序</span></div>' +
        UI.barsH(m.top.map(function (t) { return { label: t.title, value: t.value }; }), { stacked: true, emptyHint: '还没有发布数据' }) +
      '</div>' +

      '<div class="card mt-16">' +
        '<div class="card-head">' +
          '<div class="card-title">' + UI.icon('video') + ' 发布记录 <span class="tag">' + published.length + '</span></div>' +
          '<button class="btn btn-primary btn-sm" data-act="new-metrics">' + UI.icon('plus', 14) + ' 登记发布数据</button>' +
        '</div>' +
        (published.length ? '<div class="table-scroll"><table class="table">' +
          '<thead><tr><th>日期</th><th>标题</th><th>平台</th><th class="num">播放</th><th class="num">点赞</th>' +
          '<th class="num">评论</th><th class="num">分享</th><th class="num">涨粉</th><th class="num">互动率</th><th></th></tr></thead><tbody>' +
          published.map(function (p) {
            return '<tr>' +
              '<td class="mono small">' + Core.fmtDateShort(p.publishDate) + '</td>' +
              '<td><div class="truncate" style="max-width:220px" title="' + UI.esc(p.title) + '">' + UI.esc(p.title) + '</div></td>' +
              '<td><span class="tag">' + UI.esc(p.platform) + '</span></td>' +
              '<td class="num">' + Core.fmtNum(p.views) + '</td>' +
              '<td class="num">' + Core.fmtNum(p.likes) + '</td>' +
              '<td class="num">' + Core.fmtNum(p.comments) + '</td>' +
              '<td class="num">' + Core.fmtNum(p.shares) + '</td>' +
              '<td class="num">' + Core.fmtNum(p.followers) + '</td>' +
              '<td class="num">' + engagement(p) + '%</td>' +
              '<td><div class="row" style="gap:0;justify-content:flex-end">' +
                '<button class="icon-btn" data-act="metrics" data-id="' + p.id + '" title="编辑数据">' + UI.icon('edit', 14) + '</button>' +
                '<button class="icon-btn danger" data-act="del" data-id="' + p.id + '" title="删除">' + UI.icon('trash', 14) + '</button>' +
              '</div></td>' +
            '</tr>';
          }).join('') + '</tbody></table></div>'
          : UI.emptyState('video', '还没有发布记录', '点右上角「登记发布数据」，填一次数据就能看到三张图表')) +
      '</div>';
  }

  function accountView(st) {
    var accs = st.media.accounts;
    return '<div class="card">' +
      '<div class="card-head"><div class="card-title">' + UI.icon('users') + ' 我的账号 <span class="tag">' + accs.length + '</span></div>' +
        '<button class="btn btn-primary btn-sm" data-act="acc-add">' + UI.icon('plus', 14) + ' 新增账号</button></div>' +
      (accs.length ? '<div class="grid g-3">' + accs.map(function (a) {
        var count = st.media.posts.filter(function (p) { return p.platform === a.platform; }).length;
        return '<div class="card flat tight" style="background:var(--surface-2)">' +
          '<div class="spread"><b style="font-size:13.5px">' + UI.esc(a.name) + '</b>' +
          '<div class="row" style="gap:0"><button class="icon-btn" data-act="acc-edit" data-id="' + a.id + '">' + UI.icon('edit', 14) + '</button>' +
          '<button class="icon-btn danger" data-act="acc-del" data-id="' + a.id + '">' + UI.icon('trash', 14) + '</button></div></div>' +
          '<div class="row mt-8"><span class="tag brand">' + UI.esc(a.platform) + '</span><span class="small muted">' + count + ' 条内容</span></div>' +
        '</div>';
      }).join('') + '</div>'
        : UI.emptyState('users', '还没有登记账号', '把常用平台账号记下来，方便按平台归档内容')) +
    '</div>';
  }

  function render(el) {
    var st = Store.get();
    var m = Core.mediaStats(st.media.posts, { days: 30 });

    el.innerHTML =
      '<div class="spread" style="margin-bottom:14px;flex-wrap:wrap;gap:10px">' +
        '<div class="segmented">' +
          '<button data-act="tab" data-tab="pipeline" class="' + (tab === 'pipeline' ? 'active' : '') + '">内容管线</button>' +
          '<button data-act="tab" data-tab="data" class="' + (tab === 'data' ? 'active' : '') + '">发布数据</button>' +
          '<button data-act="tab" data-tab="accounts" class="' + (tab === 'accounts' ? 'active' : '') + '">账号</button>' +
        '</div>' +
        '<div class="row">' +
          '<button class="btn btn-sm" data-act="new-metrics">' + UI.icon('chart', 14) + ' 登记发布数据</button>' +
          '<button class="btn btn-primary btn-sm" data-act="add">' + UI.icon('plus', 14) + ' 新增内容</button>' +
        '</div>' +
      '</div>' +
      (tab === 'pipeline' ? pipelineView(st.media.posts)
        : tab === 'data' ? dataView(st, m)
        : accountView(st));

    el.querySelectorAll('[data-act="tab"]').forEach(function (b) {
      b.addEventListener('click', function () { tab = b.dataset.tab; render(el); });
    });

    UI.bind(el, 'click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.dataset.act, id = btn.dataset.id;
      var st2 = Store.get();

      if (act === 'tab') return;
      if (act === 'add') {
        if (btn.dataset.stage) {
          var preset = btn.dataset.stage;
          contentForm(null);
          setTimeout(function () {
            var sel = document.querySelector('.modal select[name="stage"]');
            if (sel) { sel.value = preset; }
          }, 40);
        } else contentForm(null);
      } else if (act === 'edit') {
        contentForm(Core.byId(st2.media.posts, id));
      } else if (act === 'metrics' || act === 'new-metrics') {
        metricsForm(act === 'metrics' ? Core.byId(st2.media.posts, id) : null);
      } else if (act === 'del') {
        UI.confirm({
          title: '删除内容',
          message: '这条内容及其发布数据都会被删除，图表会同步变化。',
          confirmText: '删除', danger: true
        }).then(function (ok) {
          if (!ok) return;
          Store.update(function (s) { s.media.posts = s.media.posts.filter(function (p) { return p.id !== id; }); }, 'media-del');
          render(el);
        });
      } else if (act === 'move') {
        var dir = Number(btn.dataset.dir);
        var post = Core.byId(st2.media.posts, id);
        if (!post) return;
        var idx = STAGES.findIndex(function (s) { return s.key === post.stage; });
        var next = STAGES[idx + dir];
        if (!next) return;
        Store.update(function (s) {
          var p = Core.byId(s.media.posts, id);
          if (!p) return;
          p.stage = next.key;
          if (next.key === 'published' && !p.publishDate) p.publishDate = Core.ymd(new Date());
        }, 'media-move');
        render(el);
        if (next.key === 'published') UI.toast('已标记发布，记得登记播放数据', '', 2000);
      } else if (act === 'acc-add') {
        accountForm(null);
      } else if (act === 'acc-edit') {
        accountForm(Core.byId(st2.media.accounts, id));
      } else if (act === 'acc-del') {
        Store.update(function (s) { s.media.accounts = s.media.accounts.filter(function (a) { return a.id !== id; }); }, 'media-acc-del');
        render(el);
      }
    });
  }

  window.Views.media = {
    title: '自媒体',
    sub: '内容管线 + 发布后数据复盘 · 三张图表看清哪条内容真的有效',
    render: render
  };
})();
