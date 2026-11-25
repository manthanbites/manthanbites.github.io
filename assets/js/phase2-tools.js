
/* =====================================================
   MANTHANBITES - PHASE 4 AUDIENCE ENGAGEMENT
   Improved Version 2.0
   Existing storage keys preserved:
   mb_tracker
   mb_challenge
===================================================== */

(function () {
  'use strict';

  // Prevent duplicate initialization
  if (window.__manthanPhase4Loaded) return;
  window.__manthanPhase4Loaded = true;

  const $ = id => document.getElementById(id);

  const safeParse = (raw, fallback) => {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn('ManthanBites: Invalid saved data', error);
      return fallback;
    }
  };

  const saveData = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      alert('Data save nahi ho paaya. Browser storage check karein.');
      return false;
    }
  };

  const createElement = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };

  const dateKey = date => {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  };

  const today = () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  };

  const shareText = async text => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ManthanBites',
          text
        });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      alert('Result copied successfully!');
    } catch (error) {
      window.prompt('Copy your result:', text);
    }
  };

  const addButton = (parent, label, callback, className) => {
    const button = createElement('button', label, className);
    button.type = 'button';
    button.addEventListener('click', callback);
    parent.appendChild(button);
    return button;
  };

  // =====================================================
  // 1. BMI CALCULATOR
  // =====================================================

  function initBMI() {
    const height = $('h');
    const weight = $('w');
    const calculateButton = $('go');

    if (!height || !weight || !calculateButton) return;

    let output = $('out');

    if (!output) {
      output = createElement('div', '', 'bmi-result');
      output.id = 'out';
      output.hidden = true;
      calculateButton.insertAdjacentElement('afterend', output);
    }

    let lastResult = '';

    function calculate() {
      const cm = Number(height.value);
      const kg = Number(weight.value);

      if (
        !height.value.trim() ||
        !weight.value.trim() ||
        !Number.isFinite(cm) ||
        !Number.isFinite(kg) ||
        cm < 100 || cm > 230 ||
        kg < 20 || kg > 250
      ) {
        alert(
          'Height 100–230 cm aur weight 20–250 kg ke beech enter karein.'
        );
        return;
      }

      const bmi = kg / Math.pow(cm / 100, 2);

      let category;
      let message;

      if (bmi < 18.5) {
        category = 'Underweight range';
        message =
          'Apne nutrition aur weight history par dhyan dein. Zaroorat par healthcare professional se salah lein.';
      } else if (bmi < 23) {
        category = 'Healthy BMI range';
        message =
          'Aapka BMI Asian Indian reference range mein hai. Balanced diet aur healthy lifestyle maintain karein.';
      } else if (bmi < 25) {
        category = 'Increased risk range';
        message =
          'Sustainable eating habits aur regular physical activity par dhyan dein.';
      } else {
        category = 'Higher BMI range';
        message =
          'Personal health assessment ke liye doctor ya registered dietitian se salah lein.';
      }

      const heightM = cm / 100;

      const minWeight = 18.5 * heightM * heightM;
      const maxWeight = 22.9 * heightM * heightM;

      const heading = createElement('h2', 'Your BMI Result');
      const score = createElement('div', bmi.toFixed(1), 'big');
      const categoryEl = createElement('h3', category);
      const guidance = createElement('p', message);

      const range = createElement(
        'p',
        'Estimated healthy BMI weight range: ' +
        minWeight.toFixed(1) + '–' +
        maxWeight.toFixed(1) + ' kg'
      );

      const note = createElement(
        'p',
        'BMI is a screening indicator, not a medical diagnosis.',
        'note'
      );

      output.replaceChildren(
        heading,
        score,
        categoryEl,
        guidance,
        range,
        note
      );

      lastResult =
        'BMI: ' + bmi.toFixed(1) +
        ' | Category: ' + category +
        ' | Height: ' + cm + ' cm' +
        ' | Weight: ' + kg + ' kg';

      output.hidden = false;
      output.classList.remove('hide');

      output.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }

    calculateButton.addEventListener('click', calculate);

    [height, weight].forEach(input => {
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') calculate();
      });
    });

    const reset = $('reset-bmi');

    if (reset) {
      reset.addEventListener('click', () => {
        height.value = '';
        weight.value = '';
        output.hidden = true;
        output.classList.add('hide');
        lastResult = '';
        height.focus();
      });
    }

    const share = $('share-bmi');

    if (share) {
      share.addEventListener('click', () => {
        if (!lastResult) {
          alert('Pehle BMI calculate karein.');
          return;
        }

        shareText(
          'My ManthanBites BMI Result\n' +
          lastResult +
          '\nBMI is a screening indicator, not a diagnosis.'
        );
      });
    }

    // Add missing reset and share controls
    const parent = calculateButton.parentElement;

    if (parent && !reset && !share) {
      const actions = createElement('div', '', 'tool-actions');

      addButton(actions, 'Reset', () => {
        height.value = '';
        weight.value = '';
        output.hidden = true;
        lastResult = '';
      }, 'alt');

      addButton(actions, 'Share Result', () => {
        if (lastResult) shareText(lastResult);
        else alert('Pehle BMI calculate karein.');
      });

      output.insertAdjacentElement('afterend', actions);
    }
  }

  // =====================================================
  // 2. MINDFUL EATING QUIZ
  // =====================================================

  function initQuiz() {
    const container = $('q');
    const result = $('res');

    if (!container || !result) return;

    const questions = [
      {
        question: 'Khana khate waqt phone ya TV dekhte hain?',
        options: ['Aksar', 'Kabhi kabhi', 'Lagbhag kabhi nahi']
      },
      {
        question: 'Aap khana kitni speed se khate hain?',
        options: ['Bahut tez', 'Normal speed', 'Dheere aur dhyan se']
      },
      {
        question: 'Khana shuru karne se pehle bhookh check karte hain?',
        options: ['Nahi', 'Kabhi kabhi', 'Haan, aksar']
      },
      {
        question: 'Pet bharne ka signal milne par rukte hain?',
        options: ['Nahi', 'Kabhi kabhi', 'Haan']
      },
      {
        question: 'Stress ya boredom mein khana khate hain?',
        options: ['Aksar', 'Kabhi kabhi', 'Bahut kam']
      },
      {
        question: 'Khana khate waqt taste aur texture notice karte hain?',
        options: ['Nahi', 'Kabhi kabhi', 'Haan']
      },
      {
        question: 'Aapke meals ka time regular rehta hai?',
        options: ['Bilkul irregular', 'Thoda irregular', 'Kaafi regular']
      },
      {
        question: 'Khana khane ke baad guilt feel hota hai?',
        options: ['Aksar', 'Kabhi kabhi', 'Lagbhag nahi']
      },
      {
        question: 'Kya aap meal ke dauran pause lete hain?',
        options: ['Kabhi nahi', 'Kabhi kabhi', 'Haan']
      },
      {
        question: 'Kya aap hunger aur fullness signals samajhte hain?',
        options: ['Nahi', 'Kabhi kabhi', 'Haan, aksar']
      }
    ];

    let current = 0;
    let answers = new Array(questions.length).fill(null);

    // All questions use consistently ordered answers:
    // 0 = less mindful, 1 = sometimes, 2 = more mindful

    function getScore() {
      return answers.reduce((total, value) => {
        return total + value;
      }, 0);
    }

    function finish() {
      const score = getScore();

      let title;
      let message;

      if (score <= 7) {
        title = 'Mindful Eating Ki Shuruaat';
        message =
          'Ek chhoti aadat se shuru karein. Meal ke waqt phone door rakhein aur dheere khayein.';
      } else if (score <= 14) {
        title = 'Aap Progress Kar Rahe Hain';
        message =
          'Aapki kuch mindful eating habits achhi hain. Hunger aur fullness signals par aur dhyan dein.';
      } else {
        title = 'Achhi Mindful Eating Practice';
        message =
          'Aapke answers mein kai positive habits nazar aati hain. Inhe continue rakhein.';
      }

      container.hidden = true;
      container.classList.add('hide');

      result.replaceChildren();

      result.append(
        createElement('div', score + ' / 20', 'big'),
        createElement('h2', title),
        createElement('p', message),
        createElement(
          'p',
          'Yeh self-reflection quiz hai, medical diagnosis nahi.',
          'note'
        )
      );

      const actions = createElement('div', '', 'tool-actions');

      addButton(actions, 'Share Result', () => {
        shareText(
          'My Mindful Eating Quiz Score: ' +
          score + '/20\n' + title +
          '\nManthanBites'
        );
      });

      addButton(actions, 'Restart Quiz', () => {
        current = 0;
        answers.fill(null);
        result.hidden = true;
        result.classList.add('hide');
        container.hidden = false;
        container.classList.remove('hide');
        render();
      }, 'alt');

      const challenge = createElement(
        'a',
        '7-Day Healthy Habits Challenge',
        'button button-primary'
      );

      challenge.href = '7-day-healthy-habits-challenge.html';

      actions.appendChild(challenge);
      result.appendChild(actions);

      result.hidden = false;
      result.classList.remove('hide');
    }

    function render() {
      container.replaceChildren();

      const progress = createElement('div', '', 'bar');
      const fill = createElement('i', '');

      fill.style.width =
        ((current + 1) / questions.length * 100) + '%';

      fill.style.display = 'block';
      progress.appendChild(fill);

      const status = createElement(
        'p',
        'Question ' + (current + 1) +
        ' of ' + questions.length,
        'note'
      );

      const heading = createElement(
        'h2',
        questions[current].question
      );

      container.append(progress, status, heading);

      questions[current].options.forEach((option, value) => {
        const button = createElement(
          'button',
          option,
          'opt' + (answers[current] === value ? ' selected' : '')
        );

        button.type = 'button';
        button.setAttribute(
          'aria-pressed',
          String(answers[current] === value)
        );

        button.addEventListener('click', () => {
          answers[current] = value;

          if (current < questions.length - 1) {
            current++;
            render();
          } else {
            finish();
          }
        });

        container.appendChild(button);
      });

      const navigation = createElement('div', '', 'tool-actions');

      if (current > 0) {
        addButton(navigation, '← Previous', () => {
          current--;
          render();
        }, 'alt');
      }

      if (answers[current] !== null) {
        addButton(navigation, 'Next →', () => {
          if (current < questions.length - 1) {
            current++;
            render();
          } else {
            finish();
          }
        });
      }

      container.appendChild(navigation);
    }

    result.hidden = true;
    render();
  }

  // =====================================================
  // 3. DAILY HABIT TRACKER
  // =====================================================

  function initHabitTracker() {
    const table = $('t');
    const add = $('add');
    const input = $('n');

    if (!table || !add || !input) return;

    const KEY = 'mb_tracker';

    const originalRaw = localStorage.getItem(KEY);
    let state = safeParse(originalRaw, null);

    if (
      !state ||
      typeof state !== 'object' ||
      !Array.isArray(state.h) ||
      !state.l ||
      typeof state.l !== 'object' ||
      Array.isArray(state.l)
    ) {
      // Keep an untouched copy before initializing a new structure.
      if (originalRaw) {
        try {
          localStorage.setItem(
            'mb_tracker_backup_phase4',
            originalRaw
          );
        } catch (_) {}
      }

      state = {
        h: [
          'Dheere chabakar khana',
          'Paani peena',
          '10 min walk',
          'Phone-free meal'
        ],
        l: {}
      };
    }

    // Keep existing valid habits and historical logs.
    state.h = [...new Set(
      state.h.filter(x => typeof x === 'string' && x.trim())
    )].slice(0, 12);

    Object.keys(state.l).forEach(key => {
      if (!Array.isArray(state.l[key])) {
        state.l[key] = [];
      }
    });

    const save = () => saveData(KEY, state);

    function isDone(date, habit) {
      const list = state.l[dateKey(date)];
      return Array.isArray(list) && list.includes(habit);
    }

    function getStreak(habit) {
      let count = 0;
      const date = today();

      if (!isDone(date, habit)) {
        date.setDate(date.getDate() - 1);
      }

      while (isDone(date, habit) && count < 366) {
        count++;
        date.setDate(date.getDate() - 1);
      }

      return count;
    }

    function getSummary() {
      const now = today();

      const weekDays = [];

      for (let i = 6; i >= 0; i--) {
        const d = today();
        d.setDate(d.getDate() - i);
        weekDays.push(d);
      }

      let weeklyDone = 0;

      state.h.forEach(habit => {
        weekDays.forEach(day => {
          if (isDone(day, habit)) weeklyDone++;
        });
      });

      const weeklyTotal = state.h.length * 7;

      let monthlyDone = 0;

      state.h.forEach(habit => {
        for (let day = 1; day <= now.getDate(); day++) {
          const d = new Date(
            now.getFullYear(),
            now.getMonth(),
            day,
            12
          );

          if (isDone(d, habit)) monthlyDone++;
        }
      });

      const monthlyTotal = state.h.length * now.getDate();

      return {
        weeklyDone,
        weeklyTotal,
        weeklyPercent: weeklyTotal
          ? Math.round(weeklyDone / weeklyTotal * 100)
          : 0,

        monthlyDone,
        monthlyTotal,
        monthlyPercent: monthlyTotal
          ? Math.round(monthlyDone / monthlyTotal * 100)
          : 0
      };
    }

    function renderSummary() {
      let summary = $('tracker-summary');

      if (!summary) {
        summary = createElement('div', '', 'tracker-summary');
        summary.id = 'tracker-summary';
        table.insertAdjacentElement('afterend', summary);
      }

      const data = getSummary();

      summary.replaceChildren(
        createElement('h3', 'Your Progress'),
        createElement(
          'p',
          'Weekly Progress: ' + data.weeklyPercent + '% (' +
          data.weeklyDone + '/' + data.weeklyTotal + ')'
        ),
        createElement(
          'p',
          'Monthly Progress: ' + data.monthlyPercent + '% (' +
          data.monthlyDone + '/' + data.monthlyTotal + ')'
        ),
        createElement(
          'p',
          'Total Active Habits: ' + state.h.length
        )
      );
    }

    function render() {
      table.replaceChildren();

      const days = [];

      for (let i = 6; i >= 0; i--) {
        const d = today();
        d.setDate(d.getDate() - i);
        days.push(d);
      }

      const header = createElement('tr', '');

      header.appendChild(createElement('th', 'Habit'));

      const weekdays = [
        'Sun', 'Mon', 'Tue', 'Wed',
        'Thu', 'Fri', 'Sat'
      ];

      days.forEach(day => {
        header.appendChild(
          createElement('th', weekdays[day.getDay()])
        );
      });

      header.appendChild(createElement('th', 'Streak'));
      header.appendChild(createElement('th', 'Action'));

      table.appendChild(header);

      state.h.forEach(habit => {
        const row = createElement('tr', '');

        row.appendChild(createElement('td', habit));

        days.forEach(day => {
          const td = createElement('td', '');
          const done = isDone(day, habit);

          const button = createElement(
            'button',
            done ? '✓' : '○',
            'cell' + (done ? ' on' : '')
          );

          button.type = 'button';
          button.setAttribute('aria-pressed', String(done));
          button.setAttribute(
            'aria-label',
            habit + ' ' + dateKey(day)
          );

          button.addEventListener('click', () => {
            const key = dateKey(day);

            if (!Array.isArray(state.l[key])) {
              state.l[key] = [];
            }

            const index = state.l[key].indexOf(habit);

            if (index >= 0) {
              state.l[key].splice(index, 1);
            } else {
              state.l[key].push(habit);
            }

            save();
            render();
          });

          td.appendChild(button);
          row.appendChild(td);
        });

        row.appendChild(
          createElement('td', getStreak(habit) + ' days')
        );

        const actionCell = createElement('td', '');

        const deleteButton = createElement(
          'button',
          'Delete',
          'mini-delete'
        );

        deleteButton.type = 'button';

        deleteButton.addEventListener('click', () => {
          if (!confirm('Kya aap is habit ko delete karna chahte hain?')) {
            return;
          }

          // Historical logs are deliberately preserved.
          state.h = state.h.filter(item => item !== habit);

          save();
          render();
        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        table.appendChild(row);
      });

      renderSummary();
    }

    add.addEventListener('click', () => {
      const value = input.value.trim();

      if (!value) {
        alert('Habit ka naam enter karein.');
        return;
      }

      if (state.h.includes(value)) {
        alert('Yeh habit pehle se added hai.');
        return;
      }

      if (state.h.length >= 12) {
        alert('Maximum 12 habits add kar sakte hain.');
        return;
      }

      state.h.push(value);

      if (!save()) {
        state.h.pop();
        return;
      }

      input.value = '';
      render();
    });

    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') add.click();
    });

    // CSV Export
    let exportButton = $('export-tracker');

    if (!exportButton) {
      exportButton = createElement(
        'button',
        'Export CSV',
        'alt'
      );

      exportButton.id = 'export-tracker';
      table.insertAdjacentElement('afterend', exportButton);
    }

    if (!exportButton.dataset.phase4Bound) {
      exportButton.dataset.phase4Bound = 'true';

      exportButton.addEventListener('click', () => {
        const rows = [['Date', 'Habit', 'Completed']];

        Object.keys(state.l).sort().forEach(key => {
          state.l[key].forEach(habit => {
            rows.push([key, habit, 'Yes']);
          });
        });

        const csv = rows.map(row =>
          row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
          ).join(',')
        ).join('\r\n');

        const blob = new Blob(['\ufeff' + csv], {
          type: 'text/csv;charset=utf-8'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'manthanbites-habit-progress.csv';

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    }

    render();
  }

  // =====================================================
  // 4. 7-DAY HEALTHY HABITS CHALLENGE
  // =====================================================

  function initChallenge() {
    const wrapper = $('days');
    const resetButton = $('rs');
    const progressBar = $('pb');

    if (!wrapper || !resetButton || !progressBar) return;

    const KEY = 'mb_challenge';

    const activities = [
      {
        title: 'Dheere Chabakar Khana',
        description:
          'Aaj ek meal aaram se khayein aur food ke taste par dhyan dein.'
      },
      {
        title: 'Paani Ki Aadat',
        description:
          'Apni body ki zaroorat aur pyaas ke hisaab se paani piyein.'
      },
      {
        title: 'Phone-Free Meal',
        description:
          'Aaj ek meal bina phone aur TV ke enjoy karein.'
      },
      {
        title: 'Balanced Plate',
        description:
          'Apni plate mein vegetables, grains aur protein sources shamil karein.'
      },
      {
        title: '10 Minute Walk',
        description:
          'Agar comfortable ho to 10 minute halki walk karein.'
      },
      {
        title: 'Hunger & Fullness',
        description:
          'Meal se pehle aur baad apne hunger aur fullness signals notice karein.'
      },
      {
        title: 'Sleep & Reflection',
        description:
          'Apni sleep routine par dhyan dein aur pichhle 6 din ki progress review karein.'
      }
    ];

    const originalRaw = localStorage.getItem(KEY);
    const stored = safeParse(originalRaw, []);

    let completed;

    if (Array.isArray(stored)) {
      completed = activities.map((_, i) => stored[i] === true);
    } else if (stored && typeof stored === 'object') {
      // Support common older object-based formats.
      const oldDays = Array.isArray(stored.completed)
        ? stored.completed
        : Array.isArray(stored.days)
          ? stored.days
          : null;

      if (oldDays) {
        completed = activities.map((_, i) => oldDays[i] === true);
      } else {
        if (originalRaw) {
          try {
            localStorage.setItem(
              'mb_challenge_backup_phase4',
              originalRaw
            );
          } catch (_) {}
        }

        completed = activities.map(() => false);
      }
    } else {
      completed = activities.map(() => false);
    }

    const save = () => saveData(KEY, completed);

    let progressText = $('pt');

    if (!progressText) {
      progressText = createElement('p', '');
      progressText.id = 'pt';
      progressBar.insertAdjacentElement('afterend', progressText);
    }

    let nextText = $('challenge-next');

    if (!nextText) {
      nextText = createElement('p', '', 'note');
      nextText.id = 'challenge-next';
      progressText.insertAdjacentElement('afterend', nextText);
    }

    function showCertificate() {
      const popup = window.open('', '_blank');

      if (!popup) {
        alert('Certificate ke liye browser pop-ups allow karein.');
        return;
      }

      const documentContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>ManthanBites Certificate</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 30px;
              color: #173f35;
            }
            .certificate {
              border: 8px double #b8793e;
              padding: 45px 20px;
              max-width: 750px;
              margin: 30px auto;
            }
            h1 { font-size: 32px; }
            h2 { color: #b8793e; }
            p { line-height: 1.8; }
            button { padding: 12px 25px; cursor: pointer; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <h2>MANTHANBITES</h2>
            <h1>Certificate of Completion</h1>
            <p>This certificate recognizes successful completion of</p>
            <h2>7-Day Healthy Habits Challenge</h2>
            <p>Congratulations on completing seven days of healthy habit practice!</p>
            <p>Date: ${new Date().toLocaleDateString('en-IN')}</p>
            <p>Learn with curiosity. Live with balance.</p>
          </div>
          <button onclick="window.print()">Print / Save as PDF</button>
        </body>
        </html>
      `;

      popup.document.open();
      popup.document.write(documentContent);
      popup.document.close();
    }

    function render() {
      wrapper.replaceChildren();

      const completedCount = completed.filter(Boolean).length;

      const firstIncomplete = completed.indexOf(false);

      activities.forEach((activity, index) => {
        const unlocked =
          index === 0 ||
          completed.slice(0, index).every(Boolean);

        const card = createElement(
          'section',
          '',
          'card day' + (completed[index] ? ' done' : '')
        );

        const tag = createElement(
          'div',
          'DAY ' + (index + 1) +
          (unlocked ? '' : ' · LOCKED'),
          'tag'
        );

        const heading = createElement('h3', activity.title);
        const description = createElement('p', activity.description);

        const button = createElement(
          'button',
          completed[index] ? 'Completed ✓' : 'Mark as Complete'
        );

        button.type = 'button';
        button.disabled = !unlocked;

        button.addEventListener('click', () => {
          const old = completed.slice();

          completed[index] = !completed[index];

          if (!completed[index]) {
            for (let i = index + 1; i < completed.length; i++) {
              completed[i] = false;
            }
          }

          if (!save()) {
            completed = old;
          }

          render();
        });

        card.append(tag, heading, description, button);
        wrapper.appendChild(card);
      });

      const percent = Math.round(completedCount / 7 * 100);

      progressBar.style.width = percent + '%';
      progressBar.setAttribute('role', 'progressbar');
      progressBar.setAttribute('aria-valuenow', String(percent));
      progressBar.setAttribute('aria-valuemin', '0');
      progressBar.setAttribute('aria-valuemax', '100');

      progressText.textContent =
        completedCount + ' / 7 Days Completed (' + percent + '%)';

      nextText.textContent =
        completedCount === 7
          ? 'Congratulations! Aapka challenge complete ho gaya!'
          : 'Next unlocked step: Day ' + (firstIncomplete + 1);

      let certificateButton = $('challenge-certificate');

      if (completedCount === 7) {
        if (!certificateButton) {
          certificateButton = createElement(
            'button',
            'Print Completion Certificate'
          );

          certificateButton.id = 'challenge-certificate';
          certificateButton.addEventListener('click', showCertificate);

          nextText.insertAdjacentElement(
            'afterend',
            certificateButton
          );
        }
      } else if (certificateButton) {
        certificateButton.remove();
      }

      let shareButton = $('share-challenge');

      if (!shareButton) {
        shareButton = createElement(
          'button',
          'Share Challenge Progress',
          'alt'
        );

        shareButton.id = 'share-challenge';

        nextText.insertAdjacentElement(
          'afterend',
          shareButton
        );
      }

      if (!shareButton.dataset.phase4Bound) {
        shareButton.dataset.phase4Bound = 'true';

        shareButton.addEventListener('click', () => {
          const count = completed.filter(Boolean).length;

          shareText(
            'My ManthanBites 7-Day Healthy Habits Challenge progress: ' +
            count + '/7 days completed!'
          );
        });
      }
    }

    resetButton.addEventListener('click', () => {
      if (!confirm('Kya aap challenge progress reset karna chahte hain?')) {
        return;
      }

      const old = completed.slice();
      completed = activities.map(() => false);

      if (!save()) {
        completed = old;
      }

      render();
    });

    render();
  }

  // =====================================================
  // INITIALIZE ALL TOOLS
  // =====================================================

  function initialize() {
    initBMI();
    initQuiz();
    initHabitTracker();
    initChallenge();

    console.info(
      'ManthanBites Phase 4 initialized successfully.'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, {
      once: true
    });
  } else {
    initialize();
  }

})();
