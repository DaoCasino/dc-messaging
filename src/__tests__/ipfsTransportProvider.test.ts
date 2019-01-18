import { describe, it } from 'mocha'
import { expect } from 'chai'
import { Logger } from '@daocasino/dc-logging'
import { EventEmitter } from 'events'
import { IpfsTransportProvider } from '../Ipfs/IpfsTransportProvider'

const log = new Logger('Test ipfs transport provider')

describe('IPFS Transport provider test', () => {
  const providers = []
  const N = 10
  it(`Create ${N} providers`, async () => {
    for (let i = 0; i < N; i++) {
      const provider = await IpfsTransportProvider.create()
      const nodeId = provider.getPeerId()
      expect(nodeId).to.be.a('string')
      log.debug(`Created #${i} provider: ${nodeId}`)
      providers.push(provider)
    }
  })

  it(`Destroy ${N} providers`, async () => {
    for (const provider of providers) {
      await provider.destroy()
    }
  })
})