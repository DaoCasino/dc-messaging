import { describe, it } from "mocha"
import { expect } from "chai"
import { Logger } from "dc-logging"
import { WebSocketTransportProvider } from "../ws/WebSocketTransportProvider"
import { IpfsTransportProvider } from "../Ipfs/IpfsTransportProvider"
import { IMessagingProvider } from "../Interfaces"
import { EventEmitter } from "events"

interface ITestService {
    sum: (a:number, b:number) => number
}

class TestService implements ITestService {
    private _provider: IMessagingProvider
    private _address: string
    sum(a: number, b: number) {
        return a + b
    }
    start(address: string, provider: IMessagingProvider) {
        this._provider = provider
        this._address = address
        provider.exposeSevice(address, this, false)

        console.log(`Test service started at "${address}".`)
    }
    stop(): Promise<boolean> {
        return this._provider.stopService(this._address)
    }
}

const log = new Logger("Transport provider")


// describe('IPFS Transport provider test', () => {
//     it('Create TestService', async () => {
//         const ROOM_ADDRESS = 'test'
//         const serviceProvider = await IpfsTransportProvider.create()
//         const testService = new TestService()
//         testService.start(ROOM_ADDRESS, serviceProvider)

//         expect(testService.sum(1, 1)).to.be.equal(2)

//         const remoteProvider = await IpfsTransportProvider.create()
//         const remoteTestService = await remoteProvider.getRemoteInterface<ITestService>(ROOM_ADDRESS, "Remote IPFS TestService interface")

//         const result = await remoteTestService.sum(1, 1)
//         // console.log(remoteTestService)
//         expect(result).to.be.equal(2)

//         testService.stop()
//         remoteProvider.destroy()
//         serviceProvider.destroy()
//     })
// })

describe('WebSocket Transport provider test', () => {
    it('Create TestService', async () => {
        const ROOM_ADDRESS = 'test'
        const serviceProvider = await WebSocketTransportProvider.create()
        const testService = new TestService()
        testService.start(ROOM_ADDRESS, serviceProvider)

        expect(testService.sum(1, 1)).to.be.equal(2)

        const remoteProvider = await WebSocketTransportProvider.create()
        const remoteTestService = await remoteProvider.getRemoteInterface<ITestService>(ROOM_ADDRESS, "Remote WS TestService interface")

        // // console.log(remoteTestService)
        const result = await remoteTestService.sum(1, 1)
        console.log({ result })
        expect(result).to.be.equal(2)

        testService.stop()
        remoteProvider.destroy()
        serviceProvider.destroy()
    })
})