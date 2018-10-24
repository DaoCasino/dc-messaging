import { IpfsTransportProvider, createIpfsNode } from "../index"

import IpfsRoom from "ipfs-pubsub-room"
import { Logger } from "dc-logging"

const room12 =
  "02a360faf69c98cbb776ee848ab7e539b0c1266689b6d84366465dab5dc1cc29"
const logger = new Logger("tests")
interface IService1 {
  Method1: ({ count: number, name: string }, param2: number) => { result: any }
}
interface IService2 {
  Method2: ({ count: number, name: string }, param2: number) => { result: any }
  method3: () => string
}

class IService1Impl implements IService1 {
  plus: number
  constructor() {
    this.plus = 2
  }
  Method1(
    param1: { count: number; name: string },
    param2: number
  ): { result: any } {
    logger.debug("serv" + param1.name)

    return { result: param1.count + this.plus + param2 }
  }
}

class IService2Impl implements IService2 {
  plus: number
  constructor() {
    this.plus = 2
  }
  method3() {
    return "m3"
  }
  Method2(
    params: { count: number; name: string },
    param2: number
  ): { result: any } {
    logger.debug("serv2" + params.name)

    return { result: params.count + this.plus + param2 }
  }
}
const testRawIpfs = async () => {
  const node1 = await createIpfsNode()
  const node2 = await createIpfsNode()

  const room2 = IpfsRoom(node2, room12, {})

  const room1 = IpfsRoom(node1, room12, {})
    .on("error", error => {
      logger.error(error)
    })
    .on("peer joined", id => {
      logger.debug(`peer joined ${id} to ${node1.id}`)
      room2.sendTo(node1.id, "hi from room2")
    })
    .on("message", msg => {
      logger.debug(msg.data.toString())
    })

  room2.on("error", error => {
    logger.error(error)
  })
  room1.broadcast("hi from room 1")
}
const test = async () => {
  const roomProvider1 = await IpfsTransportProvider.create()
  const roomProvider2 = await IpfsTransportProvider.create()
  // const peerWaitPromise = roomProvider1.waitForPeer(
  //   roomProvider2.peerId,
  //   room12
  // )
  // const serv1: IService1 = roomProvider2.getRemoteInterface<IService1>(room12)
  roomProvider2.exposeSevice(room12, new IService2Impl())
  const promise = roomProvider1.getRemoteInterface<IService2>(room12)
  const serv2: any = await promise

  // await new Promise(resolve => setTimeout(resolve, 10000))
  logger.debug("sdjfl")
  const res1 = await serv2.Method2({ count: 1, name: "call serv 2" }, 30)
  logger.debug(res1)
  const res2 = await serv2.method3()
  logger.debug(res2)

  roomProvider2.stopService(room12)
  roomProvider2.destroy()
  roomProvider1.destroy()
}

test()
