import { IMessagingProvider, TransportType, ITransportFactory } from "../Interfaces"
import { IpfsTransportProvider } from "../Ipfs/IpfsTransportProvider"
import { WebSocketTransportProvider } from "../ws/WebSocketTransportProvider"
import { DirectTransportProvider } from "../direct/DirectTransportProvider"

export class TransportFactory implements ITransportFactory {
    private _type: TransportType
    constructor(type?: TransportType) {
        if (type) this.setType(type)
    }

    setType(type: TransportType) {
        this._type = type
    }

    toString() {
        return TransportType[this._type]
    }

    getType() {
        return this._type
    }

    create () {
        switch(this._type) {
            case TransportType.IPFS:
                return IpfsTransportProvider.create()
            case TransportType.WS:
                return WebSocketTransportProvider.create()
            case TransportType.DIRECT:
                return DirectTransportProvider.create()
        }
    }
}