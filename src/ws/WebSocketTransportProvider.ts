// import { RoomInfo } from '../Interfaces'
// import ws from 'ws'
// import { RemoteProxy, getId } from '../utils/RemoteProxy'
// import { ServiceWrapper } from '../utils/ServiceWrapper'

// export class WebSocketTransportProvider {
//   private _wsMap: Map<string, any>
//   peerId: string
//   private _wsStartPromise
//   private constructor() {
//     this._wsMap = new Map()
//   }

//   static async create(): Promise<WebSocketTransportProvider> {
//     // const ipfsNode = await createIpfsNode()
//     return new WebSocketTransportProvider()
//   }

//   private _getClient(address: string): any {
//     let client = this._wsMap.get(address)
//     if (!client) {
//       client = ws.Client(address, {})
//       client.this._wsMap.set(address, client)
//     }
//     return client
//   }
//   private _getServer(address: string): any {
//     let client = this._wsMap.get(address)
//     if (!client) {
//       client = ws.Server(address, {})
//       client.this._wsMap.set(address, client)
//     }
//     return client
//   }

//   getRemoteInterface<TRemoteInterface>(
//     address: string,
//     roomInfo?: RoomInfo
//   ): Promise<TRemoteInterface> {
//     const client = new ws.Client(address)

//     const proxy = new RemoteProxy()
//     const self = this
//     client.on('message', message => {
//       proxy.onMessage(JSON.parse(message))
//     })
//     return Promise.resolve(
//       proxy.getProxy(message => client.send(JSON.stringify(message)))
//     )
//   }

//   exposeSevice(address: string, service: any, isEventEmitter: boolean = false) {
//     const server = this._getServer(address)

//     // todo - that's bullshit
//     const wrapper = new ServiceWrapper(
//       service,
//       async response => {
//         try {
//           const { from } = response
//           await server.send(from, JSON.stringify(response))
//         } catch (error) {
//           throw error
//         }
//       },
//       isEventEmitter
//     )
//     server.on('message', message => {
//       const { from } = message
//       wrapper.onRequest({ ...JSON.parse(message.data), from })
//     })
//   }
// }


import WebSocket from 'ws'
import { Room } from 'dao-websocket-server' // TODO: исправить
import {
  IMessagingProvider,
  EventMessage
} from "../Interfaces"
import { RemoteProxy, getId } from "../utils/RemoteProxy"
import { ServiceWrapper } from "../utils/ServiceWrapper"
import { Logger } from "dc-logging"

const logger = new Logger("WebSocketTransportProvider")

interface WebSocketTransportProviderOptions {
  waitForPeers: boolean
}

const DEFAULT_PEER_TIMEOUT = 20000
const WEB_SOCKET_SERVER = `ws://localhost:8888`

const randomString = () =>
  Math.random()
    .toString(36)
    .substring(2, 15) +
  Math.random()
    .toString(36)
    .substring(2, 15)

export class WebSocketTransportProvider implements IMessagingProvider {
  private _ws: WebSocket
  private _roomsMap: Map<string, any>
  private _options: WebSocketTransportProviderOptions
  private constructor(ws: WebSocket, options?: WebSocketTransportProviderOptions) {
    this._options = { waitForPeers: true, ...options }
    this._ws = ws
    this._roomsMap = new Map()
  }

  private async _leaveRoom(address): Promise<boolean> {
    const room = this._roomsMap.get(address)
    if (room) {
      await room.leave()
      this._roomsMap.delete(address)
      return true
    }
    return false
  }

  private async _leaveRooms() {
    for (const room of this._roomsMap.values()) {
      await room.leave()
    }
    this._roomsMap.clear()
  }

  async waitForPeer(
    address: any,
    peerId?: string,
    timeout: number = DEFAULT_PEER_TIMEOUT
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const room = this._getWebSocketRoom(address)
      room.once("peer joined", id => {
        console.log({ address, room })
        if (!peerId || peerId === id) {
          resolve()
        }
      })
      setTimeout(() => {
        reject(new Error("Waiting for peer timed out"))
      }, timeout)
    })
  }

  static async create(): Promise<WebSocketTransportProvider> {
    const ws = new WebSocket(WEB_SOCKET_SERVER)
    return Promise.resolve(new WebSocketTransportProvider(ws))
  }

  async destroy() {
    await this._leaveRooms()
    if (this._ws.readyState === WebSocket.OPEN) {
      this._ws.close()
      this._ws = null
    } else {
        this._ws.on('open', () => {
            this._ws.close()
            this._ws = null
        })
    }
  }

  private _getWebSocketRoom(address: string, name?: string): any {
    let room = this._roomsMap.get(address)
    if (!room) {
      room = new Room(this._ws, address)
        .on("error", error => {
          logger.error(error)
        })
        .on("peer joined", async id => {
          const roomName = `${name || ""} ${address}`
          const myPeerId = await room.getPeerId()
          logger.debug(
            `Peer joined ${id} to ${myPeerId} in room ${roomName}`
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

    const from = await room.getPeerId()

    const eventMessage: EventMessage = {
      id: getId(),
      eventName,
      params: [params], // TODO: ???
      from
    }

    try {
      await room.sendTo(peerId, JSON.stringify(eventMessage))
    } catch (error) {
      throw error
    }
  }

  getRemoteInterface<TRemoteInterface>(
    address: string,
    roomName?: string
  ): Promise<TRemoteInterface> {
    const webSocketRoom = this._getWebSocketRoom(
      address,
      `Remote interface ${roomName || ""}`
    )

    const proxy = new RemoteProxy()
    const self = this
    webSocketRoom.on("message", async message => {
      const peerId = await webSocketRoom.getPeerId()

      if (message.from !== peerId) {
        proxy.onMessage(JSON.parse(message.data))
      }
    })
    // return this.waitForPeer(address).then(() => {
      const proxyInterface: TRemoteInterface = proxy.getProxy(message => {
        webSocketRoom.broadcast(JSON.stringify(message))
      })
      console.log(proxyInterface)
      // const res: any = { v: proxyInterface }
      return Promise.resolve(proxyInterface as TRemoteInterface)
    // })
  }

  exposeSevice(address: string, service: any, isEventEmitter: boolean = false) {
    const webSocketRoom = this._getWebSocketRoom(
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
          await webSocketRoom.broadcast(JSON.stringify(response))
        } else {
          const peerId = await webSocketRoom.getPeerId()
          if (from !== peerId) {
            try {
              await webSocketRoom.sendTo(from, JSON.stringify(response))
            } catch (error) {
              throw error
            }
          }
        }
      },
      isEventEmitter
    )
    if (wrapper.serviceIsEventEmitter) {
      webSocketRoom.on("peer joined", id => {
        service.emit("connected", { id, address })
      })
      webSocketRoom.on("peer left", id => {
        service.emit("disconnected", { id, address })
      })
    }
    webSocketRoom.on("message", async message => {
      const { from } = message
      const peerId = await webSocketRoom.getPeerId()
      if (from !== peerId) {
        const data = JSON.parse(message.data)
        if (data.method) {
          wrapper.onRequest({ ...data, from })
        }
      }
    })
  }

  async stopService(address: string): Promise<boolean> {
    return this._leaveRoom(address)
  }
}
