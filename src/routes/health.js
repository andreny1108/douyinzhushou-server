'use strict';
const express = require('express');
const router = express.Router();
const { testConnection } = require('../../config/database');
const AdapterFactory = require('../adapters/AdapterFactory');

router.get('/', async (req, res) => {
  const checks = { db: false, adapter: false };
  try { await testConnection(); checks.db = true; } catch (_) {}
  try {
    const adapter = await AdapterFactory.getAdapter();
    const r = await adapter.healthCheck();
    checks.adapter = r.ok;
    checks.adapterName = adapter.name;
  } catch (_) {}
  const ok = checks.db && checks.adapter;
  res.status(ok ? 200 : 503).json({ ok, checks, ts: new Date().toISOString() });
});

module.exports = router;
