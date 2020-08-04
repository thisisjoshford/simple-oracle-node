const nearAPI = require('near-api-js');

class BlockCheck {
  constructor() {
    this.getBlock = this.getBlock.bind(this)
    this.getBlock()
  }

  async getBlock() {
    const config = {
      networkId: 'default',
      nodeUrl: 'https://rpc.testnet.near.org',
      walletUrl: 'https://wallet.testnet.near.org',
    }

    const near = await nearAPI.connect(Object.assign(config, { deps: { keyStore: new nearAPI.keyStores.InMemoryKeyStore() }}));
    const blockInfoByHeight = await near.connection.provider.block({
      blockId: 11333262,
    })
    console.log('blockInfoByHeight', blockInfoByHeight)
    const blockInfoByHash = await near.connection.provider.block({
      blockId: '3xbs8thPsU1PppeB8qW49epYUA5jEBZinqWKePVuLSg1',
    })
    console.log('blockInfoByHash', blockInfoByHash)
  };
}

new BlockCheck()