import WebSocket from 'ws'
import { Room } from 'dao-websocket-server' // TODO: исправить
import {
  IMessagingProvider,
  EventMessage
} from "../Interfaces"
import { RemoteProxy, getId } from "../utils/RemoteProxy"
import { ServiceWrapper } from "../utils/ServiceWrapper"
import { Logger } from "dc-logging"
import { config, TransportType } from "dc-configs"

const logger = new Logger("WebSocketTransportProvider")

interface WebSocketTransportProviderOptions {
  waitForPeers: boolean
}

const defaultSwarm = config.default.transportServersSwarm[TransportType.WS]

const DEFAULT_PEER_TIMEOUT = 20000
const WEB_SOCKET_SERVER = defaultSwarm[0] // TODO: need select or balance

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
      if(await room.leave() === true) {
        return this._roomsMap.delete(address)
      }
    }
    return false
  }

  private async _leaveRooms() {
    for (const address of this._roomsMap.keys()) {
      await this._leaveRoom(address) // TODO: возможно нужно вставить проверку на статус и выдавать error
    }
  }

  async waitForPeer(
    address: any,
    peerId?: string,
    timeout: number = DEFAULT_PEER_TIMEOUT
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const room = this._getWebSocketRoom(address)
      room.once("peer joined", id => {
        // console.log({ address, room })
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
    return this.waitForPeer(address).then(() => {
      const proxyInterface: TRemoteInterface = proxy.getProxy(message => {
        webSocketRoom.broadcast(JSON.stringify(message))
      })
      // console.log(proxyInterface)
      // const res: any = { v: proxyInterface }
      return Promise.resolve(proxyInterface as TRemoteInterface)
    })
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
