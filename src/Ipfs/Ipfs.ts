import Ipfs from "ipfs";
import { getRepoPath } from "./Utils";

let Swarm = [
  "/dns4/signal2.dao.casino/tcp/443/wss/p2p-websocket-star/",
  "/dns4/signal1.dao.casino/tcp/443/wss/p2p-websocket-star/",

  "/dns4/signal3.dao.casino/tcp/443/wss/p2p-websocket-star/"
];

export function createIpfsNode(yourSwarm = []): Promise<Ipfs> {
  if (yourSwarm) {
    Array.isArray(yourSwarm) ? Swarm.push(...yourSwarm) : Swarm.push(yourSwarm);
  }

  return new Promise((resolve, reject) => {
    const errors = [];
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
          ipfs.id = info.id;
          resolve(ipfs);
        });
      })
      .on("error", error => {
        errors.push(error);
        reject(error);
      });
  });
}
