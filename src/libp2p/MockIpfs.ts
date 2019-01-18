import MockIpfs from '@daocasino/mock-ipfs'
import { Logger } from '@daocasino/dc-logging'
import { config, TransportType } from '@daocasino/dc-configs'

const defaultSwarm = config.default.transportServersSwarm[TransportType.LIBP2P]

const logger = new Logger('createMockIpfsNode')

export function createMockIpfsNode(
  Swarm: string[] = defaultSwarm,
  attempt: number = 0
): Promise<MockIpfs> {
  const promise = new Promise((resolve, reject) => {
    const errors = []
    const ipfs = new MockIpfs(Swarm, {
      config: {
        EXPERIMENTAL: {
          pubsub: true
        }
      }
    })
      .on('start', () => {
        const id = ipfs.id().then(info => {
          ipfs.id = info.id
          resolve(ipfs)
        })
      })
      .on('error', error => {
        errors.push(error)
        reject(error)
      })
  })
  return promise.catch(error => {
    if (attempt >= Swarm.length - 1) {
      logger.info(`All signal server in swarm raised errors`)
      throw error
    }
    logger.warn(`Error creating libp2p node, swarm top ${Swarm[0]}`)
    logger.warn(error)
    Swarm.push(Swarm.shift())
    logger.info(`Trying to create libp2p node with swarm top ${Swarm[0]}`)
    return createMockIpfsNode(Swarm, attempt + 1)
  })
}

export function destroyMockIpfsNode(mockIpfs: MockIpfs): Promise<void> {
  return new Promise((resolve, reject) => {
    mockIpfs.stop(error => {
      if (error) {
        reject(error)
      }
      resolve()
    })
  })
}
