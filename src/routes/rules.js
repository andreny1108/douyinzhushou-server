'use strict';
const express = require('express');
const router = express.Router();
const RuleService = require('../services/RuleService');

router.get('/', async (req, res, next) => {
  try { res.json(await RuleService.list(req.query.phone_id || null)); } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try { res.status(201).json(await RuleService.create(req.body)); } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try { res.json(await RuleService.update(req.params.id, req.body)); } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try { await RuleService.remove(req.params.id); res.json({ success: true }); } catch (err) { next(err); }
});

router.patch('/:id/toggle', async (req, res, next) => {
  try { res.json(await RuleService.toggle(req.params.id)); } catch (err) { next(err); }
});

module.exports = router;
