export type UserId = string;

export interface RoomInfo {
  privateKey: string;
  allowedUsers: UserId[];
}
export interface RequestMessage {
  from?: string;
  method: string;
  params: any[];
  id: number;
}
export interface ResponseMessage {
  from?: string;
  result: any;
  error: any;
  id: number;
}

export interface SignedResponse<TResponse> {
  response: TResponse;
  signature: string;
}

export interface ISharedRoom {
  onConnect: (dappId: string, callback: (data: any) => void) => void;
  bankrollerActive(params: {
    deposit: number;
    dapp: { slug: string; hash: string };
  });
}
export interface IMessagingProvider {
  getSharedRoom: (
    gameId: string,
    onConnect: (data: any) => void
  ) => ISharedRoom;
  getRemoteInterface: <TRemoteInterface>(
    address: string,
    roomInfo?: RoomInfo
  ) => TRemoteInterface;
  exposeSevice: (address: string, service: any) => void;
}
