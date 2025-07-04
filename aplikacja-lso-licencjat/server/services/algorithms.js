import express from 'express';
import { runILPAlgorithm } from './ILP/algorithm.js';
import { runMyAlgorithm } from './myAlgorithm/algorithm.js';

const algorithmsRouter = express.Router();

algorithmsRouter.post('/run-ilp', async (req, res) => {
  const { minUsers } = req.body;
  try {
    const result = await runILPAlgorithm(minUsers);
    res.json({ ok: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

algorithmsRouter.post('/run-custom', async (req, res) => {
  const { minUsers } = req.body;
  try {
    const result = await runMyAlgorithm(minUsers);
    res.json({ ok: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default algorithmsRouter;
