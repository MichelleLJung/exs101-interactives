import { api, byId as el } from '../common.js';
import { advance, format, initial, jump, questions, readTimer, remaining, setTime, stages, timerKey, totalRemaining } from '../timing.js';

let secret = '';
let timer = readTimer() ?? initial();
let guide = {};
let session = { open: false };
let requestInFlight = false;
let audio;
let lastStage = -1;
let lastQuestion = -1;

function add(parent, tag, text = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  parent.append(node);
  return node;
}

function renderSession() {
  el('close').disabled = !session.open || requestInFlight;
  el('session-form').hidden = session.open;
  el('usage').replaceChildren();
  if (!session.open) {
    el('session-status').textContent = 'AI access is closed.';
    return;
  }
  el('session-status').textContent = 'Open until ' + new Date(session.expires).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) +
    '. Share each temporary code privately with its group.';
  const table = add(el('usage'), 'table');
  const head = add(add(table, 'thead'), 'tr');
  ['Group / client', 'Temporary code', 'Messages', 'Review', 'Recovery'].forEach(value => {
    add(head, 'th', value).scope = 'col';
  });
  const body = add(table, 'tbody');
  session.groups.forEach(group => {
    const row = add(body, 'tr');
    add(row, 'th', `${group.number} · ${group.client}`).scope = 'row';
    add(row, 'td', group.active ? 'Activated' : group.code);
    add(row, 'td', `${group.interviews} / ${session.allowance}`);
    add(row, 'td', `${group.reviews} / 1`);
    const rotate = add(add(row, 'td'), 'button', 'Replace code');
    rotate.className = 'secondary';
    rotate.setAttribute('aria-label', 'Replace code for group ' + group.number);
    rotate.onclick = () => {
      if (confirm('Replace group ' + group.number + '’s code? Its current device will lose AI access. Remaining allowances stay the same.'))
        manage('recover', { number: group.number });
    };
  });
}

async function manage(action, data = {}) {
  if (requestInFlight || !secret) return;
  requestInFlight = true;
  el('close').disabled = true;
  try {
    session = await api('instructor:' + action, data, secret);
    renderSession();
  } catch (error) {
    el('session-status').textContent = error.result ? error.message : 'Could not reach the classroom service. Refresh usage to check.';
  } finally {
    requestInFlight = false;
    el('close').disabled = !session.open;
  }
}

function saveTimer(next) {
  timer = next;
  try { localStorage.setItem(timerKey, JSON.stringify(timer)); }
  catch {
    el('timer-alert').textContent = 'This browser is blocking timer sharing. Use the countdown in this window.';
    el('timer-alert').hidden = false;
  }
}

function chime() {
  if (!audio || audio.state !== 'running' || !el('sound').checked) return;
  const tone = audio.createOscillator();
  const volume = audio.createGain();
  tone.frequency.value = 660;
  volume.gain.setValueAtTime(0.12, audio.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.35);
  tone.connect(volume).connect(audio.destination);
  tone.start();
  tone.stop(audio.currentTime + 0.35);
}

function renderTimer() {
  const now = Date.now();
  const next = advance(timer, now);
  if (next !== timer) saveTimer(next);
  const index = timer.index;
  const done = index >= stages.length;
  el('countdown').textContent = format(remaining(timer, now));
  el('overall').textContent = format(totalRemaining(timer, now));
  el('toggle-clock').textContent = timer.deadline !== null ? 'Pause' : timer.started ? 'Resume' : 'Start';
  ['toggle-clock', 'next-stage', 'plus-one', 'plus-three', 'seconds'].forEach(id => { el(id).disabled = done; });
  el('adjust-clock').querySelector('button').disabled = done;
  el('back-stage').disabled = index === 0;
  el('discussion').hidden = index !== 6;
  if (index !== lastStage) {
    el('timer-stage').textContent = stages[index]?.[1] ?? 'Investigation Complete';
    const alert = index === 6 ? 'Class debrief has started. Close live AI access when the groups are ready.' :
      done ? 'Class debrief has ended. Confirm live AI access is closed.' :
        lastStage >= 0 && timer.started ? 'New stage: ' + stages[index][1] : '';
    el('timer-alert').textContent = alert;
    el('timer-alert').hidden = !alert;
    if (lastStage !== -1 && timer.started) chime();
    lastStage = index;
    lastQuestion = -1;
    renderStageGuide();
  }
  if (index === 6 && timer.question !== lastQuestion) {
    const [title, question, followup] = questions[timer.question];
    el('private-question').textContent = `${timer.question + 1}. ${title} — ${question}`;
    el('private-followup').textContent = followup;
    el('private-discussion-notes').textContent = guide.discussion?.[timer.question] ?? '';
    el('previous-question').disabled = timer.question === 0;
    el('next-question').disabled = timer.question === questions.length - 1;
    lastQuestion = timer.question;
  }
}

function renderStageGuide() {
  const target = el('stage-guide');
  target.replaceChildren();
  const stage = guide.stages?.[timer.index];
  if (!stage) return;
  add(target, 'h3', stages[timer.index][1]);
  ['Student task', 'What to look for', 'Ask while circulating', 'Common misconception', 'Ready to move forward'].forEach((label, index) => {
    const paragraph = add(target, 'p');
    add(paragraph, 'strong', label + ' · ');
    paragraph.append(stage[index]);
  });
}

function renderGuide() {
  const target = el('client-guide');
  target.replaceChildren();
  for (const [name, client] of Object.entries(guide.clients ?? {})) {
    const details = add(target, 'details');
    add(details, 'summary', name);
    for (const [heading, content] of Object.entries(client)) {
      const paragraph = add(details, 'p');
      add(paragraph, 'strong', heading[0].toUpperCase() + heading.slice(1) + ' · ');
      paragraph.append(content);
    }
  }
  renderStageGuide();
  lastQuestion = -1;
  renderTimer();
}

el('login').onsubmit = async event => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  el('account-status').textContent = 'Signing in…';
  const candidate = el('secret').value;
  try {
    guide = await api('instructor:guide', {}, candidate);
    secret = candidate;
    el('secret').value = '';
    el('login').hidden = true;
    el('logout').hidden = false;
    el('portal').hidden = false;
    el('account-status').textContent = 'Signed in. Signing out does not close AI access.';
    el('guide-status').textContent = Object.keys(guide.clients ?? {}).length ? '' : 'The private facilitation guide requires Netlify setup.';
    renderGuide();
    await manage('status');
  } catch (error) {
    el('account-status').textContent = error.result ? error.message : 'Sign-in service unavailable.';
  } finally {
    button.disabled = false;
  }
};
el('logout').onclick = () => location.reload();
el('session-form').onsubmit = event => {
  event.preventDefault();
  manage('open', Object.fromEntries(['minutes', 'groups', 'allowance'].map(id => [id, el(id).valueAsNumber])));
};
el('refresh').onclick = () => manage('status');
el('close').onclick = () => manage('close');
el('toggle-clock').onclick = () => {
  const now = Date.now();
  const current = advance(timer, now);
  if (current.index === stages.length) return;
  saveTimer(current.deadline === null ?
    { ...current, started: true, deadline: now + current.time } :
    { ...current, deadline: null, time: remaining(current, now) });
  renderTimer();
};
el('back-stage').onclick = () => { saveTimer(jump(timer, timer.index - 1)); renderTimer(); };
el('next-stage').onclick = () => { saveTimer(jump(timer, timer.index + 1)); renderTimer(); };
el('reset-clock').onclick = () => { saveTimer(initial()); renderTimer(); };
function addTime(minutes) {
  saveTimer(setTime(timer, remaining(timer) + minutes * 60000));
  renderTimer();
}
el('plus-one').onclick = () => addTime(1);
el('plus-three').onclick = () => addTime(3);
el('adjust-clock').onsubmit = event => {
  event.preventDefault();
  const seconds = el('seconds').valueAsNumber;
  saveTimer(setTime(timer, seconds * 1000));
  renderTimer();
};
el('sound').onchange = async () => {
  if (!el('sound').checked) return;
  try {
    audio ??= new AudioContext();
    await audio.resume();
  } catch {
    el('sound').checked = false;
  }
};
function choose(delta) {
  const question = Math.max(0, Math.min(questions.length - 1, timer.question + delta));
  saveTimer({ ...timer, question });
  renderTimer();
}
el('previous-question').onclick = () => choose(-1);
el('next-question').onclick = () => choose(1);
el('project').onclick = event => {
  const projection = window.open(el('project').href, 'exs101-classroom-projection', 'popup');
  if (projection) {
    event.preventDefault();
    projection.focus();
  }
};
window.addEventListener('storage', event => {
  if (event.key === timerKey) {
    timer = readTimer() ?? initial();
    renderTimer();
  }
});
saveTimer(advance(timer));
renderTimer();
setInterval(() => {
  renderTimer();
  if (session.open && session.expires <= Date.now()) {
    session = { open: false };
    renderSession();
  }
}, 250);
