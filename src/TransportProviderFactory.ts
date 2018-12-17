import { IMessagingProvider, ITransportProviderFactory } from "./Interfaces"
import { IpfsTransportProvider } from "./Ipfs/IpfsTransportProvider"
import { WebSocketTransportProvider } from "./ws/WebSocketTransportProvider"
import { DirectTransportProvider } from "./direct/DirectTransportProvider"
import { config, TransportType } from "@daocasino/dc-configs"

export class TransportProviderFactory implements ITransportProviderFactory {
    private _type: TransportType
    constructor(type: TransportType = config.default.transport) {
        // console.log(typeof type)
        if (type) this.setType(type)
    }

    setType(type: TransportType): void {
        this._type = type
    }

    toString(): string {
        return TransportType[this._type]
    }

    getType(): TransportType {
        return this._type
    }

    create (): Promise<IMessagingProvider> {
        switch(this._type) {
            case TransportType.IPFS:
                return IpfsTransportProvider.create()
            case TransportType.WS:
                return WebSocketTransportProvider.create()
            case TransportType.DIRECT:
                return DirectTransportProvider.create()
        }

        throw new Error("Selected type doesn't exists")
    }
}