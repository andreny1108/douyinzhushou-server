'use strict';
const express = require('express');
const router = express.Router();
const ConfigService = require('../services/ConfigService');
const AdapterFactory = require('../adapters/AdapterFactory');

router.get('/', async (req, res, next) => {
  try { res.json(await ConfigService.getAll()); } catch (err) { next(err); }
});

router.put('/:key', async (req, res, next) => {
  try {
    const { value, encrypted = false } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'value 不能为空' });
    await ConfigService.set(req.params.key, String(value), !!encrypted);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/test-adapter', async (req, res, next) => {
  try {
    const adapter = await AdapterFactory.getAdapter();
    const result = await adapter.healthCheck();
    res.json({ adapter: adapter.name, ...result });
  } catch (err) { next(err); }
});

module.exports = router;
