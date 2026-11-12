/*!
 * ui.js — 通用 UI 组件（图标、弹窗、表单、Toast、SVG 图表、月历）
 * 依赖：core.js
 */
(function (root) {
  'use strict';
  var Core = root.Core;

  /* ---------------- 图标 ---------------- */

  var ICONS = {
    home: '<path d="M3 10.6 12 3l9 7.6V20a1 1 0 0 1-1 1h-5.5v-6.5h-5V21H4a1 1 0 0 1-1-1z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkSquare: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    video: '<rect x="2" y="5" width="14" height="14" rx="2.5"/><path d="M22 8.5 16 12l6 3.5z"/>',
    code: '<path d="M15.5 18 21 12l-5.5-6"/><path d="M8.5 6 3 12l5.5 6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>',
    utensils: '<path d="M4 2v7a3 3 0 0 0 6 0V2"/><path d="M7 9v13"/><path d="M17 2c-1.5 1.6-2 3.6-2 5.5 0 2.2 1 3.5 3 3.5h1V2z"/><path d="M18 11v11"/>',
    gamepad: '<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3M16 12h.01M18.5 14h.01"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    chevronLeft: '<path d="M15 18l-6-6 6-6"/>',
    chevronRight: '<path d="M9 18l6-6-6-6"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>',
    pin: '<path d="M12 17v5"/><path d="M9 10.8V4h6v6.8l2 3.2H7z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    flame: '<path d="M12 22c4 0 7-2.7 7-6.5 0-4.5-4.5-6-4-11.5-2.5 1-5 4-5 6.5 0 1.6-1.5 2-1.5 1C7 13 5 14.5 5 15.5 5 19.3 8 22 12 22z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
    alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    star: '<path d="m12 3 2.8 5.9 6.2.8-4.6 4.4 1.2 6.4L12 17.6 6.4 20.5l1.2-6.4L3 9.7l6.2-.8z"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l3-4 3 3 4-6"/>',
    note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    coffee: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 9h2a3 3 0 0 1 0 6h-2"/><path d="M6 2v2M10 2v2M14 2v2"/>'
  };

  function icon(name, size) {
    var path = ICONS[name] || ICONS.info;
    var s = size || 16;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }

  /* ---------------- 模块元信息 ---------------- */

  var MODULES = {
    home: { name: '首页总览', color: '#5b5bd6', icon: 'home' },
    plan: { name: '今日计划', color: '#0ea5e9', icon: 'checkSquare' },
    media: { name: '自媒体', color: '#e11d48', icon: 'video' },
    dev: { name: '开发工作', color: '#6366f1', icon: 'code' },
    consult: { name: '咨询工作', color: '#0d9488', icon: 'users' },
    fitness: { name: '健身计划', color: '#ea580c', icon: 'dumbbell' },
    diet: { name: '饮食计划', color: '#16a34a', icon: 'utensils' },
    games: { name: '游戏娱乐', color: '#7c3aed', icon: 'gamepad' },
    settings: { name: '数据与设置', color: '#64748b', icon: 'settings' },
    other: { name: '其他', color: '#94a3b8', icon: 'layers' }
  };

  var PRIORITY = {
    high: { name: '高', cls: 'danger' },
    mid: { name: '中', cls: 'warn' },
    low: { name: '低', cls: '' }
  };

  /* ---------------- 基础 ---------------- */

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /**
   * 幂等绑定：同一元素、同一事件只保留一个监听器。
   * 视图内部重渲染时会重新调用 render(el)，若直接 addEventListener，
   * 容器上的旧监听器不会随 innerHTML 一起销毁，导致一次点击被处理多次
   * （弹窗双开、状态连跳、勾选被抵消）。这里用新闭包替换旧闭包。
   */
  function bind(el, type, handler, ns) {
    if (!el) return;
    var map = el.__uiBound || (el.__uiBound = Object.create(null));
    var key = (ns || 'main') + ':' + type;
    if (map[key]) el.removeEventListener(type, map[key]);
    map[key] = handler;
    el.addEventListener(type, handler);
  }

  function delegate(el, type, handler) {
    el.addEventListener(type, function (e) {
      var target = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!target || !el.contains(target)) return;
      handler(target.getAttribute('data-act'), target, e);
    });
  }

  function toast(msg, type, ms) {
    var wrap = document.getElementById('toastWrap');
    if (!wrap) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.innerHTML = (type === 'err' ? icon('alert', 15) : type === 'ok' ? icon('check', 15) : icon('info', 15)) +
      '<span>' + esc(msg) + '</span>';
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .2s, transform .2s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(function () { el.remove(); }, 220);
    }, ms || 2200);
  }

  /* ---------------- 弹窗 ---------------- */

  function closeModal(backdrop) {
    if (!backdrop) return;
    backdrop.remove();
    document.removeEventListener('keydown', onEsc);
    function onEsc(e) { if (e.key === 'Escape') close(backdrop); }
  }

  function buildModal(cfg) {
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML =
      '<div class="modal' + (cfg.wide ? ' wide' : '') + '" role="dialog" aria-modal="true">' +
        '<div class="modal-head">' +
          '<div><h3>' + esc(cfg.title || '') + '</h3>' +
          (cfg.desc ? '<p>' + esc(cfg.desc) + '</p>' : '') + '</div>' +
          '<button class="icon-btn" data-close="1" aria-label="关闭">' + icon('x') + '</button>' +
        '</div>' +
        '<div class="modal-body">' + (cfg.body || '') + '</div>' +
        (cfg.foot ? '<div class="modal-foot">' + cfg.foot + '</div>' : '') +
      '</div>';

    function close() {
      backdrop.remove();
      document.removeEventListener('keydown', escHandler);
    }
    function escHandler(e) { if (e.key === 'Escape') close(); }

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });
    backdrop.querySelector('[data-close]').addEventListener('click', close);
    document.addEventListener('keydown', escHandler);
    document.body.appendChild(backdrop);

    return { el: backdrop, close: close };
  }

  /** 确认弹窗，返回 Promise<boolean> */
  function confirmDialog(cfg) {
    cfg = cfg || {};
    return new Promise(function (resolve) {
      var m = buildModal({
        title: cfg.title || '确认操作',
        desc: cfg.desc || '',
        body: '<div style="font-size:13.5px;line-height:1.7;color:var(--text-dim)">' + (cfg.message || '') + '</div>',
        foot: '<button class="btn" data-no="1">取消</button>' +
              '<button class="btn ' + (cfg.danger ? 'btn-danger' : 'btn-primary') + '" data-yes="1">' + esc(cfg.confirmText || '确定') + '</button>'
      });
      m.el.querySelector('[data-no]').addEventListener('click', function () { m.close(); resolve(false); });
      m.el.querySelector('[data-yes]').addEventListener('click', function () { m.close(); resolve(true); });
      m.el.querySelector('.modal').addEventListener('click', function (e) { if (e.target === m.el.querySelector('.modal')) {} });
    });
  }

  function fieldHTML(f, val) {
    var id = 'fld_' + f.key;
    var v = val === undefined || val === null ? '' : val;
    var req = f.required ? ' <span style="color:var(--danger)">*</span>' : '';
    var body;
    if (f.type === 'textarea') {
      body = '<textarea class="textarea" id="' + id + '" name="' + esc(f.key) + '" placeholder="' +
        esc(f.placeholder || '') + '">' + esc(v) + '</textarea>';
    } else if (f.type === 'select') {
      body = '<select class="select" id="' + id + '" name="' + esc(f.key) + '">' +
        (f.options || []).map(function (o) {
          var ov = o.v !== undefined ? o.v : o;
          var ot = o.t !== undefined ? o.t : o;
          return '<option value="' + esc(ov) + '"' + (String(ov) === String(v) ? ' selected' : '') + '>' + esc(ot) + '</option>';
        }).join('') + '</select>';
    } else if (f.type === 'checkbox') {
      return '<div class="field' + (f.span === 2 ? ' span-2' : '') + '"><label style="display:flex;align-items:center;gap:8px;height:36px">' +
        '<input type="checkbox" id="' + id + '" name="' + esc(f.key) + '"' + (v ? ' checked' : '') + ' style="width:16px;height:16px;accent-color:var(--brand)">' +
        '<span style="font-size:13px;color:var(--text)">' + esc(f.label) + '</span></label>' +
        (f.hint ? '<span class="hint">' + esc(f.hint) + '</span>' : '') + '</div>';
    } else if (f.type === 'static') {
      return '<div class="field' + (f.span === 2 ? ' span-2' : '') + '"><label>' + esc(f.label) + '</label>' +
        '<div style="font-size:13px;padding:8px 0">' + (f.html || esc(v)) + '</div></div>';
    } else {
      body = '<input class="input" type="' + (f.type || 'text') + '" id="' + id + '" name="' + esc(f.key) + '" value="' +
        esc(v) + '" placeholder="' + esc(f.placeholder || '') + '"' +
        (f.min !== undefined ? ' min="' + f.min + '"' : '') +
        (f.max !== undefined ? ' max="' + f.max + '"' : '') +
        (f.step !== undefined ? ' step="' + f.step + '"' : '') + '>';
    }
    return '<div class="field' + (f.span === 2 ? ' span-2' : '') + '">' +
      '<label for="' + id + '">' + esc(f.label) + req + '</label>' + body +
      (f.hint ? '<span class="hint">' + esc(f.hint) + '</span>' : '') + '</div>';
  }

  /**
   * 表单弹窗
   * cfg: {title, desc, fields:[{key,label,type,options,required,hint,span,min,max,step}], values, submitText, wide, onSubmit(values, api)}
   */
  function formModal(cfg) {
    var fields = cfg.fields || [];
    var values = cfg.values || {};
    var body = '<form class="modal-form" id="modalForm" novalidate>' +
      fields.map(function (f) { return fieldHTML(f, values[f.key]); }).join('') + '</form>';

    var m = buildModal({
      title: cfg.title,
      desc: cfg.desc,
      wide: cfg.wide,
      body: body,
      foot: (cfg.extraFoot || '') +
        '<button class="btn" data-cancel="1">取消</button>' +
        '<button class="btn btn-primary" data-submit="1">' + esc(cfg.submitText || '保存') + '</button>'
    });

    var form = m.el.querySelector('#modalForm');

    function collect() {
      var out = {};
      for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        if (f.type === 'static') continue;
        var input = form.elements[f.key];
        if (!input) continue;
        if (f.type === 'checkbox') { out[f.key] = input.checked; continue; }
        var raw = input.value;
        if (f.type === 'number') {
          var n = parseFloat(raw);
          out[f.key] = isNaN(n) ? 0 : n;
          if (f.required && (raw === '' || isNaN(n))) return { error: '请填写「' + f.label + '」' };
        } else {
          out[f.key] = String(raw).trim();
          if (f.required && !out[f.key]) return { error: '请填写「' + f.label + '」' };
        }
      }
      return { values: out };
    }

    function submit() {
      var res = collect();
      if (res.error) { toast(res.error, 'err'); return; }
      if (cfg.onSubmit) {
        var keep = cfg.onSubmit(res.values, { close: m.close, modal: m.el });
        if (keep === false) return;
      }
      m.close();
    }

    m.el.querySelector('[data-submit]').addEventListener('click', submit);
    m.el.querySelector('[data-cancel]').addEventListener('click', m.close);
    form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); submit(); }
    });

    setTimeout(function () {
      var first = form.querySelector('input:not([type=checkbox]), textarea, select');
      if (first) first.focus();
    }, 30);

    return m;
  }

  /* ---------------- 空状态 ---------------- */

  function emptyState(ico, title, hint, actionHtml) {
    return '<div class="empty"><div class="ico">' + icon(ico || 'layers') + '</div>' +
      '<b>' + esc(title || '还没有数据') + '</b>' +
      '<p>' + esc(hint || '') + '</p>' +
      (actionHtml ? '<div class="mt-12">' + actionHtml + '</div>' : '') + '</div>';
  }

  /* ---------------- 图表 ---------------- */

  var chartSeq = 0;

  function niceStep(v) {
    var n = Math.max(v, 1);
    var mag = Math.pow(10, Math.floor(Math.log(n) / Math.LN10));
    var norm = n / mag;
    var step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
    return step * mag;
  }

  /** 折线图：series = [{label, value, date?}] */
  function chartLine(series, opts) {
    opts = opts || {};
    var data = (series || []).slice();
    if (!data.length) {
      return '<div class="empty"><div class="ico">' + icon('chart') + '</div><b>还没有可绘制的数据</b><p>' +
        esc(opts.emptyHint || '添加数据后这里会自动生成图表') + '</p></div>';
    }
    var W = 680, H = 236, padL = 50, padR = 16, padT = 16, padB = 34;
    var rawMax = Math.max.apply(null, data.map(function (d) { return d.value; }).concat([1]));
    var step = niceStep(rawMax / 4);
    var max = Math.ceil(rawMax / step) * step;
    var ticks = Math.max(1, Math.round(max / step));
    var n = data.length;
    var iw = W - padL - padR;
    var ih = H - padT - padB;
    var x = function (i) { return padL + (n === 1 ? iw / 2 : (i / (n - 1)) * iw); };
    var y = function (v) { return padT + ih - (v / max) * ih; };
    var uid = 'ln' + (++chartSeq);

    var grid = '';
    for (var g = 0; g <= ticks; g++) {
      var gy = padT + (ih / ticks) * g;
      var gv = max - step * g;
      grid += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '" stroke="var(--border)" stroke-width="1" stroke-dasharray="3 5"/>';
      grid += '<text x="' + (padL - 8) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="10.5" fill="var(--text-mute)">' + Core.fmtNum(gv) + '</text>';
    }

    var line = '', area = '';
    data.forEach(function (d, i) {
      line += (i === 0 ? 'M' : 'L') + x(i).toFixed(1) + ' ' + y(d.value).toFixed(1) + ' ';
    });
    area = 'M' + x(0).toFixed(1) + ' ' + (padT + ih) + ' ' +
      data.map(function (d, i) { return 'L' + x(i).toFixed(1) + ' ' + y(d.value).toFixed(1); }).join(' ') +
      ' L' + x(n - 1).toFixed(1) + ' ' + (padT + ih) + ' Z';

    var dots = '';
    var step = Math.ceil(n / 7);
    data.forEach(function (d, i) {
      dots += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(d.value).toFixed(1) + '" r="3.2" fill="var(--surface)" stroke="var(--brand)" stroke-width="2"/>';
      if (i % step === 0 || i === n - 1) {
        dots += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle" font-size="10" fill="var(--text-mute)">' + esc(d.label) + '</text>';
      }
      dots += '<title>' + esc((d.title ? d.title + ' · ' : '') + (d.date || d.label) + '：' + Core.fmtNum(d.value)) + '</title>';
    });

    return '<div class="chart-wrap"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img">' +
      '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="var(--brand)" stop-opacity=".26"/>' +
      '<stop offset="100%" stop-color="var(--brand)" stop-opacity="0"/></linearGradient></defs>' +
      grid +
      '<path d="' + area + '" fill="url(#' + uid + ')"/>' +
      '<path d="' + line + '" fill="none" stroke="var(--brand)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      dots + '</svg></div>';
  }

  /** 环形图：items = [{label, value}] */
  function chartDonut(items, opts) {
    opts = opts || {};
    var data = (items || []).filter(function (d) { return d.value > 0; });
    if (!data.length) {
      return '<div class="empty"><div class="ico">' + icon('chart') + '</div><b>暂无占比数据</b><p>' +
        esc(opts.emptyHint || '有数据后自动生成') + '</p></div>';
    }
    var palette = ['#6366f1', '#ec4899', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6', '#ef4444'];
    var total = data.reduce(function (a, d) { return a + d.value; }, 0);
    var size = 168, r = 58, cw = 18, c = 2 * Math.PI * r;
    var offset = 0, rings = '';
    data.forEach(function (d, i) {
      var frac = d.value / total;
      var len = Math.max(frac * c - 2, 0.5);
      rings += '<circle cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + r + '" fill="none" ' +
        'stroke="' + palette[i % palette.length] + '" stroke-width="' + cw + '" ' +
        'stroke-dasharray="' + len.toFixed(2) + ' ' + (c - len).toFixed(2) + '" ' +
        'stroke-dashoffset="' + (-offset).toFixed(2) + '" stroke-linecap="round" ' +
        'transform="rotate(-90 ' + (size / 2) + ' ' + (size / 2) + ')"><title>' + esc(d.label) + '：' + Core.fmtNum(d.value) + '</title></circle>';
      offset += frac * c;
    });
    var legend = data.map(function (d, i) {
      var pct = Math.round((d.value / total) * 100);
      return '<span><i style="background:' + palette[i % palette.length] + '"></i>' + esc(d.label) + ' ' + pct + '%</span>';
    }).join('');

    return '<div class="row" style="gap:18px;align-items:center;flex-wrap:wrap">' +
      '<div class="chart-wrap" style="flex:none;width:' + size + 'px">' +
      '<svg viewBox="0 0 ' + size + ' ' + size + '">' + rings +
      '<text x="' + size / 2 + '" y="' + (size / 2 - 2) + '" text-anchor="middle" font-size="19" font-weight="700" fill="var(--text)">' + Core.fmtNum(total) + '</text>' +
      '<text x="' + size / 2 + '" y="' + (size / 2 + 15) + '" text-anchor="middle" font-size="10.5" fill="var(--text-mute)">' + esc(opts.unit || '合计') + '</text>' +
      '</svg></div>' +
      '<div class="chart-legend" style="flex-direction:column;gap:6px;margin:0">' + legend + '</div></div>';
  }

  /** 横向条形图：items = [{label, value}] */
  function barsH(items, opts) {
    opts = opts || {};
    var data = (items || []).slice();
    if (!data.length) return '<div class="empty"><div class="ico">' + icon('chart') + '</div><b>暂无数据</b><p>' + esc(opts.emptyHint || '') + '</p></div>';
    var max = Math.max.apply(null, data.map(function (d) { return d.value; })) || 1;
    if (opts.stacked) {
      return '<div class="bars-h stacked">' + data.map(function (d) {
        var pct = Math.max(2, Math.round((d.value / max) * 100));
        return '<div class="bh-item"><div class="spread">' +
          '<span class="bh-label" title="' + esc(d.label) + '">' + esc(d.label) + '</span>' +
          '<span class="bh-val">' + (opts.format ? opts.format(d.value) : Core.fmtNum(d.value)) + '</span></div>' +
          '<span class="bh-track"><i class="bh-fill" style="width:' + pct + '%' + (d.color ? ';background:' + d.color : '') + '"></i></span></div>';
      }).join('') + '</div>';
    }
    return '<div class="bars-h">' + data.map(function (d) {
      var pct = Math.max(2, Math.round((d.value / max) * 100));
      return '<div class="bh-row"><span class="bh-label" title="' + esc(d.label) + '">' + esc(d.label) + '</span>' +
        '<span class="bh-track"><i class="bh-fill" style="width:' + pct + '%' + (d.color ? ';background:' + d.color : '') + '"></i></span>' +
        '<span class="bh-val">' + (opts.format ? opts.format(d.value) : Core.fmtNum(d.value)) + '</span></div>';
    }).join('') + '</div>';
  }

  /** 纵向柱状图：items = [{label, value}] */
  function barsV(items, opts) {
    opts = opts || {};
    var data = (items || []).slice();
    if (!data.length) return '<div class="empty"><div class="ico">' + icon('chart') + '</div><b>暂无数据</b><p>' + esc(opts.emptyHint || '') + '</p></div>';
    var max = Math.max.apply(null, data.map(function (d) { return d.value; })) || 1;
    return '<div class="bars-v">' + data.map(function (d) {
      var h = Math.max(3, Math.round((d.value / max) * 100));
      return '<div class="bv" title="' + esc(d.label + '：' + (opts.format ? opts.format(d.value) : d.value)) + '">' +
        '<div class="bv-track"><i class="bv-fill" style="height:' + h + '%' + (d.color ? ';background:' + d.color : '') + '"></i></div>' +
        '<span class="bv-label">' + esc(d.label) + '</span></div>';
    }).join('') + '</div>';
  }

  /** 进度环 */
  function ring(pct, opts) {
    opts = opts || {};
    var size = opts.size || 62, sw = opts.stroke || 7;
    var p = Math.max(0, Math.min(100, Core.num(pct)));
    var r = (size - sw) / 2, c = 2 * Math.PI * r;
    var color = opts.color || 'var(--brand)';
    return '<div class="ring-wrap" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--surface-3)" stroke-width="' + sw + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + sw + '" ' +
      'stroke-linecap="round" stroke-dasharray="' + ((p / 100) * c).toFixed(1) + ' ' + c.toFixed(1) + '" ' +
      'transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
      '</svg><div class="ring-text"><b>' + Math.round(p) + '<span style="display:inline;font-size:11px">%</span></b></div></div>';
  }

  /* ---------------- 月历 ---------------- */

  /**
   * calendar({year, month, weekStart, selected, cellHtml(date, meta), onclickAct})
   * cellHtml 返回格子内部 HTML（不含格子容器）
   */
  function calendar(cfg) {
    var year = cfg.year, month = cfg.month, ws = cfg.weekStart === 0 ? 0 : 1;
    var cells = Core.monthGrid(year, month, ws);
    var today = Core.ymd(new Date());
    var weekLabels = ws === 1 ? ['一', '二', '三', '四', '五', '六', '日'] : ['日', '一', '二', '三', '四', '五', '六'];

    var head = '<div class="cal-week">' + weekLabels.map(function (w) { return '<span>周' + w + '</span>'; }).join('') + '</div>';
    var grid = '<div class="cal-grid">' + cells.map(function (c) {
      var cls = 'cal-cell' + (c.inMonth ? '' : ' out') + (c.date === today ? ' today' : '') + (c.date === cfg.selected ? ' sel' : '');
      return '<button type="button" class="' + cls + '" data-act="pick-day" data-date="' + c.date + '">' +
        '<span class="d">' + c.day + '</span>' +
        (cfg.cellHtml ? cfg.cellHtml(c.date, c) : '') +
        '</button>';
    }).join('') + '</div>';

    return head + grid;
  }

  /* ---------------- 跨模块：加入今日计划 ---------------- */

  function addToPlan(item) {
    var Store = root.Store;
    if (!Store) return;
    var today = Core.ymd(new Date());
    var state = Store.get();
    var day = state.plans[today] || (state.plans[today] = { items: [], review: '' });
    if (item.refId) {
      var exists = day.items.some(function (it) {
        return it.source && it.source.refId === item.refId && !it.done;
      });
      if (exists) { toast('这条已经排进今日计划了', ''); return; }
    }
    Store.update(function (s) {
      var d = s.plans[today];
      d.items.push({
        id: Core.uid('plan'),
        title: item.title,
        module: item.module || 'other',
        time: item.time || '',
        priority: item.priority || 'mid',
        done: false,
        doneAt: '',
        note: item.note || '',
        source: item.refId ? { module: item.module || 'other', refId: item.refId } : null,
        createdAt: Core.nowISO()
      });
    }, 'add-to-plan');
    toast('已加入今日计划：' + item.title, 'ok');
  }

  /** 某条业务记录今天是否已排入今日计划 */
  function inPlanToday(refId) {
    if (!refId) return false;
    var st = root.Store ? root.Store.get() : null;
    if (!st) return false;
    var d = st.plans[Core.ymd(new Date())];
    if (!d) return false;
    return d.items.some(function (i) { return !i.done && i.source && i.source.refId === refId; });
  }

  /* ---------------- 常用片段 ---------------- */

  function moduleTag(key) {
    var m = MODULES[key] || MODULES.other;
    return '<span class="tag" style="background:color-mix(in srgb, ' + m.color + ' 13%, transparent);color:' + m.color + '">' + esc(m.name) + '</span>';
  }

  function priorityTag(p) {
    var m = PRIORITY[p] || PRIORITY.mid;
    return '<span class="tag ' + m.cls + '">' + m.name + '优先</span>';
  }

  function statCard(label, value, foot, iconName) {
    return '<div class="kpi"><div class="label">' + (iconName ? icon(iconName, 13) : '') + esc(label) + '</div>' +
      '<div class="value">' + value + '</div>' + (foot ? '<div class="foot">' + foot + '</div>' : '') + '</div>';
  }

  root.UI = {
    ICONS: ICONS, MODULES: MODULES, PRIORITY: PRIORITY,
    icon: icon, esc: esc, delegate: delegate, bind: bind, toast: toast,
    modal: buildModal, formModal: formModal, confirm: confirmDialog,
    emptyState: emptyState,
    chartLine: chartLine, chartDonut: chartDonut, barsH: barsH, barsV: barsV, ring: ring,
    calendar: calendar, addToPlan: addToPlan, inPlanToday: inPlanToday,
    moduleTag: moduleTag, priorityTag: priorityTag, statCard: statCard
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
