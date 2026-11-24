import { byId as el } from '../common.js';
import { advance, format, questions, readTimer, remaining, stages, timerKey, totalRemaining } from '../timing.js';

let state = readTimer();
let previousStage;
let previousQuestion;

function render() {
  const now = Date.now();
  let join;
  try { join = JSON.parse(localStorage.getItem('exs101-projected-join-v1')); }
  catch { /* Projection timing remains available if sharing is blocked. */ }
  const showCode = join && join.expires > now && /^[a-f0-9]{10}$/.test(join.code);
  el('class-join').hidden = !showCode;
  el('class-join-code').textContent = showCode ? join.code : '';
  state = state ? advance(state, now) : null;
  const index = state?.index;
  const done = index === stages.length;
  const stage = stages[index];
  const show = Boolean(stage);
  el('clock-view').hidden = !show;
  el('waiting').hidden = show || done;
  el('complete').hidden = !done;
  if (index !== previousStage) {
    el('stage-title').textContent = stage?.[1] ?? (done ? 'Investigation Complete' : 'Waiting for the classroom timer');
    previousStage = index;
    previousQuestion = null;
    if (show) {
      el('task').textContent = stage[2];
      el('criterion').textContent = 'Ready to move on when: ' + stage[3];
      el('upcoming').textContent = stages[index + 1] ? 'Up next: ' + stages[index + 1][1] : '';
      el('progress').value = index;
      el('sequence').replaceChildren(...stages.map((entry, step) => {
        const label = document.createElement('span');
        label.textContent = entry[4] + (step < index ? ' · complete' : step === index ? ' · current' : ' · upcoming');
        if (step === index) label.setAttribute('aria-current', 'step');
        return label;
      }));
    }
  }
  if (!show) return;
  el('countdown').textContent = format(remaining(state, now));
  el('overall').textContent = format(totalRemaining(state, now)) + ' overall remaining';
  el('clock-state').textContent = state.deadline === null ? (state.started ? 'Paused' : 'Ready to start') : '';
  el('question-view').hidden = index !== 6;
  el('activity').hidden = index === 6;
  if (index === 6 && state.question !== previousQuestion) {
    const [label, question, followup] = questions[state.question];
    el('question-label').textContent = `Question ${state.question + 1} of ${questions.length} · ${label}`;
    el('question').textContent = question;
    el('followup').textContent = followup;
    previousQuestion = state.question;
  }
}
window.addEventListener('storage', event => {
  if (event.key === timerKey) { state = readTimer(); render(); }
});
el('fullscreen').hidden = !document.fullscreenEnabled;
el('fullscreen').onclick = async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
};
document.addEventListener('fullscreenchange', () => {
  el('fullscreen').textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
});
render();
setInterval(render, 250);
