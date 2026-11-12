/*!
 * views/settings.js — 数据与设置：备份、恢复、偏好、清空
 */
window.Views = window.Views || {};
(function () {
  'use strict';
  var Core = window.Core, Store = window.Store, UI = window.UI;

  function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  function stamp() {
    var d = new Date();
    function p(n) { return String(n).padStart(2, '0'); }
    return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  }

  function exportBackup() {
    var json = Store.exportJSON();
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'myapp-backup-' + stamp() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    UI.toast('备份文件已开始下载', 'ok');
  }

  function targetForm() {
    var t = Store.get().settings.dietTargets;
    UI.formModal({
      title: '每日饮食目标',
      fields: [
        { key: 'kcal', label: '热量（kcal）', type: 'number', min: 0, step: 50 },
        { key: 'water', label: '饮水（ml）', type: 'number', min: 0, step: 250 },
        { key: 'protein', label: '蛋白质（g）', type: 'number', min: 0, step: 5 },
        { key: 'carbs', label: '碳水（g）', type: 'number', min: 0, step: 5 },
        { key: 'fat', label: '脂肪（g）', type: 'number', min: 0, step: 5 }
      ],
      values: t,
      onSubmit: function (v) {
        Store.update(function (s) {
          s.settings.dietTargets = { kcal: v.kcal, water: v.water, protein: v.protein, carbs: v.carbs, fat: v.fat };
        }, 'settings-target');
        window.App.refresh();
      }
    });
  }

  function render(el) {
    var st = Store.get();
    var json = Store.exportJSON();
    var size = new Blob([json]).size;

    var planItems = Object.keys(st.plans).reduce(function (a, k) { return a + st.plans[k].items.length; }, 0);
    var rows = [
      { name: '今日计划（事项）', count: planItems, extra: Object.keys(st.plans).length + ' 天有记录' },
      { name: '快速备忘', count: st.notes.length, extra: '' },
      { name: '自媒体（内容）', count: st.media.posts.length, extra: '账号 ' + st.media.accounts.length + ' 个' },
      { name: '开发工作（工作项）', count: st.dev.items.length, extra: '项目 ' + st.dev.projects.length + ' 个' },
      { name: '咨询工作（客户）', count: st.consult.clients.length, extra: '咨询记录 ' + st.consult.sessions.length + ' 条' },
      { name: '健身计划（动作）', count: st.fitness.sessions.length, extra: '' },
      { name: '饮食计划（餐次）', count: st.diet.meals.length, extra: Object.keys(st.diet.water).length + ' 天有饮水记录' },
      { name: '游戏娱乐（游戏）', count: st.games.games.length, extra: '游玩记录 ' + st.games.sessions.length + ' 条' }
    ];

    el.innerHTML =
      '<div class="grid g-4">' +
        UI.statCard('数据总量', Core.fmtNum(rows.reduce(function (a, r) { return a + r.count; }, 0)) + ' 条', '8 个模块合计', 'layers') +
        UI.statCard('占用空间', fmtSize(size), '浏览器 localStorage', 'save') +
        UI.statCard('最后保存', '<span style="font-size:15px">' + Core.timeAgo(Store.lastSavedAt()) + '</span>', Store.storageAvailable() ? '本地存储正常' : '本地存储不可用', 'clock') +
        '<div class="kpi" style="display:flex;flex-direction:column;justify-content:center;gap:6px">' +
          '<button class="btn btn-primary" data-act="save">' + UI.icon('save', 15) + ' 立即保存（Ctrl+S）</button>' +
          '<span class="small muted" style="text-align:center">每次修改已自动保存，这里可手动再存一次</span>' +
        '</div>' +
      '</div>' +

      '<div class="grid g-2 mt-16" style="align-items:start">' +
        '<div class="card">' +
          '<div class="card-head"><div class="card-title">' + UI.icon('download') + ' 备份与恢复</div></div>' +
          '<p class="small dim" style="line-height:1.7">数据只存在这台电脑的浏览器里。清理浏览器数据、换电脑或重装系统都会丢，建议每周导出一次备份。</p>' +
          '<div class="row mt-12" style="gap:8px">' +
            '<button class="btn btn-primary" data-act="export">' + UI.icon('download', 15) + ' 导出备份</button>' +
            '<button class="btn" data-act="import">' + UI.icon('upload', 15) + ' 导入备份</button>' +
            '<input type="file" id="importFile" accept=".json,application/json" style="display:none">' +
          '</div>' +
          '<div class="row mt-12" style="gap:8px">' +
            '<button class="btn btn-sm" data-act="sample">' + UI.icon('layers', 14) + ' 载入示例数据</button>' +
            '<span class="small muted">想先看看有数据时的效果？示例会覆盖当前数据</span>' +
          '</div>' +
          '<div class="divider"></div>' +
          '<div class="small muted" style="line-height:1.8">' +
            '· 备份文件名：<code>myapp-backup-' + stamp() + '.json</code><br>' +
            '· 导入会<b>覆盖</b>当前全部数据，导入前会再确认一次<br>' +
            '· 导入非法文件时，现有数据不会被破坏<br>' +
            '· 当前数据可读体积：' + fmtSize(size) +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card-head"><div class="card-title">' + UI.icon('settings') + ' 偏好设置</div></div>' +
          '<div class="field"><label>昵称（首页问候用）</label>' +
            '<div class="row"><input class="input" id="nameInput" value="' + UI.esc(st.settings.name) + '" maxlength="12">' +
            '<button class="btn" data-act="save-name">保存</button></div></div>' +
          '<div class="field mt-12"><label>主题</label>' +
            '<div class="segmented" style="width:100%">' +
              '<button data-act="theme" data-theme="light" class="' + (st.settings.theme === 'light' ? 'active' : '') + '" style="flex:1">浅色</button>' +
              '<button data-act="theme" data-theme="dark" class="' + (st.settings.theme === 'dark' ? 'active' : '') + '" style="flex:1">深色</button>' +
            '</div></div>' +
          '<div class="field mt-12"><label>每周从哪天开始</label>' +
            '<select class="select" id="weekStart">' +
              '<option value="1"' + (st.settings.weekStart === 1 ? ' selected' : '') + '>周一</option>' +
              '<option value="0"' + (st.settings.weekStart === 0 ? ' selected' : '') + '>周日</option>' +
            '</select></div>' +
          '<div class="divider"></div>' +
          '<div class="spread"><div><div class="small dim">每日饮食目标</div>' +
            '<div class="mono" style="font-size:13px">' + st.settings.dietTargets.kcal + ' kcal · 蛋白 ' + st.settings.dietTargets.protein + 'g</div></div>' +
            '<button class="btn btn-sm" data-act="targets">修改</button></div>' +
        '</div>' +
      '</div>' +

      '<div class="card mt-16">' +
        '<div class="card-head"><div class="card-title">' + UI.icon('layers') + ' 各模块数据</div>' +
          '<span class="small muted">全部保存在本机</span></div>' +
        '<div class="table-scroll"><table class="table">' +
          '<thead><tr><th>模块</th><th class="num">条数</th><th>附加信息</th></tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr><td>' + r.name + '</td><td class="num mono">' + r.count + '</td>' +
              '<td class="small muted">' + (r.extra || '—') + '</td></tr>';
          }).join('') + '</tbody></table></div>' +
      '</div>' +

      '<div class="card mt-16" style="border-color:color-mix(in srgb, var(--danger) 35%, var(--border))">' +
        '<div class="card-head"><div class="card-title" style="color:var(--danger)">' + UI.icon('alert') + ' 危险操作</div></div>' +
        '<p class="small dim">清空会删除本机浏览器里的全部数据，且无法恢复。清空前请先导出备份。</p>' +
        '<div class="row mt-12">' +
          '<button class="btn btn-danger" data-act="clear">清空全部数据</button>' +
          '<button class="btn" data-act="export">先导出备份</button>' +
        '</div>' +
      '</div>';

    /* 事件 */
    UI.bind(el, 'click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.dataset.act;

      if (act === 'save') {
        window.App.save();
      } else if (act === 'export') {
        exportBackup();
      } else if (act === 'import') {
        el.querySelector('#importFile').click();
      } else if (act === 'sample') {
        UI.confirm({
          title: '载入示例数据',
          message: '会用一份演示数据<b>覆盖</b>当前全部内容（含今日计划、各模块记录）。<br>只想看看效果的话，之后可以在「危险操作」里清空。',
          confirmText: '载入示例'
        }).then(function (ok) {
          if (!ok) return;
          try {
            Store.importJSON(JSON.stringify(Core.exportPayload(window.Sample.build())));
            document.documentElement.setAttribute('data-theme', Store.get().settings.theme);
            window.App.refresh();
            UI.toast('示例数据已载入', 'ok');
          } catch (err) {
            UI.toast('载入失败：' + err.message, 'err');
          }
        });
      } else if (act === 'save-name') {
        var val = (el.querySelector('#nameInput').value || '').trim() || '我';
        Store.update(function (s) { s.settings.name = val; }, 'settings-name');
        UI.toast('已保存昵称', 'ok', 1400);
        window.App.refresh();
      } else if (act === 'theme') {
        var theme = btn.dataset.theme;
        Store.update(function (s) { s.settings.theme = theme; }, 'settings-theme');
        document.documentElement.setAttribute('data-theme', theme);
        var tb = document.getElementById('btnTheme');
        if (tb) tb.textContent = theme === 'dark' ? '浅色' : '深色';
        render(el);
      } else if (act === 'targets') {
        targetForm();
      } else if (act === 'clear') {
        UI.formModal({
          title: '清空全部数据',
          desc: '此操作不可恢复，请确认已导出备份',
          fields: [
            { key: 'word', label: '请输入「清空」两个字确认', type: 'text', required: true, span: 2, placeholder: '清空' }
          ],
          values: { word: '' },
          submitText: '确认清空',
          onSubmit: function (v) {
            if (v.word !== '清空') {
              UI.toast('输入不正确，操作已取消', 'err');
              return false;
            }
            Store.reset();
            document.documentElement.setAttribute('data-theme', Store.get().settings.theme);
            window.App.refresh();
            UI.toast('已清空全部数据', 'ok');
          }
        });
      }
    });

    el.querySelector('#weekStart').addEventListener('change', function (e) {
      var v = Number(e.target.value);
      Store.update(function (s) { s.settings.weekStart = v; }, 'settings-weekstart');
      UI.toast(v === 1 ? '每周从周一开始' : '每周从周日开始', 'ok', 1400);
      window.App.refresh();
    });

    el.querySelector('#importFile').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var text = String(reader.result || '');
        var checked = Core.validateImport(text);
        if (!checked.ok) {
          UI.toast(checked.error, 'err', 4000);
          e.target.value = '';
          return;
        }
        UI.confirm({
          title: '导入备份',
          message: '将用「' + UI.esc(file.name) + '」里的数据<b>覆盖</b>当前全部数据（含 ' +
            Object.keys(Store.get().plans).length + ' 天计划、' + Store.get().dev.items.length + ' 个工作项等）。继续吗？',
          confirmText: '覆盖并导入',
          danger: true
        }).then(function (ok) {
          if (!ok) { e.target.value = ''; return; }
          try {
            Store.importJSON(text);
            document.documentElement.setAttribute('data-theme', Store.get().settings.theme);
            window.App.refresh();
            UI.toast('导入成功，数据已恢复', 'ok');
          } catch (err) {
            UI.toast('导入失败：' + err.message, 'err', 4000);
          }
          e.target.value = '';
        });
      };
      reader.onerror = function () { UI.toast('读取文件失败', 'err'); };
      reader.readAsText(file);
    });
  }

  window.Views.settings = {
    title: '数据与设置',
    sub: '备份、恢复、偏好都在这里 · 数据只保存在本机浏览器',
    render: render
  };
})();
