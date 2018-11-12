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
  // static create: () => IMessagingProvider
  // destroy: () => void
}

export {
  IMessagingProvider,
  ResponseMessage,
  RequestMessage,
  RoomInfo,
  EventMessage,
}
