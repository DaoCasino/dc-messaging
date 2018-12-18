import { IMessagingProvider } from "../Interfaces"

const gServices: Map<string, any> = new Map()

export class DirectTransportProvider implements IMessagingProvider {
  getRemoteInterface<TRemoteInterface>(
    address: string
  ): Promise<TRemoteInterface> {
    const service = gServices.get(address)
    if (!service) throw new Error(`No service registered at address ${address}`)
    return Promise.resolve(service as TRemoteInterface)
  }
  exposeSevice(address: string, service: any, isEventEmitter: boolean = true) {
    gServices.set(address, service)
  }

  stopService(address: string): Promise<boolean> {
      const status = gServices.delete(address)
      return Promise.resolve(status)
  }

  static create() {
    return Promise.resolve(new DirectTransportProvider())
  }
  destroy() {
    return Promise.resolve(gServices.clear())
  }

  async emitRemote(
    address: string,
    peerId: string,
    eventName: string,
    params: any
  ) {
    // const room = this._roomsMap.get(address)
    // if (!room) {
    //   throw new Error(`No open room at ${address}`)
    // }

    // const eventMessage: EventMessage = {
    //   id: getId(),
    //   eventName,
    //   params: [params], // TODO: ???
    //   from: this.peerId
    // }

    // try {
    //   await room.sendTo(peerId, JSON.stringify(eventMessage))
    // } catch (error) {
    //   throw error
    // }
  }
}