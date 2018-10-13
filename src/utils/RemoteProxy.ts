import { ResponseMessage, RequestMessage, EventMessage } from "../Interfaces"

let _id = 0
export const getId = () => {
  return Date.now() * 1000000 + _id++
}

export class RemoteProxy {
  _subscriptions: Map<string, Set<any>>
  _requestCallbacks: Map<
    number,
    { resolve: (data: any) => void; reject: (error: string) => void }
  >

  constructor() {
    this._requestCallbacks = new Map()
    this.onMessage = this.onMessage.bind(this)
    this._subscriptions = new Map()
  }

  getProxy<TRemoteInterface>(
    sendRequest: (request: RequestMessage) => void,
    timeout: number = 15000
  ): TRemoteInterface {
    const _self = this
    const proxy: any = new Proxy(
      {},
      {
        get: (target, prop: string) => {
          if (prop === "then") return null
          if (prop === "on") return _self._handleSubscribe.bind(_self)
          if (!prop.startsWith("_")) {
            return async (...params): Promise<any> => {
              const id = getId()
              sendRequest({ method: prop, params, id })
              const promise = new Promise((resolve, reject) => {
                _self._requestCallbacks.set(id, { resolve, reject })
                setTimeout(
                  () => reject(new Error(`Request ${prop} timed out`)),
                  timeout
                )
              })
              return promise
            }
          } else {
            return params => {
              throw new Error("Cannot call private function")
            }
          }
        }
      }
    )
    return proxy as TRemoteInterface
  }
  private _handleSubscribe(...params: any[]) {
    const [eventName, callback] = params
    if (typeof eventName === "string" && typeof callback === "function") {
      let subscriptions = this._subscriptions.get(eventName)
      if (!subscriptions) {
        subscriptions = new Set()
        this._subscriptions.set(eventName, subscriptions)
      }
      subscriptions.add(callback)
    }
  }
  onMessage(message: ResponseMessage | EventMessage) {
    const eventMessage = message as EventMessage
    if (eventMessage.eventName) {
      this._onEventMessage(eventMessage)
      return
    }
    const responseMessage = message as ResponseMessage
    if (responseMessage.result || responseMessage.error) {
      this._onRequestResponse(responseMessage)
    }
  }
  _onEventMessage(message: EventMessage) {
    const { id, eventName, params } = message
    const callbacks = this._subscriptions.get(eventName)
    if (callbacks) {
      callbacks.forEach(callback => callback(...params))
    }
  }
  _onRequestResponse(message: ResponseMessage) {
    const { id, result, error } = message

    const callback = this._requestCallbacks.get(id)
    if (callback) {
      this._requestCallbacks.delete(id)
      if (error) {
        callback.reject(error)
      } else {
        callback.resolve(result)
      }
    }
  }
}
