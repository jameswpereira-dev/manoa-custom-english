import axios from 'axios';
import { auth } from './firebase';

const BASE = process.env.REACT_APP_FUNCTION_URL;

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error('Não autenticado');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function processContent(payload) {
  const headers = await authHeaders();
  const { data } = await axios.post(`${BASE}/api/process-content`, payload, { headers });
  return data;
}

export async function getWords() {
  const headers = await authHeaders();
  const { data } = await axios.get(`${BASE}/api/get-words`, { headers });
  return data;
}

export async function updateProgress(wordId, correct) {
  const headers = await authHeaders();
  const { data } = await axios.post(
    `${BASE}/api/update-progress`,
    { word_id: wordId, correct },
    { headers }
  );
  return data;
}

export async function deleteWord(wordId) {
  const headers = await authHeaders();
  await axios.delete(`${BASE}/api/delete-word/${wordId}`, { headers });
}

export async function generateWords(profession, quantity) {
  const headers = await authHeaders();
  const { data } = await axios.post(`${BASE}/api/generate-words`, { profession, quantity }, { headers });
  return data;
}

export async function getSubscription() {
  const headers = await authHeaders();
  const { data } = await axios.get(`${BASE}/api/get-subscription`, { headers });
  return data;
}

export async function createCheckoutSession(plan) {
  const headers = await authHeaders();
  const { data } = await axios.post(`${BASE}/api/create-checkout-session`, { plan }, { headers });
  return data;
}
