'use strict';
const express = require('express');
const router = express.Router();

router.use('/phones', require('./phones'));
router.use('/balance', require('./balance'));
router.use('/recharge', require('./recharge'));
router.use('/rules', require('./rules'));
router.use('/config', require('./config'));
router.use('/health', require('./health'));

module.exports = router;
