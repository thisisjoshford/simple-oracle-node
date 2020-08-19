const nearAPI = require('near-api-js');
const fetch = require("node-fetch");

const nearAcct = process.env.NEAR_ACCT

class Oracle {
  constructor() {
    this.timedGrabber = this.timedGrabber.bind(this)
    this.timedGrabber()
  }

  async fetchPrice(url) {
    const result = await fetch(url, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json'
      },
    })
    const jsonResult = await result.json()
    console.log('json_result', jsonResult)
    return Object.values(jsonResult)
  }

  async checkForRequests() {
    const config = {
      networkId: 'default',
      nodeUrl: 'https://rpc.testnet.near.org',
      walletUrl: 'https://wallet.testnet.near.org',
    }

    const clientId = `client.${nearAcct}`
    const oracleId = `oracle.${nearAcct}`
    const oracleNodeId = `oracle-node.${nearAcct}` // TODO change this and private key to function-call access key
    const keyStore = new nearAPI.keyStores.InMemoryKeyStore()
    //oracle-node privateKey
    const privateKey = process.env.ORACLE_NODE_PRIVATE_KEY
    const hardKeypair = nearAPI.KeyPair.fromString(privateKey);
    await keyStore.setKey(config.networkId, oracleNodeId, hardKeypair);
    const near = await nearAPI.connect(Object.assign({ deps: { keyStore: keyStore } }, config))
    const oracleAccount = await near.account(oracleNodeId)

    let requestCheck = await oracleAccount.functionCall(
      oracleId,
      'get_all_requests',
      {
        "max_num_accounts": "100",
        "max_requests": "100"
      }
    )

    if (requestCheck.status.SuccessValue) {
      const decodedValue = Buffer.from(requestCheck.status.SuccessValue, 'base64').toString()
      const jsonValue = JSON.parse(decodedValue)
      if (Object.keys(jsonValue).length) {
        const firstRequest = jsonValue[Object.keys(jsonValue)[0]]
        if (firstRequest.length) {
          const data = firstRequest[0].request.data
          const nonce = firstRequest[0].nonce
          console.log('nonce', nonce)
          console.log('firstRequest[0].request', firstRequest[0].request)
          const decodedData = Buffer.from(data, 'base64').toString()
          const jsonData = JSON.parse(decodedData)
          console.log('jsonData', jsonData)
          const price = await this.fetchPrice(jsonData.get)
          console.log('price', price)
          const priceBase64 = Buffer.from(price.toString()).toString('base64')
          console.log('priceBase64', priceBase64)
          // fulfill
          await oracleAccount.functionCall(
            oracleId,
            'fulfill_request',
            {
              "account": clientId,
              "nonce": nonce,
              "data": priceBase64
            },
            300000000000000
          )
        }
      }
    }

  };

  async timedGrabber() {
    await this.checkForRequests();
    if (this.timer !== null) {
      this.timer = setTimeout(this.timedGrabber, 500);
    }
  };

}
console.log('Waiting for requests...')

new Oracle()