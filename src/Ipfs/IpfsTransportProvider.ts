import Ipfs from "ipfs";
import IpfsRoom from "ipfs-pubsub-room";
import {
  IMessagingProvider,
  ISharedRoom,
  RoomInfo,
  RequestMessage,
  ResponseMessage
} from "../Interfaces";
import { RemoteProxy, getId } from "../utils/RemoteProxy";
import { createIpfsNode } from "./Ipfs";
import { ServiceWrapper } from "../utils/ServiceWrapper";

export class IPFSSharedRoom implements ISharedRoom {
  onConnect: (dappId: string, callback: (data: any) => void) => void;
  gameId: string;
  ipfsRoom: any;
  constructor(
    ipfsRoom: any,
    gameId: string,
    onConnect: (dappId: string, callback: (data: any) => void) => void
  ) {
    this.onConnect = onConnect;
    this.ipfsRoom = ipfsRoom;
    this.gameId = gameId;

    ipfsRoom.on("message", message => {
      const { data } = message;
      if (!data || !data.action || data.action === "bankrollerActive") {
        return;
      }
      // User want to connect
      if (data.action === "connect" && data.slug === gameId) {
        onConnect(gameId, data);
      }
    });
  }
  bankrollerActive(params: {
    deposit: number;
    dapp: { slug: string; hash: string };
  }) {
    this.ipfsRoom.broadcast(
      JSON.stringify({
        method: "bankrollerActive",
        params: [params],
        id: getId()
      })
    );
  }
  sendResponse: (message: ResponseMessage) => void;
}
interface IpfsTransportProviderOptions {
  waitForPeers: boolean;
}
export class IpfsTransportProvider implements IMessagingProvider {
  private sharedRoom: IPFSSharedRoom;
  private static _defaultIpfsNode: Ipfs;
  private static _ipfsNodePromise: Promise<Ipfs>;
  private _ipfsNode: Ipfs;
  private _roomsMap: Map<string, any>;
  private _options: IpfsTransportProviderOptions;
  peerId: string;
  private constructor(ipfsNode: Ipfs, options?: IpfsTransportProviderOptions) {
    this._options = { waitForPeers: true, ...options };
    this._ipfsNode = ipfsNode;
    this.peerId = ipfsNode.id;
    this._roomsMap = new Map();
  }

  async stop(address): Promise<boolean> {
    const room = this._roomsMap.get(address);
    if (room) {
      await room.leave();
      return true;
    }
    return false;
  }
  async waitForPeer(
    address: any,
    peerId?: string,
    timeout: number = 10000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this._getIpfsRoom(address).once("peer joined", id => {
        if (!peerId || peerId === id) {
          resolve();
        }
      });
      setTimeout(() => {
        reject(new Error("Waiting for peer timed out"));
      }, timeout);
    });
  }

  static async create(): Promise<IpfsTransportProvider> {
    if (!IpfsTransportProvider._defaultIpfsNode) {
      if (IpfsTransportProvider._ipfsNodePromise) {
        IpfsTransportProvider._defaultIpfsNode = await IpfsTransportProvider._ipfsNodePromise;
      } else {
        IpfsTransportProvider._ipfsNodePromise = createIpfsNode();
        IpfsTransportProvider._defaultIpfsNode = await IpfsTransportProvider._ipfsNodePromise;
        IpfsTransportProvider._ipfsNodePromise = null;
      }
    }
    return new IpfsTransportProvider(IpfsTransportProvider._defaultIpfsNode);
  }
  static async createAdditional(): Promise<IpfsTransportProvider> {
    const ipfsNode = await createIpfsNode();
    return new IpfsTransportProvider(ipfsNode);
  }
  private _getIpfsRoom(address: string): any {
    let room = this._roomsMap.get(address);
    if (!room) {
      room = IpfsRoom(this._ipfsNode, address, {})
        .on("error", error => {
          console.error(error);
        })
        .on("peer joined", id => {
          console.log(`peer joined ${id} to ${this._ipfsNode.id}`);
        });
      console.log(`Room started ${address}`);

      this._roomsMap.set(address, room);
    }
    return room;
  }

  getSharedRoom(gameId: string, onConnect: (data: any) => void): ISharedRoom {
    if (this.sharedRoom) return this.sharedRoom;
    const ipfsRoom = this._getIpfsRoom(gameId);
    this.sharedRoom = new IPFSSharedRoom(ipfsRoom, gameId, onConnect);
    return this.sharedRoom;
  }
  getRemoteInterface<TRemoteInterface>(
    address: string
  ): Promise<TRemoteInterface> {
    const ipfsRoom = this._getIpfsRoom(address);

    const proxy = new RemoteProxy();
    const self = this;
    ipfsRoom.on("message", message => {
      if (message.from !== self._ipfsNode.id)
        proxy.onRequestResponse(JSON.parse(message.data));
    });
    return this.waitForPeer(address).then(() => {
      const proxyInterface: TRemoteInterface = proxy.getProxy(message => {
        ipfsRoom.broadcast(JSON.stringify(message));
      });
      //const res: any = { v: proxyInterface };
      return Promise.resolve(proxyInterface as TRemoteInterface);
    });
  }

  exposeSevice(address: string, service: any) {
    const ipfsRoom = this._getIpfsRoom(address);

    const wrapper = new ServiceWrapper(service, async response => {
      try {
        const { from } = response;
        await ipfsRoom.sendTo(from, JSON.stringify(response));
        console.log("Response sent");
      } catch (error) {
        throw error;
      }
    });
    ipfsRoom.on("message", message => {
      const { from } = message;
      wrapper.onRequest({ ...JSON.parse(message.data), from });
    });
  }
}
