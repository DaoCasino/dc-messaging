import Ipfs from "ipfs"
import IpfsRoom from "ipfs-pubsub-room"
import {
  IMessagingProvider,
  RoomInfo,
  RequestMessage,
  ResponseMessage,
  EventMessage
} from "../Interfaces"
import { RemoteProxy, getId } from "../utils/RemoteProxy"
import { createIpfsNode } from "./Ipfs"
import { ServiceWrapper } from "../utils/ServiceWrapper"
import { Logger } from "dc-logging"

interface IpfsTransportProviderOptions {
  waitForPeers: boolean
}
const logger = new Logger("IpfsTransportProvider")
export class IpfsTransportProvider implements IMessagingProvider {
  private static _defaultIpfsNode: Ipfs
  private static _ipfsNodePromise: Promise<Ipfs>
  private _ipfsNode: Ipfs
  private _roomsMap: Map<string, any>
  private _options: IpfsTransportProviderOptions
  peerId: string
  static _ipfsNodes: Ipfs[] = []
  private constructor(ipfsNode: Ipfs, options?: IpfsTransportProviderOptions) {
    this._options = { waitForPeers: true, ...options }
    this._ipfsNode = ipfsNode
    this.peerId = ipfsNode.id
    this._roomsMap = new Map()
  }

  async stop(address): Promise<boolean> {
    const room = this._roomsMap.get(address)
    if (room) {
      await room.leave()
      return true
    }
    return false
  }
  static stop() {
    return Promise.all(
      IpfsTransportProvider._ipfsNodes.map(node => node.stop())
    )
  }
  stopIpfsNode(): Promise<void> {
    return this._ipfsNode.stop()
  }

  async waitForPeer(
    address: any,
    peerId?: string,
    timeout: number = 10000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this._getIpfsRoom(address).once("peer joined", id => {
        if (!peerId || peerId === id) {
          resolve()
        }
      })
      setTimeout(() => {
        reject(new Error("Waiting for peer timed out"))
      }, timeout)
    })
  }
  static _createIpfsNode(): Promise<Ipfs> {
    return createIpfsNode().then(node => {
      IpfsTransportProvider._ipfsNodes.push(node)
      return node
    })
  }
  static async create(): Promise<IpfsTransportProvider> {
    if (!IpfsTransportProvider._defaultIpfsNode) {
      if (IpfsTransportProvider._ipfsNodePromise) {
        IpfsTransportProvider._defaultIpfsNode = await IpfsTransportProvider._ipfsNodePromise
      } else {
        IpfsTransportProvider._ipfsNodePromise = IpfsTransportProvider._createIpfsNode()
        IpfsTransportProvider._defaultIpfsNode = await IpfsTransportProvider._ipfsNodePromise
        IpfsTransportProvider._ipfsNodePromise = null
      }
    }
    return new IpfsTransportProvider(IpfsTransportProvider._defaultIpfsNode)
  }
  static async createAdditional(): Promise<IpfsTransportProvider> {
    const ipfsNode = await IpfsTransportProvider._createIpfsNode()
    return new IpfsTransportProvider(ipfsNode)
  }
  private _getIpfsRoom(address: string, name?: string): any {
    let room = this._roomsMap.get(address)
    if (!room) {
      room = IpfsRoom(this._ipfsNode, address, {})
        .on("error", error => {
          logger.error(error)
        })
        .on("peer joined", id => {
          const roomName = `${name || ""} ${address}`
          logger.debug(
            `Peer joined ${id} to ${this._ipfsNode.id} in room ${roomName}`
          )
        })
      logger.debug(`Room started ${address}`)

      this._roomsMap.set(address, room)
    }
    return room
  }

  async emitRemote(
    address: string,
    peerId: string,
    eventName: string,
    params: any
  ) {
    const room = this._roomsMap.get(address)
    if (!room) {
      throw new Error(`No open room at ${address}`)
    }

    const eventMessage: EventMessage = {
      id: getId(),
      eventName,
      params: [params], // TODO: ???
      from: this.peerId
    }

    try {
      await room.sendTo(peerId, JSON.stringify(eventMessage))
    } catch (error) {
      throw error
    }
  }

  getPeerId() {
    return this.peerId
  }

  getRemoteInterface<TRemoteInterface>(
    address: string,
    roomName?: string
  ): Promise<TRemoteInterface> {
    const ipfsRoom = this._getIpfsRoom(
      address,
      `Remote interface ${roomName || ""}`
    )

    const proxy = new RemoteProxy()
    const self = this
    ipfsRoom.on("message", message => {
      if (message.from !== self._ipfsNode.id) {
        proxy.onMessage(JSON.parse(message.data))
      }
    })
    return this.waitForPeer(address).then(() => {
      const proxyInterface: TRemoteInterface = proxy.getProxy(message => {
        ipfsRoom.broadcast(JSON.stringify(message))
      })
      // const res: any = { v: proxyInterface }
      return Promise.resolve(proxyInterface as TRemoteInterface)
    })
  }

  exposeSevice(address: string, service: any, isEventEmitter: boolean = false) {
    const ipfsRoom = this._getIpfsRoom(
      address,
      `Expose service ${(service.constructor && service.constructor.name) ||
        ""}`
    )

    const self = this
    const wrapper = new ServiceWrapper(
      service,
      async response => {
        const { from, eventName } = response as EventMessage
        if (eventName) {
          await ipfsRoom.broadcast(JSON.stringify(response))
        } else {
          if (from !== self._ipfsNode.id) {
            try {
              await ipfsRoom.sendTo(from, JSON.stringify(response))
            } catch (error) {
              throw error
            }
          }
        }
      },
      isEventEmitter
    )
    if (wrapper.serviceIsEventEmitter) {
      ipfsRoom.on("peer joined", id => {
        service.emit("connected", { id, address })
      })
      ipfsRoom.on("peer left", id => {
        service.emit("disconnected", { id, address })
      })
    }
    ipfsRoom.on("message", message => {
      const { from } = message
      if (from !== self._ipfsNode.id) {
        const data = JSON.parse(message.data)
        if (data.method) {
          wrapper.onRequest({ ...data, from })
        }
      }
    })
  }

  async stopService(address: string): Promise<boolean> {
    const leaveRooms = async (roomsAddress: IterableIterator<string>) => {
      let status
      for (const roomAddress of roomsAddress) {
        status = await this.stop(roomAddress)
        if (!status) throw new Error(`Error leave room: ${roomAddress}`)
      }
    }
    await leaveRooms(this._roomsMap.keys())
    this._roomsMap.clear()
    return true
  }
}
