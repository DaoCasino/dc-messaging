import Ipfs from "ipfs"
import { getRepoPath } from "./Utils"
import { Logger } from "dc-logging"

const defaultSwarm = [
  "/dns4/signal2.dao.casino/tcp/443/wss/p2p-websocket-star/",
  "/dns4/signal1.dao.casino/tcp/443/wss/p2p-websocket-star/",

  "/dns4/signal3.dao.casino/tcp/443/wss/p2p-websocket-star/"
]
const logger = new Logger("createIpfsNode")
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
      .on("start", () => {
        const id = ipfs.id().then(info => {
          ipfs.id = info.id
          resolve(ipfs)
        })
      })
      .on("error", error => {
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
