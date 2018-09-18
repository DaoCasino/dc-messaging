import { ResponseMessage, RequestMessage } from "../Interfaces";

let _id = 0;
export const getId = () => {
  return Date.now() * 1000000 + _id++;
};

export class RemoteProxy {
  _requestCallbacks: Map<
    number,
    { resolve: (data: any) => void; reject: (error: string) => void }
  >;

  constructor() {
    this._requestCallbacks = new Map();
    this.onRequestResponse = this.onRequestResponse.bind(this);
  }

  getProxy<TRemoteInterface>(
    sendRequest: (request: RequestMessage) => void,
    timeout: number = 10000
  ): TRemoteInterface {
    const self = this;
    const proxy: any = new Proxy(
      {},
      {
        get: (target, prop: string) => {
          if (prop === "then") return null;
          if (!prop.startsWith("_")) {
            return async (...params): Promise<any> => {
              const id = getId();
              sendRequest({ method: prop, params, id });
              const promise = new Promise((resolve, reject) => {
                self._requestCallbacks.set(id, { resolve, reject });
                setTimeout(
                  () => reject(new Error("Request timed out")),
                  timeout
                );
              });
              return promise;
            };
          } else {
            return params => {
              throw new Error("Cannot call private function");
            };
          }
        }
      }
    );
    return proxy as TRemoteInterface;
  }
  onRequestResponse(message: ResponseMessage) {
    const { id } = message;
    const callback = this._requestCallbacks.get(id);
    if (callback) {
      if (message.error) {
        callback.reject(message.error);
      } else {
        callback.resolve(message.result);
      }
      this._requestCallbacks.delete(id);
    }
  }
}
