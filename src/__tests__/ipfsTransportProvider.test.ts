import { describe, it } from "mocha"
import { expect } from "chai"
import { Logger } from "dc-logging"
import { EventEmitter } from "events"
import { IpfsTransportProvider } from "../Ipfs/IpfsTransportProvider"

describe('IPFS Transport provider test', () => {
    const providers: IpfsTransportProvider[]
    const N = 10
    it(`Create ${N} providers`, async () => {
        const provider = await IpfsTransportProvider.create()
        providers.push(provider)
    })
})