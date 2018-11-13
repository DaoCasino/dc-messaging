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
    gServices.clear()
  }
}