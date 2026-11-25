
/* =====================================================
   MANTHANBITES - PHASE 5
   STEP 3: ADVANCED REPORTS & DATA MANAGEMENT
   Existing data keys are preserved.
===================================================== */

(function () {
  'use strict';

  if (window.__mbPhase5DataTools) return;
  window.__mbPhase5DataTools = true;

  const KEYS = [
    'mb_tracker',
    'mb_challenge',
    'mb_dashboard_goals_v1'
  ];

  const $ = id => document.getElementById(id);

  const read = key => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? null : JSON.parse(raw);
    } catch (_) {
      return null;
    }
  };

  const pad = n => String(n).padStart(2, '0');

  const keyDate = d =>
    d.getFullYear() + '-' +
    pad(d.getMonth() + 1) + '-' +
    pad(d.getDate());

  const download = (filename, content, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const csvEscape = value =>
    '"' + String(value ?? '').replace(/"/g, '""') + '"';

  function getData() {
    const tracker = read('mb_tracker');
    const challenge = read('mb_challenge');
    const goals = read('mb_dashboard_goals_v1');

    const validTracker =
      tracker &&
      Array.isArray(tracker.h) &&
      tracker.l &&
      typeof tracker.l === 'object' &&
      !Array.isArray(tracker.l);

    return {
      tracker: validTracker ? tracker : null,
      challenge,
      goals: Array.isArray(goals) ? goals : []
    };
  }

  function isDone(tracker, date, habit) {
    if (!tracker) return false;
    const list = tracker.l[keyDate(date)];
    return Array.isArray(list) && list.includes(habit);
  }

  function getMonthReport(monthValue) {
    const parts = monthValue.split('-').map(Number);
    const year = parts[0];
    const month = parts[1];

    const now = new Date();
    const currentValue =
      now.getFullYear() + '-' + pad(now.getMonth() + 1);

    const daysInMonth = new Date(year, month, 0).getDate();

    const elapsed = monthValue < currentValue
      ? daysInMonth
      : monthValue > currentValue
        ? 0
        : now.getDate();

    const data = getData();
    const tracker = data.tracker;
    const habits = tracker ? tracker.h : [];

    let completed = 0;
    let bestDay = '—';
    let bestCount = 0;
    const rows = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day, 12);
      let count = 0;

      habits.forEach(habit => {
        const done = isDone(tracker, date, habit);

        if (done && day <= elapsed) completed++;

        if (day <= elapsed) {
          rows.push([
            keyDate(date),
            habit,
            done ? 'Yes' : 'No'
          ]);
        }

        if (done) count++;
      });

      if (day <= elapsed && count > bestCount) {
        bestCount = count;
        bestDay = keyDate(date);
      }
    }

    const possible = habits.length * elapsed;

    return {
      monthValue,
      habits,
      elapsed,
      completed,
      possible,
      rate: possible
        ? Math.round(completed / possible * 100)
        : 0,
      bestDay,
      rows
    };
  }

  function makeBackup() {
    const data = {};

    KEYS.forEach(key => {
      const raw = localStorage.getItem(key);
      if (raw !== null) data[key] = JSON.parse(raw);
    });

    return {
      app: 'ManthanBites',
      type: 'wellness-dashboard-backup',
      version: 1,
      createdAt: new Date().toISOString(),
      data
    };
  }

  function validBackup(backup) {
    if (
      !backup ||
      backup.app !== 'ManthanBites' ||
      backup.type !== 'wellness-dashboard-backup' ||
      backup.version !== 1 ||
      !backup.data ||
      typeof backup.data !== 'object' ||
      Array.isArray(backup.data)
    ) return false;

    const keys = Object.keys(backup.data);

    if (!keys.length || keys.some(key => !KEYS.includes(key))) {
      return false;
    }

    if (Object.prototype.hasOwnProperty.call(
      backup.data, 'mb_tracker'
    )) {
      const t = backup.data.mb_tracker;

      if (
        !t ||
        !Array.isArray(t.h) ||
        !t.l ||
        typeof t.l !== 'object' ||
        Array.isArray(t.l)
      ) return false;

      if (
        !t.h.every(h => typeof h === 'string') ||
        !Object.values(t.l).every(Array.isArray)
      ) return false;
    }

    if (Object.prototype.hasOwnProperty.call(
      backup.data, 'mb_dashboard_goals_v1'
    ) && !Array.isArray(backup.data.mb_dashboard_goals_v1)) {
      return false;
    }

    if (Object.prototype.hasOwnProperty.call(
      backup.data, 'mb_challenge'
    )) {
      const c = backup.data.mb_challenge;

      if (
        !Array.isArray(c) &&
        !(c && typeof c === 'object' &&
          (Array.isArray(c.completed) || Array.isArray(c.days)))
      ) return false;
    }

    return true;
  }

  function createInterface() {
    const main = document.querySelector('.dashboard-main');
    if (!main || $('mb-data-management')) return;

    const section = document.createElement('section');
    section.id = 'mb-data-management';
    section.className = 'card mb-data-panel';

    section.innerHTML = `
      <div class="dash-heading">
        <div>
          <p class="eyebrow">PHASE 5 · DATA MANAGEMENT</p>
          <h2>Reports & Data Safety</h2>
        </div>
        <span class="dash-period">Your private data</span>
      </div>

      <div class="mb-data-grid">
        <div class="mb-data-card">
          <h3>📊 Monthly Report</h3>
          <p>Selected month ki progress aur previous month se comparison dekhein.</p>
          <label>
            Select month
            <input type="month" id="mb-report-month">
          </label>
          <div class="mb-month-results" aria-live="polite">
            <div><strong id="mb-month-rate">—</strong><span>Completion</span></div>
            <div><strong id="mb-month-checkins">—</strong><span>Check-ins</span></div>
            <div><strong id="mb-month-change">—</strong><span>vs previous month</span></div>
          </div>
          <p class="mb-report-note" id="mb-month-message"></p>
          <button class="button" type="button" id="mb-month-export">
            Download Monthly CSV
          </button>
        </div>

        <div class="mb-data-card">
          <h3>💾 Backup Your Data</h3>
          <p>Apni Habits, Completion History, Goals aur Challenge ka JSON Backup download karein.</p>
          <button class="button" type="button" id="mb-backup">
            Download JSON Backup
          </button>
          <p class="mb-report-note">Backup file ko apne computer ya secure drive mein rakhein.</p>
        </div>

        <div class="mb-data-card">
          <h3>♻️ Restore Data</h3>
          <p>ManthanBites ka pehle download kiya hua JSON Backup select karein.</p>
          <label>
            Select backup file
            <input type="file" id="mb-restore-file" accept=".json,application/json">
          </label>
          <button class="button button-secondary" type="button" id="mb-restore">
            Validate & Restore
          </button>
          <p class="mb-report-note" id="mb-restore-status" aria-live="polite">
            Restore se pehle current data ka emergency backup download hoga.
          </p>
        </div>
      </div>
    `;

    const note = main.querySelector('.note');
    if (note) {
      main.insertBefore(section, note);
    } else {
      main.appendChild(section);
    }

    const style = document.createElement('style');
    style.id = 'mb-data-management-style';
    style.textContent = `
      .mb-data-panel{margin:26px 0;padding:24px}
      .mb-data-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
      .mb-data-card{background:#f7f9f6;border:1px solid #e5ece5;border-radius:15px;padding:17px;display:flex;flex-direction:column;gap:12px;min-width:0}
      .mb-data-card h3{margin:0;color:var(--forest);font-size:1rem}
      .mb-data-card p{font-size:.82rem;line-height:1.55;color:var(--muted);margin:0}
      .mb-data-card label{display:grid;gap:6px;font-size:.8rem;font-weight:700;color:var(--forest)}
      .mb-data-card input{max-width:100%;min-width:0;border:1px solid var(--line);border-radius:9px;padding:10px;background:#fff;font:inherit}
      .mb-data-card button{margin-top:auto;cursor:pointer}
      .mb-month-results{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
      .mb-month-results div{background:#fff;border-radius:10px;padding:10px;min-width:0}
      .mb-month-results strong{display:block;font-size:1.1rem;color:var(--forest);overflow-wrap:anywhere}
      .mb-month-results span{font-size:.68rem;color:var(--muted)}
      .mb-report-note{font-size:.75rem!important}
      @media(max-width:760px){.mb-data-grid{grid-template-columns:1fr}.mb-data-panel{padding:17px}}
    `;
    document.head.appendChild(style);

    const now = new Date();
    $('mb-report-month').value =
      now.getFullYear() + '-' + pad(now.getMonth() + 1);

    $('mb-report-month').addEventListener('change', renderMonth);
    $('mb-month-export').addEventListener('click', exportMonth);
    $('mb-backup').addEventListener('click', exportBackup);
    $('mb-restore').addEventListener('click', restoreBackup);

    renderMonth();
  }

  function renderMonth() {
    const value = $('mb-report-month').value;
    if (!/^\d{4}-\d{2}$/.test(value)) return;

    const current = getMonthReport(value);

    const [year, month] = value.split('-').map(Number);
    const previousDate = new Date(year, month - 2, 1, 12);
    const previousValue =
      previousDate.getFullYear() + '-' +
      pad(previousDate.getMonth() + 1);

    const previous = getMonthReport(previousValue);

    const difference = current.rate - previous.rate;

    $('mb-month-rate').textContent = current.rate + '%';
    $('mb-month-checkins').textContent = current.completed;

    $('mb-month-change').textContent =
      current.possible && previous.possible
        ? (difference > 0 ? '+' : '') + difference + ' pp'
        : '—';

    $('mb-month-message').textContent =
      current.habits.length
        ? current.elapsed + ' elapsed days · ' +
          current.habits.length + ' active habits. ' +
          (previous.possible
            ? 'Previous month completion: ' + previous.rate + '%.'
            : 'Previous month data unavailable.')
        : 'Habit Tracker mein active habits nahi mili.';

  }

  function exportMonth() {
    const value = $('mb-report-month').value;
    if (!/^\d{4}-\d{2}$/.test(value)) return;

    const report = getMonthReport(value);
    const rows = [
      ['Date', 'Habit', 'Completed'],
      ...report.rows
    ];

    const csv = rows.map(row =>
      row.map(csvEscape).join(',')
    ).join('\r\n');

    download(
      'manthanbites-monthly-report-' + value + '.csv',
      '\ufeff' + csv,
      'text/csv;charset=utf-8'
    );
  }

  function exportBackup() {
    try {
      const backup = makeBackup();

      download(
        'manthanbites-backup-' +
          new Date().toISOString().slice(0, 10) + '.json',
        JSON.stringify(backup, null, 2),
        'application/json'
      );

      $('mb-restore-status').textContent =
        'JSON Backup download request complete.';
    } catch (error) {
      alert('Backup nahi ban paaya. Browser storage check karein.');
      console.error(error);
    }
  }

  async function restoreBackup() {
    const file = $('mb-restore-file').files[0];

    if (!file) {
      alert('Pehle JSON Backup file select karein.');
      return;
    }

    let backup;

    try {
      backup = JSON.parse(await file.text());
    } catch (_) {
      alert('JSON file read nahi ho paayi. Valid backup select karein.');
      return;
    }

    if (!validBackup(backup)) {
      alert('Backup format valid nahi hai. Data restore nahi hua.');
      return;
    }

    const confirmed = confirm(
      'Kya aap restore karna chahte hain?\n\n' +
      'Selected backup ke available data keys current data ko replace karenge. ' +
      'Restore se pehle emergency backup download hoga.'
    );

    if (!confirmed) return;

    // Keep the current data in memory for rollback.
    const previous = {};
    KEYS.forEach(key => {
      previous[key] = localStorage.getItem(key);
    });

    try {
      // Emergency backup of current data before restoring.
      exportBackup();

      Object.keys(backup.data).forEach(key => {
        localStorage.setItem(
          key,
          JSON.stringify(backup.data[key])
        );
      });

      $('mb-restore-status').textContent =
        'Restore successful. Page reload ho raha hai.';

      setTimeout(() => window.location.reload(), 700);

    } catch (error) {
      // Roll back if any write fails.
      KEYS.forEach(key => {
        try {
          if (previous[key] === null) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, previous[key]);
          }
        } catch (_) {}
      });

      alert('Restore fail hua. Current data ko rollback karne ki koshish ki gayi hai.');
      console.error(error);
    }
  }

  function init() {
    if (!document.querySelector('.dashboard-main')) return;
    createInterface();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
