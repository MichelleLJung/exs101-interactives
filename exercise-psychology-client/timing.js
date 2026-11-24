export const timerKey = 'exs101-classroom-clock-v1';
export const stages = [
  [5, 'Prepare & meet your client', 'Open the three Canvas references, assign roles and meet your client.', 'Your group has a client and a plan for sharing the work.', 'Prepare'],
  [15, 'Investigate', 'Ask open-ended questions about priorities, history, confidence, surroundings and strengths.', 'You have evidence about barriers and strengths before offering advice.', 'Investigate'],
  [12, 'Interpret', 'Connect specific client evidence to three course concepts. Locate each concept in a Canvas reference.', 'You can explain why each concept fits this evidence.', 'Interpret'],
  [7, 'Recommend', 'Choose an individualized strategy and a realistic first step. Explain why both fit.', 'Your client could try the first step in their actual circumstances.', 'Recommend'],
  [7, 'Reassess', 'Present the strategy, ask what would or would not work, then revise.', 'You can point to client feedback that changed your plan.', 'Reassess'],
  [6, 'Review & refine', 'Use the review criteria and compare any AI feedback with your evidence and references.', 'Your group agrees on one next step to strengthen its reasoning.', 'Review'],
  [13, 'Class Debrief', 'Compare evidence and strategies across clients.', 'You can explain how your plan changed and why.', 'Debrief']
];
export const questions = [
  ['Understand your client', 'What was the most significant influence on your client’s behavior?', 'What evidence from your conversation supports your interpretation?'],
  ['Compare strategies', 'Why might a strategy that works for your client be ineffective for another client?', 'Consider differences in motivation, confidence, preferences and circumstances.'],
  ['Think like a professional', 'How can exercise professionals support motivation without imposing their own values?', 'What is the difference between encouraging someone and pressuring them?'],
  ['Consider psychological well-being', 'How can exercise environments influence enjoyment, adherence and psychological well-being?', 'Can an exercise experience have both positive and negative psychological effects?'],
  ['Transfer your learning', 'How could these psychological concepts explain behavior outside exercise?', 'Consider studying, learning a skill, maintaining a hobby or developing a new habit.']
];
const duration = index => (stages[index]?.[0] ?? 0) * 60000;
export const initial = () => ({ index: 0, time: duration(0), deadline: null, question: 0, started: false });
export function advance(state, now = Date.now()) {
  if (state.deadline === null || state.deadline > now) return state;
  let { index, deadline } = state;
  while (index < stages.length && deadline <= now) deadline += duration(++index);
  return { ...state, index, deadline: index === stages.length ? null : deadline,
    time: duration(index), question: 0 };
}
export function remaining(state, now = Date.now()) {
  return Math.max(0, state.deadline === null ? state.time : state.deadline - now);
}
export const totalRemaining = (state, now) =>
  remaining(state, now) + stages.slice(state.index + 1).reduce((sum, stage) => sum + stage[0] * 60000, 0);
export function jump(state, index, now = Date.now()) {
  index = Math.max(0, Math.min(stages.length, index));
  const time = duration(index);
  return { ...state, index, time, deadline: state.deadline !== null && time ? now + time : null, question: 0 };
}
export function setTime(state, time, now = Date.now()) {
  return { ...state, time, deadline: state.deadline === null ? null : now + time };
}
export function readTimer() {
  try {
    const state = JSON.parse(localStorage.getItem(timerKey));
    if (state && Number.isInteger(state.index) && state.index >= 0 && state.index <= stages.length &&
      Number.isFinite(state.time) && (state.deadline === null || Number.isFinite(state.deadline)) &&
      questions[state.question]) return state;
  } catch { /* a fresh or restricted browser starts without a saved timer */ }
  return null;
}
export function format(ms) {
  const seconds = Math.ceil(ms / 1000);
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}
