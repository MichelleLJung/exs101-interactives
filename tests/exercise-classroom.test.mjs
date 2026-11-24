import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { handler } from '../netlify/functions/exercise-client.mjs';

const secret = 'local-test-password-with-entropy';
const names = ['Marisol', 'Darius', 'Priya', 'Graham', 'Simone'];
process.env.EXERCISE_INSTRUCTOR_SECRET = secret;
process.env.EXERCISE_PRIVATE_GUIDE = JSON.stringify(Object.fromEntries(names.map(name => [name, { profile: name + ' private test profile' }])));
process.env.OPENAI_API_KEY = 'local-test-provider-key';

function fixture() {
  let version = 0;
  let data;
  let calls = [];
  const store = {
    offline: false,
    async getWithMetadata() {
      if (store.offline) throw new Error('Unavailable');
      return data ? { data: structuredClone(data), etag: String(version) } : null;
    },
    async setJSON(key, next, condition) {
      if (condition.onlyIfNew ? Boolean(data) : condition.onlyIfMatch !== String(version)) return { modified: false };
      data = structuredClone(next);
      version++;
      return { modified: true };
    }
  };
  const endpoint = handler({
    storage: () => store,
    ai: async (path, body) => {
      calls.push({ path, body });
      await new Promise(resolve => setTimeout(resolve, 10));
      return path === 'moderations' ? { results: [{ flagged: body.input.includes('test moderation marker') }] } :
        { output: [{ content: [{ type: 'output_text', text: 'Mock response' }] }] };
    }
  });
  async function post(action, data = {}, token) {
    const response = await endpoint(new Request('https://local.test/api/exercise-client', {
      method: 'POST', headers: token ? { Authorization: 'Bearer ' + token } : {},
      body: JSON.stringify({ action, ...data })
    }));
    return { status: response.status, body: await response.json() };
  }
  const admin = (action, data) => post('instructor:' + action, data, secret);
  const open = () => admin('open', { minutes: 75, groups: 5, allowance: 3 });
  const activate = code => post('activate', { code });
  const ask = (token, requestId = randomUUID(), message = 'What do you enjoy?') =>
    post('interview', { requestId, history: [], message }, token);
  const review = token => post('review', { requestId: randomUUID(), history: [{ role: 'user', content: 'Question' }, { role: 'assistant', content: 'Evidence' }], notes: Array(19).fill('test notes') }, token);
  return { admin, open, post, activate, ask, review, store, get calls() { return calls; }, state: () => structuredClone(data) };
}

test('instructor authentication, single-use activation and assignment for all five clients', async () => {
  const f = fixture();
  assert.equal((await f.post('instructor:guide')).status, 403);
  assert.deepEqual(Object.keys((await f.admin('guide')).body.clients), names);
  assert.equal((await f.activate('0'.repeat(16))).status, 410);
  const result = await f.open();
  assert.equal(result.status, 200);
  assert.equal((await f.open()).status, 409);
  const { groups } = result.body;
  assert.equal(new Set(groups.map(group => group.code)).size, 5);
  for (const group of groups) {
    const attempts = await Promise.all([f.activate(group.code), f.activate(group.code)]);
    assert.deepEqual(attempts.map(item => item.status).sort(), [200, 403]);
    const accepted = attempts.find(item => item.status === 200).body;
    assert.equal(accepted.client, names[group.number - 1]);
    assert.equal((await f.ask(accepted.token)).status, 200);
    const responseRequest = f.calls.at(-1).body;
    assert.ok(responseRequest.instructions.includes(group.client + ' private test profile'));
    assert.equal(responseRequest.store, false);
  }
  assert.equal((await f.activate('0'.repeat(16))).status, 403);
});

test('concurrent requests and replay cannot exceed allowances; review is separate', async () => {
  const f = fixture();
  const { groups } = (await f.open()).body;
  const { token } = (await f.activate(groups[0].code)).body;
  const id = randomUUID();
  const results = await Promise.all(Array.from({ length: 8 }, () => f.ask(token, id)));
  assert.equal(results.filter(item => item.status === 200).length, 1);
  assert.equal((await f.ask(token, id)).status, 409);
  assert.equal((await f.ask(token)).status, 200);
  assert.equal((await f.ask(token)).status, 200);
  assert.equal((await f.ask(token)).status, 429);
  const reviews = await Promise.all([f.review(token), f.review(token)]);
  assert.equal(reviews.filter(item => item.status === 200).length, 1);
  assert.equal((await f.review(token)).status, 429);
  assert.equal(f.calls.length, 8);
  assert.equal(f.state().total, 4);
  assert.doesNotMatch(JSON.stringify(f.state()), /What do you enjoy|Mock response|test notes/);

  const entry = await f.store.getWithMetadata();
  entry.data.total = entry.data.groups.length * (entry.data.allowance + 1);
  await f.store.setJSON('classroom', entry.data, { onlyIfMatch: entry.etag });
  const second = (await f.activate(groups[1].code)).body.token;
  assert.equal((await f.ask(second)).status, 429);
  assert.equal(f.calls.length, 8);
});

test('recovery preserves quota and revokes the prior device; closure and outages fail closed', async () => {
  const f = fixture();
  const { groups } = (await f.open()).body;
  const { token } = (await f.activate(groups[0].code)).body;
  assert.equal((await f.ask(token, randomUUID(), 'test moderation marker')).status, 422);
  assert.equal(f.calls.length, 1);
  const recovered = await f.admin('recover', { number: 1 });
  assert.equal((await f.ask(token)).status, 403);
  const next = (await f.activate(recovered.body.groups[0].code)).body;
  assert.equal(next.remaining, 2);
  f.store.offline = true;
  assert.equal((await f.ask(next.token)).status, 503);
  assert.equal(f.calls.length, 1);
  f.store.offline = false;
  const inFlight = f.ask(next.token);
  while (f.calls.length === 1) await new Promise(resolve => setTimeout(resolve, 1));
  await f.admin('close');
  assert.equal((await inFlight).status, 410);
  assert.equal(f.calls.length, 2, 'closure during moderation prevents generation');
  assert.equal((await f.ask(next.token)).status, 410);
  assert.deepEqual(f.state(), { closed: true });
  const reopened = await f.open();
  const entry = await f.store.getWithMetadata();
  entry.data.expires = Date.now() - 1;
  await f.store.setJSON('classroom', entry.data, { onlyIfMatch: entry.etag });
  assert.equal((await f.activate(reopened.body.groups[0].code)).status, 410);
});

test('timer advances across inactive stages using absolute deadlines', async () => {
  const text = await readFile(new URL('../exercise-psychology-client/timing.js', import.meta.url), 'utf8');
  const time = await import('data:text/javascript,' + encodeURIComponent(text));
  const start = { ...time.initial(), started: true, deadline: 300000 };
  assert.equal(time.totalRemaining(start, 0), 65 * 60000);
  const atDebrief = time.advance(start, 53 * 60000);
  assert.equal(atDebrief.index, 6);
  assert.equal(time.remaining(atDebrief, 53 * 60000), 12 * 60000);
  assert.equal(time.advance(atDebrief, 65 * 60000).index, 7);
  const paused = { ...atDebrief, time: 120000, deadline: null };
  assert.equal(time.advance(paused, 80 * 60000).time, 120000);
  assert.equal(time.setTime(paused, 90000).deadline, null);
  assert.equal(time.jump(atDebrief, 5, 4000).deadline, 364000);
});
