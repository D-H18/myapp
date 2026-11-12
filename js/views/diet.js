/*!
 * views/diet.js — 饮食计划：月历 + 当日餐次 / 营养素 / 饮水
 */
window.Views = window.Views || {};
(function () {
  'use strict';
  var Core = window.Core, Store = window.Store, UI = window.UI;

  var today = Core.ymd(new Date());
  var month = Core.monthOf(today);
  var selected = today;

  var TYPES = [
    { key: 'breakfast', name: '早餐', icon: 'coffee', color: '#f59e0b' },
    { key: 'lunch', name: '午餐', icon: 'utensils', color: '#0ea5e9' },
    { key: 'dinner', name: '晚餐', icon: 'utensils', color: '#8b5cf6' },
    { key: 'snack', name: '加餐', icon: 'apple', color: '#10b981' }
  ];

  function typeOf(k) {
    return TYPES.find(function (t) { return t.key === k; }) || TYPES[1];
  }

  function mealForm(meal, presetType) {
    UI.formModal({
      title: meal ? '编辑餐次' : '记录一餐',
      desc: '日期：' + Core.fmtDateCN(meal ? meal.date : selected),
      wide: true,
      fields: [
        { key: 'type', label: '餐次', type: 'select', options: TYPES.map(function (t) { return { v: t.key, t: t.name }; }) },
        { key: 'name', label: '吃了什么', type: 'text', required: true, placeholder: '例如：鸡胸肉沙拉' },
        { key: 'kcal', label: '热量（kcal）', type: 'number', min: 0, step: 10 },
        { key: 'protein', label: '蛋白质（g）', type: 'number', min: 0, step: 1 },
        { key: 'carbs', label: '碳水（g）', type: 'number', min: 0, step: 1 },
        { key: 'fat', label: '脂肪（g）', type: 'number', min: 0, step: 1 },
        { key: 'note', label: '备注（可选）', type: 'text', span: 2 }
      ],
      values: meal || { type: presetType || 'lunch', name: '', kcal: 0, protein: 0, carbs: 0, fat: 0, note: '' },
      onSubmit: function (v) {
        Store.update(function (s) {
          if (meal) {
            var m2 = Core.byId(s.diet.meals, meal.id);
            if (m2) {
              m2.type = v.type; m2.name = v.name; m2.kcal = v.kcal;
              m2.protein = v.protein; m2.carbs = v.carbs; m2.fat = v.fat; m2.note = v.note;
            }
          } else {
            s.diet.meals.push({
              id: Core.uid('meal'), date: selected, type: v.type, name: v.name,
              kcal: v.kcal, protein: v.protein, carbs: v.carbs, fat: v.fat, note: v.note
            });
          }
        }, 'diet-meal');
        window.App.refresh();
      }
    });
  }

  function targetForm() {
    var t = Store.get().settings.dietTargets;
    UI.formModal({
      title: '每日目标',
      desc: '用于计算进度条与「还可摄入多少」',
      fields: [
        { key: 'kcal', label: '热量目标（kcal）', type: 'number', min: 0, step: 50 },
        { key: 'water', label: '饮水目标（ml）', type: 'number', min: 0, step: 250 },
        { key: 'protein', label: '蛋白质目标（g）', type: 'number', min: 0, step: 5 },
        { key: 'carbs', label: '碳水目标（g）', type: 'number', min: 0, step: 5 },
        { key: 'fat', label: '脂肪目标（g）', type: 'number', min: 0, step: 5 }
      ],
      values: t,
      onSubmit: function (v) {
        Store.update(function (s) {
          s.settings.dietTargets = { kcal: v.kcal, water: v.water, protein: v.protein, carbs: v.carbs, fat: v.fat };
        }, 'diet-target');
        window.App.refresh();
        UI.toast('每日目标已更新', 'ok', 1500);
      }
    });
  }

  function cellHtml(date) {
    var st = Store.get();
    var kcal = Core.sum(st.diet.meals.filter(function (m) { return m.date === date; }), function (m) { return m.kcal; });
    var target = Core.num(st.settings.dietTargets.kcal, 2000) || 1;
    if (!kcal) return '';
    var pct = Math.min(100, Math.round((kcal / target) * 100));
    var over = kcal > target;
    return '<span style="font-size:10.5px;font-weight:600;color:' + (over ? 'var(--danger)' : 'var(--text-dim)') + '">' + Core.fmtNum(kcal) + '</span>' +
      '<span style="display:block;height:3px;border-radius:99px;background:var(--surface-3);margin-top:2px;overflow:hidden">' +
      '<i style="display:block;height:100%;width:' + pct + '%;background:' + (over ? 'var(--danger)' : 'linear-gradient(90deg,#34d399,#10b981)') + '"></i></span>';
  }

  function macroRow(label, value, target, unit, color) {
    var pct = target ? Math.round((value / target) * 100) : 0;
    return '<div style="margin-bottom:9px">' +
      '<div class="spread small" style="margin-bottom:4px"><span class="dim">' + label + '</span>' +
        '<span class="mono">' + Core.round1(value) + ' / ' + target + ' ' + unit + '</span></div>' +
      '<div class="progress" style="height:5px"><i style="width:' + Math.min(100, pct) + '%;background:' + color + '"></i></div>' +
    '</div>';
  }

  function render(el) {
    var st = Store.get();
    var targets = st.settings.dietTargets;
    var d = Core.dietDay(st.diet.meals, selected, targets, st.diet.water[selected]);
    var y = Number(month.slice(0, 4)), m = Number(month.slice(5, 7));
    var week = Core.weekDates(selected, st.settings.weekStart);
    var weekStat = Core.dietRange(st.diet.meals, week, targets);

    el.innerHTML =
      '<div class="grid g-4">' +
        UI.statCard('今日摄入', '<span style="color:' + (d.kcal > d.kcalTarget ? 'var(--danger)' : 'inherit') + '">' + Core.fmtNum(d.kcal) + '</span> kcal',
          '目标 ' + Core.fmtNum(d.kcalTarget) + ' kcal', 'flame') +
        UI.statCard('剩余可摄入', Core.fmtNum(Math.abs(d.remaining)) + ' kcal', d.remaining >= 0 ? '还可以吃点' : '已超出目标', 'target') +
        UI.statCard('蛋白质', d.protein + ' g', '目标 ' + targets.protein + ' g', 'dumbbell') +
        UI.statCard('本周日均', Core.fmtNum(weekStat.avgKcal) + ' kcal', '记录 ' + weekStat.loggedDays + ' / 7 天', 'chart') +
      '</div>' +

      '<div class="grid mt-16" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);align-items:start">' +
        '<div class="card">' +
          '<div class="cal-head">' +
            '<div class="row">' +
              '<button class="icon-btn" data-act="prev-month">' + UI.icon('chevronLeft', 17) + '</button>' +
              '<div class="cal-title">' + Core.fmtMonthCN(month) + '</div>' +
              '<button class="icon-btn" data-act="next-month">' + UI.icon('chevronRight', 17) + '</button>' +
            '</div>' +
            '<div class="row">' +
              '<button class="btn btn-sm" data-act="targets">' + UI.icon('target', 14) + ' 每日目标</button>' +
              '<button class="btn btn-primary btn-sm" data-act="add">' + UI.icon('plus', 14) + ' 记录饮食</button>' +
            '</div>' +
          '</div>' +
          '<div class="cal-head" style="margin-bottom:6px"><span class="small muted">点日期查看当天饮食；格子里是当天摄入热量</span></div>' +
          UI.calendar({
            year: y, month: m, weekStart: st.settings.weekStart, selected: selected,
            cellHtml: cellHtml
          }) +
        '</div>' +

        '<div class="stack">' +
          '<div class="card">' +
            '<div class="card-head">' +
              '<div class="card-title">' + UI.icon('utensils') + ' ' + Core.fmtDateCN(selected) + (selected === today ? ' <span class="tag brand">今天</span>' : '') + '</div>' +
              '<div class="row"><button class="btn btn-sm btn-soft" data-act="add">' + UI.icon('plus', 13) + ' 一餐</button></div>' +
            '</div>' +
            '<div class="row" style="gap:14px;margin-bottom:12px">' +
              UI.ring(d.pct, { size: 66, stroke: 7, color: d.kcal > d.kcalTarget ? 'var(--danger)' : 'var(--brand)' }) +
              '<div class="grow">' +
                '<div style="font-size:19px;font-weight:700;letter-spacing:-.02em" class="mono">' + Core.fmtNum(d.kcal) + ' <span style="font-size:12px;color:var(--text-mute)">/ ' + Core.fmtNum(d.kcalTarget) + ' kcal</span></div>' +
                '<div class="small ' + (d.remaining >= 0 ? 'muted' : '') + '" style="color:' + (d.remaining >= 0 ? '' : 'var(--danger)') + '">' +
                  (d.remaining >= 0 ? '还可摄入 ' + Core.fmtNum(d.remaining) + ' kcal' : '超出 ' + Core.fmtNum(-d.remaining) + ' kcal') + '</div>' +
              '</div>' +
            '</div>' +
            macroRow('蛋白质', d.protein, targets.protein, 'g', 'linear-gradient(90deg,#38bdf8,#0ea5e9)') +
            macroRow('碳水', d.carbs, targets.carbs, 'g', 'linear-gradient(90deg,#fbbf24,#f59e0b)') +
            macroRow('脂肪', d.fat, targets.fat, 'g', 'linear-gradient(90deg,#a78bfa,#8b5cf6)') +
            '<div class="divider"></div>' +
            '<div class="spread">' +
              '<div><div class="small dim">饮水</div><div class="mono" style="font-size:15px;font-weight:650">' + d.water + ' ml</div></div>' +
              '<div class="row">' +
                '<button class="btn btn-sm" data-act="water-minus">−250ml</button>' +
                '<button class="btn btn-sm btn-soft" data-act="water-plus">+250ml</button>' +
              '</div>' +
            '</div>' +
            '<div class="progress mt-8" style="height:5px"><i style="width:' + Math.min(100, d.waterPct) + '%;background:linear-gradient(90deg,#67e8f9,#06b6d4)"></i></div>' +
          '</div>' +

          '<div class="card">' +
            '<div class="card-head"><div class="card-title">' + UI.icon('layers') + ' 当天餐次 <span class="tag">' + d.count + '</span></div></div>' +
            (d.count ? TYPES.map(function (t) {
              var list = d.byMeal[t.key] || [];
              if (!list.length) return '';
              var cal = Core.sum(list, function (m3) { return m3.kcal; });
              return '<div style="margin-bottom:12px">' +
                '<div class="spread" style="margin-bottom:4px"><b style="font-size:12.5px">' + t.name + '</b>' +
                  '<span class="small muted">' + Core.fmtNum(cal) + ' kcal</span></div>' +
                list.map(function (m3) {
                  return '<div class="timeline-item" style="padding:6px 0">' +
                    '<div class="grow"><div style="font-size:12.5px">' + UI.esc(m3.name) + '</div>' +
                      '<div class="small muted">蛋白 ' + m3.protein + 'g · 碳水 ' + m3.carbs + 'g · 脂肪 ' + m3.fat + 'g</div></div>' +
                    '<div class="row" style="gap:0">' +
                      '<button class="icon-btn" data-act="edit" data-id="' + m3.id + '">' + UI.icon('edit', 13) + '</button>' +
                      '<button class="icon-btn danger" data-act="del" data-id="' + m3.id + '">' + UI.icon('trash', 13) + '</button>' +
                    '</div></div>';
                }).join('') +
              '</div>';
            }).join('')
              : UI.emptyState('utensils', '这天还没有记录', '点「记录饮食」把三餐记下来，热量和营养素会自动算')) +
          '</div>' +
        '</div>' +
      '</div>';

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
      } else if (act === 'add') {
        mealForm(null);
      } else if (act === 'edit') {
        mealForm(Core.byId(Store.get().diet.meals, id));
      } else if (act === 'del') {
        Store.update(function (s) { s.diet.meals = s.diet.meals.filter(function (x) { return x.id !== id; }); }, 'diet-del');
        render(el);
      } else if (act === 'targets') {
        targetForm();
      } else if (act === 'water-plus' || act === 'water-minus') {
        var delta = act === 'water-plus' ? 250 : -250;
        Store.update(function (s) {
          s.diet.water[selected] = Math.max(0, Core.num(s.diet.water[selected]) + delta);
        }, 'diet-water');
        render(el);
      }
    });
  }

  window.Views.diet = {
    title: '饮食计划',
    sub: '月历记录每天吃了什么 · 热量、三大营养素与饮水一目了然',
    render: render
  };
})();
