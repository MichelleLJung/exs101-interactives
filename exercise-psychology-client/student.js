import { api, byId as el, clientNames, references } from './common.js';

const cases = {
  Marisol: [38, 'Office worker', "I'm interested in exercising more, but I never seem to stick with the gym.", [
    'I want more energy and to stay independent. I felt lost around gym equipment and compared myself with experienced members.',
    'Past attempts made me doubt I could stick with it. I enjoy walking with my cousin and have two 15-minute windows each week.',
    'I would try something with a short demonstration and a manageable first success. Public rankings would make me uncomfortable.'
  ]],
  Darius: [29, 'Warehouse worker', "People keep telling me I should exercise more. I'm not sure what I want to do.", [
    'My partner pushes me to go to the gym. It feels like nagging. I’m unsure whether I want to change anything right now.',
    'I like recreational basketball and dislike prescribed gym routines.',
    'I might try something if I choose the activity and the time. I would push back on guilt or mandatory targets.'
  ]],
  Priya: [43, 'Caregiver and shift worker', 'I really want to be more active, but my routine keeps falling apart.', [
    'I value being active and like walking. Shifts and childcare change unexpectedly and juggling both is stressful.',
    'I sometimes have 10 minutes. There is a park nearby, but heat and transportation can get in the way.',
    'My sister might be able to help if I ask. A plan I can adapt is more realistic than a rigid schedule.'
  ]],
  Graham: [51, 'Accountant', 'I start exercise programs all the time. Somehow I always end up quitting.', [
    'Online transformations get me to start ambitious daily plans. Missing a day feels like failure. When the scale stalls, I lose motivation.',
    'I enjoy cycling and have three short windows during a typical week.',
    'I would try a manageable goal focused on what I do and would keep progress private. Comparisons put me off.'
  ]],
  Simone: [34, 'Librarian', "I used to love going to exercise classes. Lately I just don't feel like going.", [
    'Dance classes helped me manage everyday stress and feel better. The new instructor ranks people and offers fewer modifications.',
    'My friends stopped going. I miss moving to music and feeling connected, but I dread returning to the old class.',
    'I like outdoor walks and feel better after movement I enjoy. I would consider a welcoming alternative if there were no pressure.'
  ]]
};
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
  el('client').disabled = Boolean(token) || mode === 'roleplay';
}

function select(stageName) {
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
    el('debrief-notes').replaceChildren();
    const selected = [noteFields[12], noteFields[17], noteFields[18]];
    selected.forEach(field => {
      if (field.value.trim()) addText(el('debrief-notes'), 'p', field.labels[0].textContent + ': ' + field.value);
    });
    if (!el('debrief-notes').children.length) addText(el('debrief-notes'), 'p', 'Use your conversation and group discussion to prepare.');
  }
  el(stage + '-title').focus();
}

function expire(message) {
  el('chat-status').textContent = message;
  el('review-status').textContent = message + ' Use the self-review above.';
  el('start-status').textContent = message;
  if (message.includes('this device') || Date.now() >= expires) expires = 0;
  syncControls();
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
    clearTimeout(expiryTimer);
    expiryTimer = setTimeout(() => expire('Live access expired. Your work is still here.'), Math.max(0, expires - Date.now()));
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
