'use strict';
const MockAdapter = require('./MockAdapter');
const JuheAdapter = require('./JuheAdapter');

let _configService = null;

function setConfigService(cs) {
  _configService = cs;
}

async function getAdapter() {
  let adapterName = process.env.ACTIVE_ADAPTER || 'mock';
  let config = {};

  if (_configService) {
    adapterName = await _configService.get('active_adapter') || adapterName;
    if (adapterName === 'juhe') {
      config.balanceKey = await _configService.getDecrypted('juhe_balance_api_key');
      config.rechargeKey = await _configService.getDecrypted('juhe_recharge_api_key');
    }
  }

  switch (adapterName) {
    case 'juhe': return new JuheAdapter(config);
    case 'mock':
    default: return new MockAdapter(config);
  }
}

module.exports = { getAdapter, setConfigService };
