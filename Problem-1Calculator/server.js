const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 9876;
const BASE_URL = "http://20.244.56.144/evaluation-service";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ2ODc1MTIzLCJpYXQiOjE3NDY4NzQ4MjMsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjZhZmEzODViLWM0ODUtNGJlMC05MzA5LTI0NDlkZjAxZmFjNyIsInN1YiI6InRoZWphc2JzaGV0dHlAZ21haWwuY29tIn0sImVtYWlsIjoidGhlamFzYnNoZXR0eUBnbWFpbC5jb20iLCJuYW1lIjoidGhlamFzIGIgc2hldHR5Iiwicm9sbE5vIjoiNHNvMjJjczE3MSIsImFjY2Vzc0NvZGUiOiJLakpBeFAiLCJjbGllbnRJRCI6IjZhZmEzODViLWM0ODUtNGJlMC05MzA5LTI0NDlkZjAxZmFjNyIsImNsaWVudFNlY3JldCI6ImJuRnR4VVB5bUVxcFV1aFQifQ.uzfP6qjRRZtxqkGJIlmlWFDgAE4-44KO9NG2jd066_A";

const endpoints = {
  p: 'primes',
  f: 'fibo',
  e: 'even',
  r: 'rand'
};

const window = 10;
let state = [];
const updateWindow = (newNumbers) => {
  const unique = newNumbers.filter(n => !state.includes(n));
  const updated = [...state, ...unique].slice(-window);
  const avg = (updated.reduce((a, b) => a + b, 0) / updated.length).toFixed(2);
  return { prev: state, curr: updated, avg: parseFloat(avg) };
};

const setState = (newState) => {
  state = newState;
};

const getState = () => [...state];
app.get('/numbers/:type', async (req, res) => {
  const type = req.params.type.toLowerCase();
  const endpoint = endpoints[type];

  if (!endpoint) {
    return res.status(400).json({ error: "Invalid type. Use one of: p, f, e, r" });
  }

  try {
    const source = axios.CancelToken.source();
    const timeout = setTimeout(() => source.cancel(), 500);

    const response = await axios.get(`${BASE_URL}/${endpoint}`, {
      cancelToken: source.token,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    clearTimeout(timeout);
    const numbers = response.data.numbers;

    const prev = [...getState()];
    const { curr, avg } = updateWindow(numbers);
    setState(curr);

    res.json({
      windowPrevState: prev,
      windowCurrState: curr,
      numbers,
      avg
    });

  } catch (err) {
    console.error("Fetch error or timeout:", err.message);
    return res.status(500).json({ error: "Timeout or fetch error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
