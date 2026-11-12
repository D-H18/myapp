/*!
 * app.js — 应用外壳：导航、路由、主题、保存入口
 */
(function () {
  'use strict';
  var Core = window.Core, Store = window.Store, UI = window.UI;

  var NAV = [
    { key: 'home', label: '首页总览', icon: 'home' },
    { key: 'plan', label: '今日计划', icon: 'checkSquare' },
    { key: 'media', label: '自媒体', icon: 'video' },
    { key: 'dev', label: '开发工作', icon: 'code' },
    { key: 'consult', label: '咨询工作', icon: 'users' },
    { key: 'fitness', label: '健身计划', icon: 'dumbbell' },
    { key: 'diet', label: '饮食计划', icon: 'utensils' },
    { key: 'games', label: '游戏娱乐', icon: 'gamepad' },
    { key: 'settings', label: '数据与设置', icon: 'settings' }
  ];

  var current = 'home';

  function $(sel) { return document.querySelector(sel); }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function fmtTime(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  }

  function applyTheme() {
    var theme = Store.get().settings.theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    var btn = $('#btnTheme');
    if (btn) btn.textContent = theme === 'dark' ? '浅色' : '深色';
  }

  function buildNav() {
    $('#nav').innerHTML = NAV.map(function (n) {
      return '<a class="nav-item" href="#/' + n.key + '" data-key="' + n.key + '">' +
        UI.icon(n.icon) + '<span>' + n.label + '</span>' +
        '<span class="nav-dot" data-dot="' + n.key + '"></span></a>';
    }).join('');
  }

  function updateBadges() {
    var st = Store.get();
    var today = Core.ymd(new Date());
    var day = st.plans[today];
    var open = day ? day.items.filter(function (i) { return !i.done; }).length : 0;
    var dot = document.querySelector('[data-dot="plan"]');
    if (dot) dot.textContent = open ? String(open) : '';

    var devOpen = st.dev.items.filter(function (i) { return i.status !== 'done'; }).length;
    var devDot = document.querySelector('[data-dot="dev"]');
    if (devDot) devDot.textContent = devOpen ? String(devOpen) : '';
  }

  function renderSaveState(evt) {
    var el = $('#saveState');
    if (!el) return;
    var ok = !evt || evt.ok !== false;
    el.classList.toggle('is-error', !ok);
    var label = el.querySelector('span');
    if (label) {
      label.textContent = ok ? '已保存 ' + fmtTime(Store.lastSavedAt()) : '保存失败！请到设置页导出备份';
    }
    var foot = $('#footSaved');
    if (foot) foot.textContent = '最后保存 ' + fmtTime(Store.lastSavedAt());
  }

  function render() {
    var view = window.Views[current] || window.Views.home;
    Array.prototype.forEach.call(document.querySelectorAll('.nav-item'), function (a) {
      a.classList.toggle('active', a.getAttribute('data-key') === current);
    });

    $('#pageTitle').textContent = view.title;
    $('#pageSub').textContent = typeof view.sub === 'function' ? view.sub() : (view.sub || '');

    var host = $('#view');
    host.innerHTML = '';
    var el = document.createElement('div');
    el.className = 'view-body';
    host.appendChild(el);

    try {
      view.render(el);
    } catch (e) {
      console.error('[myapp] 视图渲染失败：', e);
      el.innerHTML = '<div class="empty"><div class="ico">' + UI.icon('alert') + '</div><b>页面渲染出错了</b><p>' + UI.esc(e.message) + '</p></div>';
    }
    updateBadges();
  }

  function route() {
    var key = (location.hash || '').replace(/^#\/?/, '').trim();
    if (!window.Views[key]) key = 'home';
    current = key;
    render();
  }

  function go(key) {
    if (location.hash === '#/' + key) { current = key; render(); }
    else location.hash = '#/' + key;
  }

  function manualSave() {
    var ok = Store.save('manual');
    renderSaveState({ ok: ok });
    if (ok) UI.toast('已保存到本机浏览器', 'ok');
    else UI.toast('保存失败：' + (Store.lastError() ? Store.lastError().message : '浏览器拒绝写入'), 'err');
  }

  function init() {
    Store.load();
    buildNav();
    applyTheme();
    renderSaveState(null);
    window.addEventListener('hashchange', route);

    $('#btnSave').addEventListener('click', manualSave);

    $('#btnTheme').addEventListener('click', function () {
      var next = Store.get().settings.theme === 'dark' ? 'light' : 'dark';
      Store.update(function (s) { s.settings.theme = next; }, 'theme');
      applyTheme();
      UI.toast(next === 'dark' ? '已切换到深色主题' : '已切换到浅色主题', 'ok', 1400);
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        manualSave();
      }
    });

    Store.subscribe(function (evt) {
      if (evt.type === 'save' || evt.type === 'import' || evt.type === 'reset') {
        renderSaveState(evt);
        updateBadges();
      }
    });

    if (!Store.storageAvailable()) {
      UI.toast('浏览器禁止本地存储，数据无法保存。请换用 Chrome/Edge 打开，或到设置页导出备份。', 'err', 6000);
      var el = $('#saveState');
      if (el) { el.classList.add('is-error'); el.querySelector('span').textContent = '本地存储不可用'; }
    }

    route();
  }

  window.App = {
    refresh: render,
    go: go,
    current: function () { return current; },
    save: manualSave
  };

  init();
})();
