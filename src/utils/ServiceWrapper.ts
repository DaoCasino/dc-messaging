import { ResponseMessage, RequestMessage, EventMessage } from '../Interfaces'
import { Logger } from 'dc-logging'

let _id = 0
export const getId = () => {
  return Date.now() * 1000000 + _id++
}

export class ServiceWrapper<TService> {
  _service: TService
  _responseSuffix: string
  logger: Logger
  sendResponse: (response: ResponseMessage | EventMessage) => void

  constructor(
    service: TService,
    sendResponse: (response: ResponseMessage | EventMessage) => void,
    isEventEmitter: boolean = false
  ) {
    this._service = service
    this.onRequest = this.onRequest.bind(this)
    this.sendResponse = sendResponse.bind(this)
    if (isEventEmitter) {
      this.wrapEventEmitter()
    }
    const loggerName =
      (service.constructor && service.constructor.name) || 'ServiceWrapper'
    this.logger = new Logger(loggerName)
  }
  wrapEventEmitter() {
    const onFunc = (this._service as any).on
    const eventNamesFunc = (this._service as any).eventNames
    if (
      onFunc &&
      eventNamesFunc &&
      typeof onFunc === 'function' &&
      typeof eventNamesFunc === 'function'
    ) {
      const eventNames = eventNamesFunc.call(this._service)
      eventNames.forEach(eventName => {
        onFunc.call(this._service, eventName, (...params) => {
          const eventMessage: EventMessage = {
            id: getId(),
            eventName,
            params,
          }
          this.sendResponse(eventMessage)
        })
      })
    }
  }
  async onRequest(message: RequestMessage): Promise<any> {
    const { method, params, id, from } = message

    const func = this._service[method]
    const response: ResponseMessage = {
      from,
      id,
      error: null,
      result: null
    }
    if (!method) {
      response.error = {
        status: 'ERROR',
        message: 'Method not specified'
      }
    }
    if (method.substring(0, 1) === '_') {
      response.error = {
        status: 'ERROR',
        message: 'Cannot call private function',
      }
    }

    if (typeof func !== 'function') {
      response.error = {
        status: 'ERROR',
        mesage: `No function ${method} in ${this._service.constructor.name}`,
      }
    }
    if (!response.error) {
      try {
        // this.logger.debug(`call method ${method}`);
        response.result = await func.call(this._service, ...params)
      } catch (error) {
        response.error = { status: 'ERROR', message: error.message }
      }
    }
    if (response.error) {
      this.logger.error(response.error)
    }
    this.sendResponse(response)
  }
}
