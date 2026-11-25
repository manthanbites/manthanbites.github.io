/* ManthanBites Phase 2 tools — vanilla JS, backward-compatible localStorage keys */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const safeParse = (raw, fallback) => { try { return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; } };
  const shareText = async (text) => {
    if (navigator.share) { try { await navigator.share({ title: 'ManthanBites', text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    if (navigator.clipboard && navigator.clipboard.writeText) { try { await navigator.clipboard.writeText(text); alert('Result copy ho gaya. Aap ise share kar sakte hain.'); return; } catch (_) {} }
    window.prompt('Is result ko copy karein:', text);
  };

  // BMI Calculator
  if ($('go') && $('h') && $('w')) {
    const height = $('h'), weight = $('w'), out = $('out');
    const calculate = () => {
      const cm = Number(height.value), kg = Number(weight.value);
      if (!Number.isFinite(cm) || !Number.isFinite(kg) || cm < 100 || cm > 230 || kg < 20 || kg > 250) {
        alert('Kripya height 100–230 cm aur weight 20–250 kg ke beech sahi value mein daalein.');
        (cm < 100 || cm > 230 || !Number.isFinite(cm) ? height : weight).focus(); return;
      }
      const bmi = kg / Math.pow(cm / 100, 2); let category, message;
      if (bmi < 18.5) { category = 'Underweight range'; message = 'BMI is range mein hai. Apne meals, nutrition aur weight history par dhyan dein. Bina wajah weight kam ho raha ho to healthcare professional se baat karein.'; }
      else if (bmi < 23) { category = 'Healthy range'; message = 'Aapka BMI Asian-Indian reference range mein hai. Balanced eating, movement aur sleep habits jaari rakhein.'; }
      else if (bmi < 25) { category = 'Overweight range'; message = 'BMI is reference range mein hai. Crash diet ke bajay sustainable habits par dhyan dein. Waist measurement aur overall health bhi maayne rakhte hain.'; }
      else { category = 'Higher BMI range'; message = 'BMI is range mein hai. Personal assessment ke liye doctor ya registered dietitian se salah lein. BMI akela diagnosis nahi hai.'; }
      $('v').textContent = bmi.toFixed(1); $('cat').textContent = category; $('msg').textContent = message;
      out.dataset.result = 'BMI: ' + bmi.toFixed(1) + ' | Category: ' + category;
      out.classList.remove('hide'); out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    $('go').addEventListener('click', calculate);
    [height, weight].forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') calculate(); }));
    if ($('reset-bmi')) $('reset-bmi').addEventListener('click', () => { height.value = ''; weight.value = ''; out.classList.add('hide'); height.focus(); });
    if ($('share-bmi')) $('share-bmi').addEventListener('click', () => shareText('Mera ManthanBites BMI result: ' + (out.dataset.result || '') + '. Yeh educational estimate hai, diagnosis nahi.'));
  }

  // Mindful Eating Quiz: stores answers so users can go back and edit.
  if ($('q') && $('res')) {
    const questions = [
      ['Khana khate waqt phone ya TV chalta hai?', ['Aksar','Kabhi kabhi','Lagbhag kabhi nahi']],
      ['Khane ki speed kaisi hoti hai?', ['Bahut tez','Medium','Dheere aur chabakar']],
      ['Khana shuru karne se pehle bhookh check karte hain?', ['Nahi','Kabhi kabhi','Haan, aksar']],
      ['Pet bhar jaane par rukte hain?', ['Plate khatam karni hoti hai','Kabhi kabhi','Haan, fullness sunte hain']],
      ['Stress ya boredom mein khana khate hain?', ['Aksar','Kabhi kabhi','Bahut kam']],
      ['Khana khane se pehle uski khushboo aur swaad par dhyan dete hain?', ['Nahi','Kabhi kabhi','Haan']],
      ['Din ke meals ka time kaisa rehta hai?', ['Bilkul irregular','Thoda irregular','Kaafi regular']],
      ['Khane ke baad khud ko guilty feel karte hain?', ['Aksar','Kabhi kabhi','Lagbhag nahi']]
    ];
    let index = 0; const answers = new Array(questions.length).fill(null); const q = $('q'), result = $('res');
    function finish() {
      const score = answers.reduce((sum, value) => sum + value, 0); let title, message;
      if (score <= 5) { title = 'Shuruaat ka stage'; message = 'Ek chhoti aadat se shuru karein: meal ke dauraan phone door rakhein aur khane par dhyan dein.'; }
      else if (score <= 11) { title = 'Raste par hain'; message = 'Aap kuch mindful habits apna rahe hain. Dheere chabana aur fullness cues ko notice karna jaari rakhein.'; }
      else { title = 'Mindful habits ki achhi practice'; message = 'Aapke answers mein kai mindful habits nazar aati hain. Inhe bina pressure ke jaari rakhein.'; }
      q.classList.add('hide'); result.textContent = '';
      const scoreEl = document.createElement('div'); scoreEl.className = 'big'; scoreEl.textContent = score + ' / 16';
      const h = document.createElement('h2'); h.textContent = title;
      const p = document.createElement('p'); p.textContent = message;
      const note = document.createElement('p'); note.className = 'note'; note.textContent = 'Yeh self-reflection quiz hai, validated clinical test ya diagnosis nahi.';
      const actions = document.createElement('div'); actions.className = 'tool-actions';
      const share = document.createElement('button'); share.type = 'button'; share.textContent = 'Result share karein'; share.addEventListener('click', () => shareText('Mera ManthanBites Mindful Eating Quiz score: ' + score + '/16 — ' + title + '. Yeh self-reflection quiz hai, diagnosis nahi.'));
      const again = document.createElement('button'); again.type = 'button'; again.className = 'alt'; again.textContent = 'Quiz dobara karein'; again.addEventListener('click', () => { index = 0; answers.fill(null); result.classList.add('hide'); q.classList.remove('hide'); render(); });
      const challenge = document.createElement('a'); challenge.className = 'button button-primary'; challenge.href = '7-day-healthy-habits-challenge.html'; challenge.textContent = '7-day challenge';
      actions.append(share, again, challenge); result.append(scoreEl, h, p, note, actions); result.classList.remove('hide');
    }
    function render() {
      q.textContent = ''; const bar = document.createElement('div'); bar.className = 'bar'; const fill = document.createElement('i'); fill.style.width = ((index / questions.length) * 100) + '%'; bar.appendChild(fill); q.appendChild(bar);
      const heading = document.createElement('h2'); heading.textContent = (index + 1) + '/' + questions.length + '. ' + questions[index][0]; q.appendChild(heading);
      questions[index][1].forEach((label, value) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'opt' + (answers[index] === value ? ' selected' : ''); button.textContent = label; button.setAttribute('aria-pressed', String(answers[index] === value)); button.addEventListener('click', () => { answers[index] = value; if (index < questions.length - 1) { index++; render(); } else finish(); }); q.appendChild(button); });
      if (index > 0) { const back = document.createElement('button'); back.type = 'button'; back.className = 'alt'; back.textContent = '← Pichhla sawaal'; back.addEventListener('click', () => { index--; render(); }); q.appendChild(back); }
      const progress = document.createElement('p'); progress.className = 'note'; progress.textContent = 'Progress: ' + (index + 1) + ' of ' + questions.length + ' questions'; q.appendChild(progress);
    }
    render();
  }

  // Habit tracker: retain the existing mb_tracker schema and key.
  if ($('t') && $('add') && $('n')) {
    const KEY = 'mb_tracker';
    let state = safeParse(localStorage.getItem(KEY), null);
    if (!state || !Array.isArray(state.h) || typeof state.l !== 'object' || !state.l) state = { h: ['Dheere chabakar khana','Paani (8 glass)','10 min walk','Phone-free meal'], l: {} };
    state.h = state.h.slice(0, 12);
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { alert('Browser storage full ya unavailable hai. CSV export karke backup rakhein.'); } };
    const dateKey = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    const days = []; for (let n=6; n>=0; n--) { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-n); days.push(d); }
    const isDone = (date, habit) => Array.isArray(state.l[dateKey(date)]) && state.l[dateKey(date)].includes(habit);
    const streak = habit => { let count=0, d=new Date(); d.setHours(12,0,0,0); if (!isDone(d,habit)) d.setDate(d.getDate()-1); while (isDone(d,habit) && count<366) { count++; d.setDate(d.getDate()-1); } return count; };
    const cell = (tag, text, cls) => { const el=document.createElement(tag); el.textContent=text; if(cls)el.className=cls; return el; };
    function render() {
      const table=$('t'); table.textContent=''; const head=cell('tr',''); head.appendChild(cell('th','Habit')); days.forEach(d=>head.appendChild(cell('th',['Ravi','Som','Mang','Budh','Guru','Shukr','Shani'][d.getDay()]))); head.appendChild(cell('th','Streak')); head.appendChild(cell('th','Action')); table.appendChild(head);
      state.h.forEach(habit=>{ const tr=cell('tr',''); tr.appendChild(cell('td',habit)); days.forEach(day=>{ const td=cell('td',''); const done=isDone(day,habit); const b=cell('button',done?'✓':'○','cell'+(done?' on':'')); b.type='button'; b.setAttribute('aria-label',habit+' '+dateKey(day)+' '+(done?'complete':'incomplete')); b.setAttribute('aria-pressed',String(done)); b.addEventListener('click',()=>{const key=dateKey(day); const list=Array.isArray(state.l[key])?state.l[key]:[]; const at=list.indexOf(habit); if(at>=0)list.splice(at,1);else list.push(habit);state.l[key]=list;save();render();}); td.appendChild(b);tr.appendChild(td);}); tr.appendChild(cell('td',streak(habit)+' din')); const action=cell('td',''); const del=cell('button','Delete','mini-delete');del.type='button';del.setAttribute('aria-label',habit+' delete karein');del.addEventListener('click',()=>{if(!confirm('“'+habit+'” habit aur iski saved entries delete karein?'))return;state.h=state.h.filter(x=>x!==habit);Object.keys(state.l).forEach(k=>{state.l[k]=(state.l[k]||[]).filter(x=>x!==habit);});save();render();});action.appendChild(del);tr.appendChild(action);table.appendChild(tr); });
      const total=state.h.length*7; let completed=0; state.h.forEach(h=>days.forEach(d=>{if(isDone(d,h))completed++;})); $('tracker-summary').textContent='Pichhle 7 din: '+completed+' / '+total+' habit check-ins complete ('+(total?Math.round(completed/total*100):0)+'%). Total habits: '+state.h.length+'.';
    }
    $('add').addEventListener('click',()=>{const value=$('n').value.trim();if(!value){alert('Pehle habit ka naam likhein.');$('n').focus();return;}if(state.h.includes(value)){alert('Yeh habit pehle se maujood hai.');return;}if(state.h.length>=12){alert('Aap maximum 12 habits add kar sakte hain.');return;}state.h.push(value);$('n').value='';save();render();});
    $('n').addEventListener('keydown',e=>{if(e.key==='Enter')$('add').click();});
    if($('export-tracker'))$('export-tracker').addEventListener('click',()=>{const rows=[['Date','Habit','Completed']];days.forEach(d=>state.h.forEach(h=>rows.push([dateKey(d),h,isDone(d,h)?'Yes':'No'])));const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='manthanbites-habit-progress.csv';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);});
    render();
  }

  // Sequential 7-day challenge, preserving mb_challenge data (array of booleans).
  if ($('days') && $('rs') && $('pb')) {
    const KEY='mb_challenge';
    const activities=[['Dheere chabakar khana','Aaj ke ek meal mein aaram se chabayein. Har niwale ke liye koi fixed number zaroori nahi.'],['Paani ki aadat','Pyaas aur apni zaroorat ke hisaab se din bhar paani peete rahein.'],['Phone-free meal','Aaj ek meal phone aur TV ke bina khayein. Bas khane par dhyan dein.'],['Plate ka balance','Apni plate mein sabzi/fal, anaaj aur protein ke alag-alag sources shamil karne ki koshish karein.'],['10 minute walk','Agar aapke liye safe aur comfortable ho, to khane ke baad 10 minute halka chalein.'],['Bhookh aur fullness','Khane se pehle aur beech mein apni bhookh aur fullness ko notice karein.'],['Neend aur reflection','Aaj apni sleep routine par dhyan dein. Pichhle 6 din ki ek helpful habit yaad karein.']];
    let completed=safeParse(localStorage.getItem(KEY),[]); if(!Array.isArray(completed))completed=[]; completed=activities.map((_,i)=>completed[i]===true);
    const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(completed));}catch(_){alert('Browser storage mein save nahi ho paaya.');}};
    function render(){const wrap=$('days');wrap.textContent='';let firstOpen=completed.indexOf(false);if(firstOpen<0)firstOpen=activities.length;
      activities.forEach((item,i)=>{const unlocked=i===0||completed.slice(0,i).every(Boolean);const card=document.createElement('section');card.className='card day'+(completed[i]?' done':'');const tag=document.createElement('div');tag.className='tag';tag.textContent='DAY '+(i+1)+(unlocked?'':' · LOCKED');const h=document.createElement('h3');h.textContent=item[0];const p=document.createElement('p');p.textContent=item[1];const b=document.createElement('button');b.type='button';b.textContent=completed[i]?'Complete ✓ — undo':'Maine kar liya';if(!completed[i])b.className='alt';b.disabled=!unlocked;b.setAttribute('aria-label','Day '+(i+1)+' '+(unlocked?'available':'locked'));b.addEventListener('click',()=>{completed[i]=!completed[i];for(let j=i+1;j<completed.length;j++)if(!completed[i])completed[j]=false;save();render();});card.append(tag,h,p,b);wrap.appendChild(card);});
      const count=completed.filter(Boolean).length;$('pb').style.width=(count/7*100)+'%';$('pt').textContent=count===7?'Badhai ho! Aapne 7 din poore kiye.':count+' / 7 din poore';$('challenge-next').textContent=count===7?'Challenge complete. Apni pasand ki habits ko Habit Tracker mein continue karein.':'Agla unlocked step: Day '+(firstOpen+1)+'. Pehle wale din ko dobara uncheck karne par aage ke din reset ho jayenge.';
    }
    $('rs').addEventListener('click',()=>{if(confirm('Saari 7-day challenge progress reset ho jayegi. Kya aap sure hain?')){completed=activities.map(()=>false);save();render();}});render();
  }
})();
