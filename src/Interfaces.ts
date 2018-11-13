type UserId = string

interface RoomInfo {
  privateKey: string
  allowedUsers: UserId[]
}
interface RequestMessage {
  from?: string
  method: string
  params: any[]
  id: number
}
interface EventMessage {
  from?: string
  eventName: string
  params: any
  id: number
}

interface ResponseMessage {
  from?: string
  result: any
  error: any
  id: number
}

interface IMessagingProvider {
  getRemoteInterface: <TRemoteInterface>(
    address: string,
    roomName?: string
  ) => Promise<TRemoteInterface>
  exposeSevice: (address: string, service: any, isEventEmitter: boolean) => void
  stopService: (adress: string) => Promise<boolean>
  // create: () => Promise<IMessagingProvider>
  destroy: () => void
}

export enum TransportType {
  IPFS = 1,
  WS,
  DIRECT
}

export interface ITransportProviderFactory {
  create: () => Promise<IMessagingProvider>
  setType: (type: TransportType) => void
  getType: () => TransportType
  toString: () => string
}

export {
  IMessagingProvider,
  ResponseMessage,
  RequestMessage,
  RoomInfo,
  EventMessage,
}
