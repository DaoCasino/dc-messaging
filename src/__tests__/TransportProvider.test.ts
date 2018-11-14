import { describe, it } from "mocha"
import { expect } from "chai"
import { Logger } from "dc-logging"
import { IMessagingProvider, ITransportProviderFactory } from "../Interfaces"
import { TransportType } from "dc-configs"
import { TransportProviderFactory } from "../TransportProviderFactory"

const log = new Logger("Transport provider")

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

        log.debug(`Test service started at "${address}".`)
    }
    stop(): Promise<boolean> {
        return this._provider.stopService(this._address)
    }
}

const test = (factory: ITransportProviderFactory) => describe(`Transport provider: ${factory.toString()}`, () => {
    it('Create TestService', async () => {
        const ROOM_ADDRESS = 'test'
        const serviceProvider = await factory.create()
        const testService = new TestService()
        testService.start(ROOM_ADDRESS, serviceProvider)

        expect(testService.sum(1, 1)).to.be.equal(2)

        const remoteProvider = await factory.create()
        const remoteTestService = await remoteProvider.getRemoteInterface<ITestService>(ROOM_ADDRESS, "Remote WS TestService interface")

        try {
            const result = await remoteTestService.sum(1, 1)
            expect(result).to.be.equal(2)
        } catch(e) {
            log.error(e)
        }

        testService.stop()
        remoteProvider.destroy()
        serviceProvider.destroy()
    })
})


test(new TransportProviderFactory(TransportType.IPFS))
test(new TransportProviderFactory(TransportType.WS))
test(new TransportProviderFactory(TransportType.DIRECT))