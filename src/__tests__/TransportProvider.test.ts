import { describe, it } from "mocha"
import { expect } from "chai"
import { Logger } from "@daocasino/dc-logging"
import { IMessagingProvider, ITransportProviderFactory } from "../Interfaces"
import { TransportType } from "@daocasino/dc-configs"
import { TransportProviderFactory } from "../TransportProviderFactory"
import fs from "fs"
import path from "path"

const log = new Logger("Transport provider")

export interface FileUpload {
    files: { fileName: string; fileData: Buffer | string, fileSize?: number }[]
}
interface ITestService {
    sum: (a:number, b:number) => number
    checkFiles: (info: FileUpload) => void
}

class TestService implements ITestService {
    private _provider: IMessagingProvider
    private _address: string
    sum(a: number, b: number) {
        return a + b
    }

    checkFiles (info: FileUpload) {
        const files = readFiles(__dirname)
        // console.log({ remote: info.files, original: files.files })
        expect(info).to.deep.equal(files)
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

const readFiles = (openDir: string): FileUpload => {
    const files = fs.readdirSync(openDir).filter(fileName => {
        const filePath = path.join(openDir, fileName)
        return fs.statSync(filePath).isFile()
    }).map(fileName => {
      const filePath = path.join(openDir, fileName)
      const { size } = fs.statSync(filePath)
      return { fileName, fileData: fs.readFileSync(filePath).toString('base64'), fileSize: size }
    })

    return { files }
}

const test = (factory: ITransportProviderFactory) => describe(`Transport provider: ${factory.toString()}`, () => {
    it('Create TestService', async () => {
        const ROOM_ADDRESS = 'test'
        const serviceProvider = await factory.create()
        const testService = new TestService()
        testService.start(ROOM_ADDRESS, serviceProvider)
        expect(testService.sum(1, 1)).to.be.equal(2)
        const files = readFiles(__dirname)
        testService.checkFiles(files)

        const remoteProvider = await factory.create()
        const remoteTestService = await remoteProvider.getRemoteInterface<ITestService>(ROOM_ADDRESS, "Remote TestService interface")

        try {
            const result = await remoteTestService.sum(1, 1)
            expect(result).to.be.equal(2)
            remoteTestService.checkFiles(files)
        } catch(e) {
            log.error(e)
        }

        testService.stop()
        remoteProvider.destroy()
        serviceProvider.destroy()
    })
})

if(Object.values(TransportType).includes(process.env.DC_TRANSPORT)) {
    test(new TransportProviderFactory(TransportType[process.env.DC_TRANSPORT]))
}
else {
    Object.values(TransportType).forEach(key => {
        if(typeof key === 'number') {
            test(new TransportProviderFactory(key))
        }
    })
}
