
/* =========================================================
   MANTHANBITES - PHASE 5
   STEP 1: ADVANCED ANALYTICS ENGINE
   Backward compatible with Phase 2, 3 and 4 storage.
   Existing user data is READ ONLY.
========================================================= */

(function () {
  'use strict';

  if (window.__mbDashboardPhase5Loaded) return;
  window.__mbDashboardPhase5Loaded = true;

  const $ = id => document.getElementById(id);

  const KEYS = {
    tracker: 'mb_tracker',
    challenge: 'mb_challenge',
    goals: 'mb_dashboard_goals_v1'
  };

  function safeRead(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      console.warn('ManthanBites: Could not read', key, error);
      return fallback;
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('ManthanBites: Could not save', key, error);
      alert('Data save nahi ho paaya. Browser storage check karein.');
      return false;
    }
  }

  const pad = n => String(n).padStart(2, '0');

  function dateKey(date) {
    return date.getFullYear() + '-' +
      pad(date.getMonth() + 1) + '-' +
      pad(date.getDate());
  }

  function dateFromKey(value) {
    const parts = value.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 12);
  }

  function dateAtNoon(date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12
    );
  }

  function addDays(date, amount) {
    const result = dateAtNoon(date);
    result.setDate(result.getDate() + amount);
    return result;
  }

  function formatDate(date, options) {
    return date.toLocaleDateString('en-IN', options || {
      day: 'numeric',
      month: 'short'
    });
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function setWidth(id, percent) {
    const element = $(id);
    if (element) {
      element.style.width =
        Math.max(0, Math.min(100, percent)) + '%';
    }
  }

  // ---------------------------------------------------------
  // READ EXISTING DATA - NEVER MODIFY PHASE 4 STORAGE
  // ---------------------------------------------------------

  const tracker = safeRead(KEYS.tracker, null);

  const validTracker =
    tracker &&
    typeof tracker === 'object' &&
    Array.isArray(tracker.h) &&
    tracker.l &&
    typeof tracker.l === 'object' &&
    !Array.isArray(tracker.l);

  const state = validTracker ? tracker : {
    h: [],
    l: {}
  };

  const habits = state.h.filter(
    habit => typeof habit === 'string' && habit.trim()
  );

  const logs = state.l;

  const challengeData = safeRead(KEYS.challenge, []);

  const challengeDays = Array.isArray(challengeData)
    ? challengeData
    : challengeData &&
      Array.isArray(challengeData.completed)
      ? challengeData.completed
      : challengeData &&
        Array.isArray(challengeData.days)
        ? challengeData.days
        : [];

  const challengeCount = challengeDays
    .filter(value => value === true).length;

  const today = dateAtNoon(new Date());
  const todayKey = dateKey(today);

  // ---------------------------------------------------------
  // CORE ANALYTICS
  // ---------------------------------------------------------

  function isDone(date, habit) {
    const list = logs[dateKey(date)];
    return Array.isArray(list) && list.includes(habit);
  }

  function dayCount(date) {
    return habits.reduce(
      (total, habit) => total + (isDone(date, habit) ? 1 : 0),
      0
    );
  }

  function activeDayCount(days) {
    return days.filter(date => dayCount(date) > 0).length;
  }

  function getWeekData() {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      days.push(addDays(today, -i));
    }

    const totals = habits.map(habit => ({
      habit,
      count: days.filter(date => isDone(date, habit)).length
    }));

    const checkins = days.reduce(
      (sum, date) => sum + dayCount(date),
      0
    );

    const possible = habits.length * 7;

    return {
      days,
      totals,
      checkins,
      possible,
      rate: possible
        ? Math.round(checkins / possible * 100)
        : 0,
      start: days[0],
      end: days[6]
    };
  }

  function getMonthData(value) {
    const parts = value.split('-').map(Number);
    const year = parts[0];
    const month = parts[1];

    const totalDays = new Date(year, month, 0).getDate();

    const selectedMonth = year + '-' + pad(month);
    const currentMonth = today.getFullYear() +
      '-' + pad(today.getMonth() + 1);

    let elapsedDays = totalDays;

    if (selectedMonth === currentMonth) {
      elapsedDays = today.getDate();
    } else if (selectedMonth > currentMonth) {
      elapsedDays = 0;
    }

    const days = [];
    let completed = 0;
    let best = 0;
    let bestDay = null;

    for (let n = 1; n <= totalDays; n++) {
      const date = new Date(year, month - 1, n, 12);
      const count = dayCount(date);

      if (n <= elapsedDays) {
        completed += count;

        if (count > best) {
          best = count;
          bestDay = date;
        }
      }

      days.push({
        date,
        count,
        elapsed: n <= elapsedDays,
        percent: habits.length
          ? Math.round(count / habits.length * 100)
          : 0
      });
    }

    const possible = elapsedDays * habits.length;

    return {
      year,
      month,
      totalDays,
      elapsedDays,
      days,
      completed,
      possible,
      rate: possible
        ? Math.round(completed / possible * 100)
        : 0,
      bestDay
    };
  }

  // ---------------------------------------------------------
  // MONTHLY ANALYTICS
  // ---------------------------------------------------------

  const monthInput = $('month-picker');

  function renderMonth() {
    if (!monthInput) return;

    const value = monthInput.value;
    if (!/^\d{4}-\d{2}$/.test(value)) return;

    const data = getMonthData(value);

    const monthDate = new Date(
      data.year,
      data.month - 1,
      1,
      12
    );

    setText(
      'month-title',
      monthDate.toLocaleDateString('hi-IN', {
        month: 'long',
        year: 'numeric'
      })
    );

    setText('month-rate', data.rate + '%');
    setText('month-done', String(data.completed));

    setText(
      'month-best',
      data.bestDay
        ? formatDate(data.bestDay)
        : '—'
    );

    const chart = $('monthly-chart');
    if (!chart) return;

    chart.replaceChildren();

    data.days.forEach(item => {
      const cell = document.createElement('div');
      cell.className = 'month-cell';

      cell.title =
        formatDate(item.date) + ': ' +
        item.count + ' check-ins' +
        (item.elapsed ? '' : ' (Not elapsed)');

      const bar = document.createElement('i');

      bar.style.height = item.elapsed
        ? item.percent + '%'
        : '0%';

      if (!item.elapsed) {
        cell.classList.add('future-day');
      }

      cell.appendChild(bar);
      chart.appendChild(cell);
    });

    chart.setAttribute(
      'aria-label',
      'Monthly completion rate ' + data.rate + ' percent'
    );
  }

  if (monthInput) {
    monthInput.value =
      today.getFullYear() + '-' +
      pad(today.getMonth() + 1);

    monthInput.addEventListener('change', renderMonth);
  }

  // ---------------------------------------------------------
  // WEEKLY ANALYTICS
  // ---------------------------------------------------------

  function renderWeekly() {
    const week = getWeekData();

    const chart = $('weekly-chart');

    if (chart) {
      chart.replaceChildren();

      week.days.forEach(date => {
        const count = dayCount(date);
        const percent = habits.length
          ? Math.round(count / habits.length * 100)
          : 0;

        const column = document.createElement('div');
        column.className = 'week-col';

        const value = document.createElement('span');
        value.className = 'week-percent';
        value.textContent = percent + '%';

        const track = document.createElement('div');
        track.className = 'week-track';

        const fill = document.createElement('div');
        fill.className = 'week-fill';
        fill.style.height = percent + '%';

        track.appendChild(fill);

        const label = document.createElement('span');
        label.className = 'week-day';
        label.textContent = date.toLocaleDateString('en-IN', {
          weekday: 'short'
        });

        column.title =
          formatDate(date) + ': ' + count +
          '/' + habits.length + ' habits';

        column.append(value, track, label);
        chart.appendChild(column);
      });
    }

    setText('stat-habits', habits.length);
    setText('stat-rate', week.rate + '%');
    setText('stat-today', dayCount(today) + '/' + habits.length);
    setText('stat-challenge', challengeCount + '/7');

    setText(
      'week-label',
      formatDate(week.start) + ' – ' + formatDate(week.end)
    );

    // Habit-wise progress
    const list = $('habit-breakdown');
    const empty = $('habit-empty');

    if (list) {
      list.replaceChildren();

      if (empty) empty.hidden = habits.length > 0;

      habits.forEach(habit => {
        const count = week.totals.find(
          item => item.habit === habit
        )?.count || 0;

        const row = document.createElement('div');
        row.className = 'habit-row';

        const name = document.createElement('span');
        name.className = 'habit-name';
        name.textContent = habit;

        const track = document.createElement('div');
        track.className = 'habit-track';

        const fill = document.createElement('div');
        fill.className = 'habit-fill';
        fill.style.width = (count / 7 * 100) + '%';

        track.appendChild(fill);

        const percentage = document.createElement('span');
        percentage.className = 'habit-percent';
        percentage.textContent = count + '/7';

        row.append(name, track, percentage);
        list.appendChild(row);
      });
    }

    return week;
  }

  // ---------------------------------------------------------
  // PERSONAL GOALS
  // ---------------------------------------------------------

  function renderGoals() {
    const wrap = $('goal-list');
    if (!wrap) return;

    let goals = safeRead(KEYS.goals, []);
    if (!Array.isArray(goals)) goals = [];

    wrap.replaceChildren();

    if (!goals.length) {
      const message = document.createElement('p');
      message.className = 'empty-state';
      message.textContent =
        'Abhi koi personal goal nahi hai. Apna pehla goal add karein.';
      wrap.appendChild(message);
      return;
    }

    const week = getWeekData();
    const activeDays = activeDayCount(week.days);

    goals.forEach((goal, index) => {
      const target = Number(goal.target);

      const validTarget =
        Number.isInteger(target) && target >= 1 && target <= 7;

      const progress = validTarget
        ? Math.min(100, Math.round(activeDays / target * 100))
        : 0;

      const row = document.createElement('div');
      row.className = 'goal-item';

      const title = document.createElement('strong');
      title.textContent = goal.name || 'Personal Goal';

      const meta = document.createElement('span');
      meta.textContent = validTarget
        ? 'Active days: ' + activeDays + '/' + target +
          ' · ' + progress + '%'
        : 'Invalid goal target';

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'text-button';
      remove.textContent = 'Delete';
      remove.setAttribute(
        'aria-label',
        'Delete goal ' + (goal.name || '')
      );

      remove.addEventListener('click', () => {
        if (!confirm('Kya aap is personal goal ko delete karna chahte hain?')) {
          return;
        }

        goals.splice(index, 1);

        if (safeWrite(KEYS.goals, goals)) {
          renderGoals();
        }
      });

      const track = document.createElement('div');
      track.className = 'goal-progress';

      const fill = document.createElement('i');
      fill.style.width = progress + '%';

      track.appendChild(fill);
      row.append(title, meta, remove, track);
      wrap.appendChild(row);
    });
  }

  const goalForm = $('goal-form');

  if (goalForm) {
    goalForm.addEventListener('submit', event => {
      event.preventDefault();

      const name = $('goal-name')?.value.trim();
      const target = Number($('goal-target')?.value);

      if (!name || !Number.isInteger(target) ||
          target < 1 || target > 7) {
        alert('Goal name aur weekly target 1 se 7 ke beech enter karein.');
        return;
      }

      const goals = safeRead(KEYS.goals, []);
      if (!Array.isArray(goals)) {
        alert('Goals data read nahi ho paaya. Pehle backup check karein.');
        return;
      }

      if (goals.some(goal =>
        String(goal.name).toLowerCase() === name.toLowerCase()
      )) {
        alert('Yeh goal pehle se added hai.');
        return;
      }

      goals.push({
        name,
        target,
        created: dateKey(today)
      });

      if (safeWrite(KEYS.goals, goals)) {
        $('goal-name').value = '';
        renderGoals();
      }
    });
  }

  // ---------------------------------------------------------
  // WEEKLY REPORT + CSV EXPORT
  // ---------------------------------------------------------

  function renderReport() {
    const week = getWeekData();

    setText(
      'report-range',
      formatDate(week.start) + ' – ' + formatDate(week.end)
    );

    setText('report-checkins', week.checkins);
    setText('report-rate', week.rate + '%');

    const best = week.totals.slice().sort(
      (a, b) => b.count - a.count
    )[0];

    setText(
      'report-best',
      best && best.count > 0 ? best.habit : '—'
    );

    setText(
      'report-summary',
      habits.length
        ? 'Pichhle 7 din mein ' + week.checkins +
          ' of ' + week.possible +
          ' possible habit check-ins complete hue.'
        : 'Habit Tracker mein habits add karne ke baad report yahan dikhegi.'
    );

    const download = $('download-report');

    if (download) {
      download.onclick = () => {
        const rows = [
          ['Date', 'Habit', 'Completed']
        ];

        week.days.forEach(date => {
          habits.forEach(habit => {
            rows.push([
              dateKey(date),
              habit,
              isDone(date, habit) ? 'Yes' : 'No'
            ]);
          });
        });

        const csv = rows.map(row =>
          row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
          ).join(',')
        ).join('\r\n');

        const blob = new Blob(
          ['\ufeff' + csv],
          { type: 'text/csv;charset=utf-8' }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'manthanbites-weekly-report.csv';

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
    }

    const print = $('print-report');
    if (print) {
      print.onclick = () => window.print();
    }
  }

  // ---------------------------------------------------------
  // CHALLENGE PROGRESS
  // ---------------------------------------------------------

  setWidth('challenge-bar', challengeCount / 7 * 100);

  setText('challenge-count', challengeCount + ' / 7 days');

  setText(
    'challenge-message',
    challengeCount === 7
      ? 'Shabash! Aapne challenge ke sabhi 7 din complete kar liye.'
      : challengeCount + ' din complete hue. Agla available step challenge page par dekhein.'
  );

  // ---------------------------------------------------------
  // INITIALIZE DASHBOARD
  // ---------------------------------------------------------

  renderMonth();
  const week = renderWeekly();
  renderGoals();
  renderReport();

  console.info('ManthanBites Phase 5 Analytics initialized.', {
    activeHabits: habits.length,
    weeklyCheckins: week.checkins,
    challengeDays: challengeCount
  });

})();
