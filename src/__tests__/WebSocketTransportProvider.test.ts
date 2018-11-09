import { describe, it } from "mocha"
import { expect } from "chai"
import { Logger } from "dc-logging"
import { WebSocketTransportProvider } from "../ws/WebSocketTransportProvider"
import { IMessagingProvider } from "../Interfaces"
import { EventEmitter } from "events"

interface ITestService {
    sum: (a:number, b:number) => number
}

class TestService extends EventEmitter implements ITestService {
    private _provider: IMessagingProvider
    private _address: string
    sum(a: number, b: number) {
        return a + b
    }
    start(address: string, provider: IMessagingProvider) {
        this._provider = provider
        this._address = address
        provider.exposeSevice(address, this, true)

        console.log(`Test service started at "${address}".`)
    }
    stop(): Promise<boolean> {
        return this._provider.stopService(this._address)
    }
}

const log = new Logger("Test WebSocket transport provider")

describe('WebSocket Transport provider test', () => {
    const providers = []
    const N = 10
    it(`Create ${N} providers`, async () => {
        for (let i = 0; i < N; i++) {
            const provider = await WebSocketTransportProvider.create()
            providers.push(provider)
        }
    })

    it(`Destroy ${N} providers`, async () => {
        for(const provider of providers) {
            await provider.destroy()
        }
    })

    it('Create TestService', async () => {
        const ROOM_ADDRESS = 'test'
        const serviceProvider = await WebSocketTransportProvider.create()
        const testService = new TestService()
        testService.start(ROOM_ADDRESS, serviceProvider)

        expect(testService.sum(1, 1)).to.be.equal(2)

        const remoteProvider = await WebSocketTransportProvider.create()
        const remoteTestService = await remoteProvider.getRemoteInterface<ITestService>(ROOM_ADDRESS, "Remote TestService interface")

        console.log(remoteTestService)
        // expect(remoteTestService.sum(1, 1)).to.be.equal(2)

        // testService.stop()
    })
})