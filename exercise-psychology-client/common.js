export const byId = id => document.getElementById(id);
export const references = ['Motivation & Self-Efficacy', 'Exercise Adherence & Behavior Change', 'Exercise Environments & Mental Health'];
export const clientNames = ['Marisol', 'Darius', 'Priya', 'Graham', 'Simone'];

export async function api(action, data = {}, token = '') {
  const response = await fetch('/api/exercise-client', {
    method: 'POST', credentials: 'omit', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) },
    body: JSON.stringify({ action, ...data }), signal: AbortSignal.timeout(29000)
  });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || 'The service is unavailable.'), { result, status: response.status });
  return result;
}
