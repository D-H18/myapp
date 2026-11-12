/*!
 * views/fitness.js — 健身计划：月历 + 当日训练（部位/动作/组数/次数）
 */
window.Views = window.Views || {};
(function () {
  'use strict';
  var Core = window.Core, Store = window.Store, UI = window.UI;

  var today = Core.ymd(new Date());
  var month = Core.monthOf(today);
  var selected = today;

  var PARTS = [
    { key: 'chest', name: '胸', color: '#ef4444' },
    { key: 'back', name: '背', color: '#6366f1' },
    { key: 'legs', name: '腿', color: '#f59e0b' },
    { key: 'shoulders', name: '肩', color: '#0ea5e9' },
    { key: 'arms', name: '手臂', color: '#8b5cf6' },
    { key: 'core', name: '核心', color: '#10b981' },
    { key: 'cardio', name: '有氧', color: '#ec4899' }
  ];

  function partOf(k) {
    return PARTS.find(function (p) { return p.key === k; }) || PARTS[0];
  }

  function partOpts() {
    return PARTS.map(function (p) { return { v: p.key, t: p.name }; });
  }

  function fitForm(session) {
    UI.formModal({
      title: session ? '编辑训练动作' : '记录训练动作',
      desc: '日期：' + Core.fmtDateCN(session ? session.date : selected),
      fields: [
        { key: 'part', label: '训练部位', type: 'select', options: partOpts() },
        { key: 'exercise', label: '动作名称', type: 'text', required: true, placeholder: '例如：杠铃卧推' },
        { key: 'sets', label: '组数', type: 'number', min: 0, step: 1 },
        { key: 'reps', label: '每组次数', type: 'number', min: 0, step: 1 },
        { key: 'weight', label: '重量（kg，可选）', type: 'number', min: 0, step: 2.5, hint: '自重动作填 0' },
        { key: 'note', label: '备注（可选）', type: 'text' }
      ],
      values: session || { part: 'chest', exercise: '', sets: 4, reps: 10, weight: 0, note: '' },
      onSubmit: function (v) {
        Store.update(function (s) {
          if (session) {
            var it = Core.byId(s.fitness.sessions, session.id);
            if (it) {
              it.part = v.part; it.exercise = v.exercise; it.sets = v.sets;
              it.reps = v.reps; it.weight = v.weight; it.note = v.note;
            }
          } else {
            s.fitness.sessions.push({
              id: Core.uid('fit'), date: selected, part: v.part, exercise: v.exercise,
              sets: v.sets, reps: v.reps, weight: v.weight, note: v.note, createdAt: Core.nowISO()
            });
          }
        }, 'fitness-session');
        window.App.refresh();
      }
    });
  }

  function cellHtml(date, byDate) {
    var d = byDate[date];
    if (!d) return '';
    var parts = Object.keys(d.parts).sort(function (a, b) { return d.parts[b] - d.parts[a]; }).slice(0, 2);
    return '<span class="chips">' + parts.map(function (k) {
      var p = partOf(k);
      return '<span class="dot-chip" style="background:color-mix(in srgb, ' + p.color + ' 15%, transparent);color:' + p.color + '">' +
        p.name + ' ' + d.parts[k] + '组</span>';
    }).join('') + '</span>' +
      '<span class="mini">' + d.count + ' 个动作' + (parts.length < Object.keys(d.parts).length ? ' · 等' : '') + '</span>';
  }

  function render(el) {
    var st = Store.get();
    var y = Number(month.slice(0, 4)), m = Number(month.slice(5, 7));
    var stats = Core.fitnessStats(st.fitness.sessions, { today: today, month: month, weekStart: st.settings.weekStart });
    var dayList = st.fitness.sessions.filter(function (s) { return s.date === selected; });
    var daySets = Core.sum(dayList, function (s) { return s.sets; });
    var dayVolume = Math.round(Core.sum(dayList, function (s) { return s.sets * s.reps * s.weight; }));

    el.innerHTML =
      '<div class="grid g-4">' +
        UI.statCard('本月训练', stats.monthDays + ' 天', '共 ' + stats.monthSessions + ' 个动作 · ' + stats.monthSets + ' 组', 'calendar') +
        UI.statCard('连续打卡', stats.streak + ' 天', stats.streak >= 3 ? '保持住，别断' : '今天练一下就开始了', 'flame') +
        UI.statCard('本周训练', stats.weekDays + ' 天', stats.weekSessions + ' 个动作', 'target') +
        UI.statCard('累计容量', Core.fmtNum(stats.volume) + ' kg', '组数 × 次数 × 重量', 'chart') +
      '</div>' +

      '<div class="grid mt-16" style="grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);align-items:start">' +
        '<div class="card">' +
          '<div class="cal-head">' +
            '<div class="row">' +
              '<button class="icon-btn" data-act="prev-month">' + UI.icon('chevronLeft', 17) + '</button>' +
              '<div class="cal-title">' + Core.fmtMonthCN(month) + '</div>' +
              '<button class="icon-btn" data-act="next-month">' + UI.icon('chevronRight', 17) + '</button>' +
            '</div>' +
            '<div class="row">' +
              '<button class="btn btn-sm" data-act="this-month">本月</button>' +
              '<button class="btn btn-primary btn-sm" data-act="add">' + UI.icon('plus', 14) + ' 记录训练</button>' +
            '</div>' +
          '</div>' +
          '<div class="cal-head" style="margin-bottom:6px"><span class="small muted">点日期查看/记录当天训练；格子里是部位与组数</span></div>' +
          UI.calendar({
            year: y, month: m, weekStart: st.settings.weekStart, selected: selected,
            cellHtml: function (date) { return cellHtml(date, stats.byDate); }
          }) +
          '<div class="chart-legend" style="margin-top:12px">' + PARTS.map(function (p) {
            return '<span><i style="background:' + p.color + '"></i>' + p.name + '</span>';
          }).join('') + '</div>' +
        '</div>' +

        '<div class="stack">' +
          '<div class="card">' +
            '<div class="card-head">' +
              '<div class="card-title">' + UI.icon('dumbbell') + ' ' + Core.fmtDateCN(selected) + (selected === today ? ' <span class="tag brand">今天</span>' : '') + '</div>' +
              '<div class="row"><button class="btn btn-sm btn-soft" data-act="add">' + UI.icon('plus', 13) + ' 动作</button></div>' +
            '</div>' +
            (dayList.length ? (
              '<div class="row wrap" style="gap:6px;margin-bottom:10px">' +
                '<span class="tag">' + dayList.length + ' 个动作</span>' +
                '<span class="tag">' + daySets + ' 组</span>' +
                (dayVolume ? '<span class="tag">' + Core.fmtNum(dayVolume) + ' kg</span>' : '') +
              '</div>' +
              dayList.map(function (s) {
                var p = partOf(s.part);
                return '<div class="timeline-item">' +
                  '<span class="tag" style="background:color-mix(in srgb, ' + p.color + ' 14%, transparent);color:' + p.color + ';height:22px">' + p.name + '</span>' +
                  '<div class="grow"><div style="font-size:13px;font-weight:550">' + UI.esc(s.exercise) + '</div>' +
                    '<div class="small muted">' + s.sets + ' 组 × ' + s.reps + ' 次' + (s.weight ? ' · ' + s.weight + ' kg' : ' · 自重') + '</div></div>' +
                  '<div class="row" style="gap:0">' +
                    '<button class="icon-btn" data-act="edit" data-id="' + s.id + '">' + UI.icon('edit', 14) + '</button>' +
                    '<button class="icon-btn danger" data-act="del" data-id="' + s.id + '">' + UI.icon('trash', 14) + '</button>' +
                  '</div></div>';
              }).join('') +
              '<div class="mt-12"><button class="btn btn-sm" data-act="plan">' + UI.icon('target', 13) + ' 加入今日计划</button></div>'
            ) : UI.emptyState('dumbbell', '这天还没有训练记录', '点「记录训练」，写下部位、动作、组数和次数')) +
          '</div>' +

          '<div class="card">' +
            '<div class="card-head"><div class="card-title">' + UI.icon('calendar') + ' 本周概览</div>' +
              '<span class="small muted">' + stats.weekDays + ' / 7 天</span></div>' +
            Core.weekDates(today, st.settings.weekStart).map(function (dt) {
              var rec = stats.byDate[dt];
              var names = rec ? Object.keys(rec.parts).map(function (k) { return partOf(k).name; }) : [];
              return '<div class="spread" style="padding:5px 0;border-bottom:1px dashed var(--border)">' +
                '<span class="small ' + (dt === today ? '' : 'dim') + '">' + (dt === today ? '今天' : Core.fmtDateShort(dt)) + '</span>' +
                (rec ? '<span class="small">' + names.join(' / ') + ' · ' + rec.sets + ' 组</span>'
                  : '<span class="small muted">休息</span>') +
              '</div>';
            }).join('') +
          '</div>' +

          '<div class="card">' +
            '<div class="card-head"><div class="card-title">' + UI.icon('chart') + ' 部位组数分布</div><span class="small muted">累计</span></div>' +
            UI.barsH(stats.byPart.map(function (p) {
              return { label: partOf(p.part).name, value: p.sets, color: partOf(p.part).color };
            }), { format: function (v) { return v + ' 组'; }, emptyHint: '记录训练后显示' }) +
          '</div>' +
        '</div>' +
      '</div>';

    /* 事件 */
    UI.bind(el, 'click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.dataset.act, id = btn.dataset.id;

      if (act === 'pick-day') {
        selected = btn.dataset.date;
        if (btn.dataset.date.slice(0, 7) !== month) month = btn.dataset.date.slice(0, 7);
        render(el);
      } else if (act === 'prev-month') {
        month = Core.addMonths(month, -1); render(el);
      } else if (act === 'next-month') {
        month = Core.addMonths(month, 1); render(el);
      } else if (act === 'this-month') {
        month = Core.monthOf(today); selected = today; render(el);
      } else if (act === 'add') {
        fitForm(null);
      } else if (act === 'edit') {
        fitForm(Core.byId(Store.get().fitness.sessions, id));
      } else if (act === 'del') {
        Store.update(function (s) { s.fitness.sessions = s.fitness.sessions.filter(function (x) { return x.id !== id; }); }, 'fitness-del');
        render(el);
      } else if (act === 'plan') {
        var parts = {};
        dayList.forEach(function (s) { parts[partOf(s.part).name] = true; });
        UI.addToPlan({
          title: '训练：' + Object.keys(parts).join('/') + '（' + dayList.length + ' 个动作）',
          module: 'fitness',
          refId: 'fit:' + selected,
          note: daySets + ' 组'
        });
        render(el);
      }
    });
  }

  window.Views.fitness = {
    title: '健身计划',
    sub: '月历记录每天练了什么部位、哪些动作、几组几次',
    render: render
  };
})();
