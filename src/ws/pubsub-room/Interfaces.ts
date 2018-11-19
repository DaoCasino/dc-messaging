// TODO: this copy from dc-websocket-server
import WebSocket from 'ws'

export interface RequestMessage {
    from?: string
    method: string
    params: any
    id: number
}

export interface EventMessage {
    from?: string
    eventName: string
    params: any
    id: number
}

export interface ResponseMessage {
    from?: string
    method: string
    result: any
    error: any
    id: number
}

export interface ServerEmitParams {
    peer: Peer,
    request: RequestMessage
}

export interface Peer {
    id: string,
    socket: WebSocket
}

export interface StartRoomParams {
    name: string
}

export interface LeaveRoomParams {
    name: string
}

export interface SendToParams {
    peer: string,
    message: string
}

export interface GetPeersParams {
    name: string
}

export interface HasPeerParams {
    name: string
    peer: string
}

export interface BroadcastParams {
    name: string
    message: string
}