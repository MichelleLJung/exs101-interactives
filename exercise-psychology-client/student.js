import { api, byId as el, references } from './common.js';

import { cases, examples } from './cases.mjs';
const clientNames = Object.keys(cases);

const stages = ['start', 'investigate', 'interpret', 'recommend', 'reassess', 'review', 'debrief'];
const stageTitles = ['Start Here', 'Investigate', 'Interpret', 'Recommend', 'Reassess', 'Review', 'Debrief'];
const noteFields = [];
const history = [];
let client = clientNames[0];
let mode = '';
let token = '';
let expires = 0;
let remaining = 0;
let reviewAvailable = false;
let busy = false;
let stage = 'start';
let expiryTimer;
let revealed = false;
const recoveryKey = 'exs101-client-recovery-v1';
const recoveryWindow = 24 * 60 * 60 * 1000;

function recoveryStatus(message) {
  const status = el('recovery-status');
  if (status) status.textContent = message;
}

function saveWork() {
  if (!mode) return;
  try {
    localStorage.setItem(recoveryKey, JSON.stringify({
      savedAt: Date.now(), client, mode, stage, expires, remaining, reviewAvailable, revealed,
      token: Date.now() < expires ? token : '',
      history, notes: noteFields.map(field => field.value),
      draft: el('message').value, roleplay: el('roleplay-evidence').value,
      nextStep: el('next-step').value, feedback: el('feedback').textContent
    }));
  } catch {
    recoveryStatus('This browser could not save your work. Keep this tab open.');
  }
}

function scheduleExpiry() {
  clearTimeout(expiryTimer);
  expiryTimer = setTimeout(() => expire('Live access expired. Your work is still here.'), Math.max(0, expires - Date.now()));
}

function restoreWork() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(recoveryKey));
    if (!saved) return;
    if (!Number.isFinite(saved.savedAt) || Date.now() - saved.savedAt >= recoveryWindow) {
      localStorage.removeItem(recoveryKey);
      return;
    }
  } catch {
    recoveryStatus('Recovery is unavailable in this browser. Keep this tab open.');
    return;
  }
  if (!clientNames.includes(saved.client) || !['live', 'roleplay'].includes(saved.mode) ||
    !Array.isArray(saved.notes) || !Array.isArray(saved.history)) return;
  ({ client, mode, expires, remaining, reviewAvailable } = saved);
  revealed = Boolean(saved.revealed);
  token = typeof saved.token === 'string' && Date.now() < expires ? saved.token : '';
  history.push(...saved.history);
  noteFields.forEach((field, index) => { field.value = saved.notes[index] ?? ''; });
  el('message').value = saved.draft ?? '';
  el('roleplay-evidence').value = saved.roleplay ?? '';
  el('next-step').value = saved.nextStep ?? '';
  el('feedback').textContent = saved.feedback ?? '';
  el('feedback').hidden = !saved.feedback;
  el('client').value = client;
  el('activate').hidden = mode === 'live' || Boolean(token);
  recoveryStatus('Group work restored from this browser.');
  if (mode === 'live' && token) {
    el('start-status').textContent = 'Live session restored. Access depends on the classroom session.';
    el('chat-status').textContent = remaining + ' group messages remaining.';
    el('review-status').textContent = saved.feedback ? 'Review restored.' :
      reviewAvailable ? 'One consultation review is available.' : 'Your group already used its consultation review.';
    scheduleExpiry();
  } else if (mode === 'live') {
    el('chat-status').textContent = 'Live access has ended. Your work is still here.';
    el('start-status').textContent = el('chat-status').textContent;
    el('review-status').textContent = el('chat-status').textContent + ' You can use the self-review.';
  } else {
    el('chat-status').textContent = 'Teammate roleplay restored.';
    el('review-status').textContent = 'Use the self-review above.';
  }
  renderProfile();
  select(stages.includes(saved.stage) ? saved.stage : 'start', false);
}

function addText(parent, tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  parent.append(node);
  return node;
}

function addNotes(parent, labels) {
  labels.forEach(label => {
    const id = 'note-' + noteFields.length;
    addText(parent, 'label', label).htmlFor = id;
    const input = addText(parent, 'textarea', '');
    input.id = id;
    input.maxLength = 500;
    noteFields.push(input);
  });
}

function renderProfile() {
  const [age, occupation, opening, facts] = cases[client];
  document.querySelectorAll('[data-profile]').forEach(card => {
    card.replaceChildren();
    const initial = addText(card, 'span', client[0]);
    initial.className = 'initial';
    initial.setAttribute('aria-hidden', 'true');
    addText(card, 'strong', `${client} · ${age} · ${occupation}`);
    addText(card, 'p', '“' + opening + '”');
    addText(card, 'small', 'Fictional client');
  });
  el('case-facts').replaceChildren();
  facts.forEach(fact => addText(el('case-facts'), 'li', fact));
}

function renderTranscript(target) {
  target.replaceChildren();
  const name = client;
  const opening = addText(target, 'p', `${name}: ${cases[name][2]}`);
  opening.className = 'bubble';
  history.forEach(message => {
    const line = addText(target, 'p', (message.role === 'user' ? 'Group: ' : name + ': ') + message.content);
    line.className = message.role === 'user' ? 'bubble group' : 'bubble';
  });
  if (target.id === 'evidence-transcript' && el('roleplay-evidence').value.trim())
    addText(target, 'p', 'Roleplay evidence: ' + el('roleplay-evidence').value);
}

function syncControls() {
  const live = Boolean(token) && Date.now() < expires && mode === 'live';
  el('send').disabled = busy || !live || remaining < 1;
  el('request-review').disabled = busy || !live || !reviewAvailable;
  el('interview').hidden = mode === 'roleplay';
  el('case-card').hidden = mode !== 'roleplay';
  el('roleplay').disabled = busy;
  el('client').disabled = Boolean(mode);
  if (el('clear-work')) el('clear-work').disabled = busy || !mode;
}

function select(stageName, save = true) {
  stage = stageName;
  document.querySelectorAll('#stages button').forEach(button => {
    if (button.dataset.stage === stage) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  stages.forEach(name => { el(name).hidden = name !== stage; });
  if (['investigate', 'reassess'].includes(stage)) {
    el('chat-' + stage).append(el('chat'));
    el('chat').hidden = false;
    renderTranscript(el('transcript'));
  } else {
    el('chat').hidden = true;
  }
  if (stage === 'interpret') renderTranscript(el('evidence-transcript'));
  if (stage === 'debrief') {
    renderReveal();
    el('debrief-notes').replaceChildren();
    const selected = [noteFields[12], noteFields[17], noteFields[18]];
    selected.forEach(field => {
      if (field.value.trim()) addText(el('debrief-notes'), 'p', field.labels[0].textContent + ': ' + field.value);
    });
    if (!el('debrief-notes').children.length) addText(el('debrief-notes'), 'p', 'Use your conversation and group discussion to prepare.');
  }
  el(stage + '-title').focus();
  if (save) saveWork();
}

function expire(message) {
  el('chat-status').textContent = message;
  el('review-status').textContent = message + ' Use the self-review above.';
  el('start-status').textContent = message;
  expires = 0;
  token = '';
  syncControls();
  saveWork();
}

stages.forEach((name, index) => {
  const button = addText(el('stages'), 'button', stageTitles[index]);
  button.dataset.stage = name;
  if (!index) button.setAttribute('aria-current', 'step');
  button.onclick = () => select(name);
});
references.forEach(title => addText(el('references'), 'li', title));
clientNames.forEach(name => { addText(el('client'), 'option', name).value = name; });
el('client').onchange = () => { client = el('client').value; renderProfile(); };
for (let i = 1; i <= 3; i++) {
  const box = addText(el('analyses'), 'fieldset', '');
  addText(box, 'legend', 'Concept ' + i);
  addNotes(box, ['Client statement or specific evidence', 'Psychological concept', 'Reference page and section', 'Why the concept applies']);
}
addNotes(el('recommend-notes'), ['Individualized strategy', 'Realistic first step', 'Concept-based rationale', 'Why it fits the client’s circumstances and preferences']);
addNotes(el('reassess-notes'), ['Client reaction', 'Revised strategy', 'Reason for the revision']);

const hints = [
  'Ask about a specific time the client tried to be active. What made it easier or harder?',
  'Pick one detail you’ve heard and ask a follow-up. Can you find out what the client values and what they already do well?',
  'Test two explanations. What follow-up would help you distinguish them? Look at your Canvas references for ideas.'
];
el('hint-button').onclick = () => {
  addText(el('hints'), 'li', hints[el('hints').children.length]);
  el('hint-button').disabled = el('hints').children.length >= hints.length;
};

el('activate').onsubmit = async event => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  busy = true;
  syncControls();
  el('start-status').textContent = 'Activating your group…';
  try {
    const result = await api('activate', { code: el('code').value.trim().toLowerCase().replace(/[\s-]/g, '') });
    ({ token, client, expires, remaining, reviewAvailable } = result);
    mode = 'live';
    el('client').value = client;
    el('activate').hidden = true;
    el('code').value = '';
    el('start-status').textContent = `Live access active for ${client}. ${remaining} messages and one separate review are available.`;
    el('chat-status').textContent = `${remaining} group messages remaining.`;
    el('review-status').textContent = reviewAvailable ? 'One consultation review is available.' : 'Your group already used its consultation review.';
    scheduleExpiry();
    renderProfile();
    select('investigate');
  } catch (error) {
    el('start-status').textContent = error.result ? error.message : 'Live service unavailable. You can use teammate roleplay.';
  } finally {
    busy = false;
    button.disabled = false;
    syncControls();
  }
};

el('roleplay').onclick = () => {
  mode = 'roleplay';
  el('chat-status').textContent = 'Teammate roleplay is active. Keep the discussion and notes in this page.';
  el('review-status').textContent = 'Use the self-review above.';
  syncControls();
  select('investigate');
};

async function consult(action, data, statusId, onAnswer) {
  if (busy) return;
  busy = true;
  syncControls();
  const status = el(statusId);
  status.textContent = action === 'review' ? 'Preparing your consultation review…' : 'Waiting for the client…';
  try {
    const result = await api(action, { ...data, history, requestId: crypto.randomUUID() }, token);
    remaining = result.remaining;
    reviewAvailable = result.reviewAvailable;
    onAnswer(result.answer);
  } catch (error) {
    if (Number.isInteger(error.result?.remaining)) remaining = error.result.remaining;
    if (typeof error.result?.reviewAvailable === 'boolean') reviewAvailable = error.result.reviewAvailable;
    if ([403, 410].includes(error.status)) {
      expires = 0;
      expire(error.message);
    }
    if (error.status === 429 && action === 'review') reviewAvailable = false;
    status.textContent = error.result ? error.message : 'Connection interrupted. Check with your instructor or continue with teammate roleplay.';
  } finally {
    busy = false;
    syncControls();
    saveWork();
  }
}
el('interview').onsubmit = event => {
  event.preventDefault();
  const message = el('message').value.trim();
  if (!message || el('send').disabled) return;
  consult('interview', { message }, 'chat-status', answer => {
    history.push({ role: 'user', content: message }, { role: 'assistant', content: answer });
    if (el('message').value.trim() === message) el('message').value = '';
    renderTranscript(el('transcript'));
    el('transcript').scrollTop = el('transcript').scrollHeight;
    if (stage === 'interpret') renderTranscript(el('evidence-transcript'));
    el('chat-status').textContent = `${remaining} group messages remaining.`;
  });
};
el('request-review').onclick = () => {
  const notes = noteFields.map(field => field.value.trim());
  if (notes.some(value => !value) || !history.length) {
    el('review-status').textContent = 'Gather client evidence and complete all Interpret, Recommend and Reassess fields first.';
    return;
  }
  consult('review', { notes }, 'review-status', answer => {
    el('feedback').textContent = answer;
    el('feedback').hidden = false;
    el('review-status').textContent = 'Review ready. Check the feedback against the references.';
  });
};

renderProfile();
el('chat-status').textContent = 'Activate your group or choose teammate roleplay on Start Here.';
syncControls();

restoreWork();
syncControls();
for (const field of [...noteFields, el('message'), el('roleplay-evidence'), el('next-step')]) {
  field.addEventListener('input', saveWork);
}
el('clear-work')?.addEventListener('click', () => {
  if (!confirm('Clear this group’s saved transcript and notes from this browser?')) return;
  try { localStorage.removeItem(recoveryKey); }
  catch {
    recoveryStatus('This browser could not clear the saved work.');
    return;
  }
  location.reload();
});

function renderReveal() {
  const panel = el('case-reveal');
  el('reveal-case').disabled = !mode || revealed;
  panel.hidden = !revealed;
  if (!revealed) return;
  panel.replaceChildren();
  const [age, occupation, opening, facts] = cases[client];
  const [concept, reasoning, strategy] = examples[client];
  addText(panel, 'h3', client + ' · Complete case');
  addText(panel, 'p', age + ' · ' + occupation);
  addText(panel, 'p', opening);
  const list = addText(panel, 'ul', '');
  facts.forEach(fact => addText(list, 'li', fact));
  addText(panel, 'h3', 'Example analysis');
  addText(panel, 'p', 'Concepts: ' + concept);
  addText(panel, 'p', 'Reasoning: ' + reasoning);
  addText(panel, 'p', 'Possible first step: ' + strategy);
  addText(panel, 'p', 'What evidence supports your approach? What would you keep or change?');
}

el('reveal-case').onclick = () => {
  revealed = true;
  renderReveal();
  el('case-reveal').focus();
  saveWork();
};
