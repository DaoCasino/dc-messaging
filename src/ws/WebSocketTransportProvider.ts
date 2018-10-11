import { RoomInfo } from '../Interfaces';
import ws from 'ws';
import { RemoteProxy, getId } from '../utils/RemoteProxy';
import { ServiceWrapper } from '../utils/ServiceWrapper';

export class WebsocketTransportProvider {
  private _wsMap: Map<string, any>;
  peerId: string;
  private _wsStartPromise;
  private constructor() {
    this._wsMap = new Map();
  }
  private _getClient(address: string): any {
    let client = this._wsMap.get(address);
    if (!client) {
      client = ws.Client(address, {});
      client.this._wsMap.set(address, client);
    }
    return client;
  }
  private _getServer(address: string): any {
    let client = this._wsMap.get(address);
    if (!client) {
      client = ws.Server(address, {});
      client.this._wsMap.set(address, client);
    }
    return client;
  }

  getRemoteInterface<TRemoteInterface>(
    address: string,
    roomInfo?: RoomInfo
  ): Promise<TRemoteInterface> {
    const client = new ws.Client(address);

    const proxy = new RemoteProxy();
    const self = this;
    client.on('message', message => {
      proxy.onMessage(JSON.parse(message));
    });
    return Promise.resolve(
      proxy.getProxy(message => client.send(JSON.stringify(message)))
    );
  }

  exposeSevice(address: string, service: any, isEventEmitter: boolean = false) {
    const server = this._getServer(address);

    // todo - that's bullshit
    const wrapper = new ServiceWrapper(
      service,
      async response => {
        try {
          const { from } = response;
          await server.send(from, JSON.stringify(response));
        } catch (error) {
          throw error;
        }
      },
      isEventEmitter
    );
    server.on('message', message => {
      const { from } = message;
      wrapper.onRequest({ ...JSON.parse(message.data), from });
    });
  }
}
