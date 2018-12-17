import WebSocket from 'ws'
import { EventEmitter } from 'events'
import { ResponseMessage, RequestMessage, SendToParams, LeaveRoomParams, StartRoomParams, GetPeersParams, HasPeerParams, BroadcastParams } from './Interfaces'
import { Method } from './Constants'
import { Logger } from '@daocasino/dc-logging'

const log = new Logger('Room:')

export class Room extends EventEmitter {
    public static EVENT_PEER_JOIN: string = 'peer joined'
    public static EVENT_PEER_LEFT: string = 'peer left'
    public static EVENT_SUBSCRIBED: string = 'subscribed'
    public static EVENT_MESSAGE: string = 'message'
    public static EVENT_READY: string = 'ready'

    private _ws: WebSocket
    private _id: number
    // TODO: вопрос хранить ли пиров в комнате в самом сервисе - может просто каждый раз запрашивать сервер?? или просто кешировать
    private _peers
    private _peerId: string
    private _roomName: string
    private _listener: NodeJS.EventEmitter
    constructor(ws:WebSocket, roomName:string, options:object = {}) {
        super()
        this._ws = ws
        this._id = 0
        this._peers = []
        this._roomName = roomName
        this._listener = new EventEmitter

        if (ws.readyState === WebSocket.OPEN) {
            this._start()
        } else {
            ws.on('open', () => {
                this._start()
            })
        }

        ws.on('close', (code, reason) => {
            this.leave()
        })

        ws.on('error', e => {
            this.emit('error', e)
        })
    }

    private _getId() {
        return Date.now() * 1000000 + this._id++
    }

    private _send (request: RequestMessage) {
        const jsonRequest: string = JSON.stringify(request)
        if(this._ws.readyState === WebSocket.OPEN) { // TODO: возможно надо подписаться на событие ON
            this._ws.send(jsonRequest)
        } else {
            this._ws.on('open', () => {
                this._ws.send(jsonRequest)
            })
        }
    }
    /**
     * Это для того что бы нам узнать результат от сервера на конкретный отпрвленный метод
     * результаты пролучаюься через встроенный eventEmmiter которы делает emit на приход сообщений в сокет
     * и только ты решаешь вешать на него какие-то обработчики или нет
     * @param id
     * @param method
     */
    private _recv (id: number, method: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this._listener.once(`${id}:${method}`, ({ result , error }) => {
                if(error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        })
    }

    private async _startRoom() {
        const id = this._getId()
        const params: StartRoomParams = {
            name: this._roomName
        }
        this._send({
            method: Method.START_ROOM,
            params,
            id
        })

        const result = await this._recv(id, Method.START_ROOM)
        // console.log('start-room result', result)
        this._peerId = result
        this._listener.emit(Room.EVENT_READY)
        this.emit(Room.EVENT_SUBSCRIBED)
    }

    private async _start() {
         // console.log('start room')
        // send start room -> return peers in room
        this._ws.on('message', (data:string) => {
            try {
                const response: ResponseMessage = JSON.parse(data)
                const { result } = response
                // console.log(response)

                // вызываем евент что типа приняли это сообщение
                this._listener.emit(`${response.id}:${response.method}`, response)

                switch(response.method) {
                    case Method.PEER_JOIN:
                        this.emit(Room.EVENT_PEER_JOIN, result)
                        break
                    case Method.PEER_LEAVE:
                        this.emit(Room.EVENT_PEER_LEFT, result)
                        break
                    case Method.MESSAGE:
                        this.emit(Room.EVENT_MESSAGE, { from: response.from, data: result })
                        break
                }
            } catch (e) { // TODO: надо обрабатывать
                log.error(e)
                this.emit('error', e)
            }
        })

        this._startRoom()
    }

    broadcast(message: string): Promise<boolean> {
        const id = this._getId()
        const params: BroadcastParams = {
            name: this._roomName,
            message
        }
        this._send({
            method: Method.BROADCAST,
            params,
            id
        })
        return this._recv(id, Method.BROADCAST)
    }

    sendTo(peer: string, message: string): Promise<boolean> {
        const id = this._getId()
        const params: SendToParams = { peer, message }
        this._send({
            method: Method.SEND_TO,
            params,
            id
        })

        // console.log('method send-to')

        return this._recv(id, Method.SEND_TO)
    }

    leave(): Promise<boolean> {
        const id = this._getId()
        const params: LeaveRoomParams = {
            name: this._roomName
        }
        this._send({
            method: Method.LEAVE_ROOM,
            params,
            id
        })

        return this._recv(id, Method.LEAVE_ROOM)
    }

    getPeers(): Promise<string[]> {
        const id = this._getId()
        const params: GetPeersParams = {
            name: this._roomName
        }
        this._send({
            method: Method.GET_PEERS,
            params,
            id
        })

        return this._recv(id, Method.GET_PEERS)
    }

    hasPeer(peer: string): Promise<boolean> {
        const id = this._getId()
        const params: HasPeerParams = {
            name: this._roomName,
            peer
        }

        this._send({
            method: Method.HAS_PEER,
            params,
            id
        })

        return this._recv(id, Method.HAS_PEER)
    }

    getPeerId(): Promise<string> {
        return new Promise((resolve, reject) => {
            if(this._peerId) {
                resolve(this._peerId)
            }
            else {
                this._listener.once(Room.EVENT_READY, () => {
                    resolve(this._peerId)
                })
            }
        })
    }
}
