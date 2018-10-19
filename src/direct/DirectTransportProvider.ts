import { IMessagingProvider } from "../Interfaces"

export class DirectTransportProvider implements IMessagingProvider {
  private _services: Map<string, any>
  constructor() {
    this._services = new Map()
  }
  getRemoteInterface<TRemoteInterface>(
    address: string
  ): Promise<TRemoteInterface> {
    const service = this._services.get(address)
    if (!service) throw new Error(`No service registered at address ${address}`)
    return Promise.resolve(service as TRemoteInterface)
  }
  exposeSevice(address: string, service: any, isEventEmitter: boolean = true) {
    this._services.set(address, service)
  }
}
