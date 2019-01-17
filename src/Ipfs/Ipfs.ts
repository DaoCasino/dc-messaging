import Ipfs from 'ipfs'
import { getRepoPath } from './Utils'
import { Logger } from '@daocasino/dc-logging'
import { config, TransportType } from '@daocasino/dc-configs'

const defaultSwarm = config.default.transportServersSwarm[TransportType.IPFS]

const logger = new Logger('createIpfsNode')

export function createIpfsNode(
  Swarm: string[] = defaultSwarm,
  attempt: number = 0
): Promise<Ipfs> {
  const promise = new Promise((resolve, reject) => {
    const errors = []
    const ipfs = new Ipfs({
      repo: getRepoPath(),
      EXPERIMENTAL: {
        pubsub: true
      },
      config: {
        Addresses: {
          Swarm
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
    logger.warn(`Error creating ipfs node, swarm top ${Swarm[0]}`)
    logger.warn(error)
    Swarm.push(Swarm.shift())
    logger.info(`Trying to create ipfs node with swarm top ${Swarm[0]}`)
    return createIpfsNode(Swarm, attempt + 1)
  })
}

export function destroyIpfsNode(ipfs: Ipfs): Promise<void> {
  return new Promise((resolve, reject) => {
    ipfs.stop(error => {
      if (error) {
        reject(error)
      }
      resolve()
    })
  })
}
