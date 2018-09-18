type UserId = string;

interface RoomInfo {
  privateKey: string;
  allowedUsers: UserId[];
}
interface RequestMessage {
  from?: string;
  method: string;
  params: any[];
  id: number;
}
interface ResponseMessage {
  from?: string;
  result: any;
  error: any;
  id: number;
}

interface ISharedRoom {
  onConnect: (dappId: string, callback: (data: any) => void) => void;
  bankrollerActive(params: {
    deposit: number;
    dapp: { slug: string; hash: string };
  });
}
interface IMessagingProvider {
  getSharedRoom: (
    gameId: string,
    onConnect: (data: any) => void
  ) => ISharedRoom;
  getRemoteInterface: <TRemoteInterface>(
    address: string
  ) => Promise<TRemoteInterface>;
  exposeSevice: (address: string, service: any) => void;
}
export {
  IMessagingProvider,
  ISharedRoom,
  ResponseMessage,
  RequestMessage,
  RoomInfo
};
