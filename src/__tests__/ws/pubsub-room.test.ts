import WebSocket from 'ws'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import { Room } from '../../ws/pubsub-room'
import { Logger } from '@daocasino/dc-logging'
import { config, TransportType } from "@daocasino/dc-configs"

const log = new Logger('Test:')
const ROOM_NAME = 'room-name'
const NUM_CLIENTS = 10 // нужно четное число

const defaultSwarm = config.default.transportServersSwarm[TransportType.WS]
const WEB_SOCKET_SERVER = defaultSwarm[0] // TODO: need select or balance

function sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }


const createConnection = (address: string): Promise<WebSocket> => {
 return new Promise((resolve, reject) => {
     const ws = new WebSocket(address)
     ws.on('open',() => {
         resolve(ws)
     })
     ws.on('error', error => {
         reject(error)
     })
 })
}

describe('WebSocket client', () => {
    const clientSockets: WebSocket[] = []
    const roomIntefaces: Room[] = []
    const peersInRoom: string[] = []
    it('Create connections', async () => {
        for (let i = 0; i < NUM_CLIENTS; i++) {
            const ws = new WebSocket(WEB_SOCKET_SERVER)
            expect(ws).to.be.an.instanceof(WebSocket)
            clientSockets.push(ws)
        }
    })

    it('Create Room interfaces', async () => {
        for (let i = 0; i < clientSockets.length; i++) {
            const ws = clientSockets[i]
            const room = new Room(ws, ROOM_NAME)

            room.on(Room.EVENT_PEER_JOIN, peer => {
                log.debug(`Client #${i}: Peer joined the room`, peer)
            })

            room.on(Room.EVENT_PEER_LEFT, peer => {
                log.debug(`Client #${i}: Peer left...`, peer)
            })

            // now started to listen to room
            room.on(Room.EVENT_SUBSCRIBED, () => {
                log.debug(`Client #${i}: Now connected!`)
            })

            roomIntefaces.push(room)
            peersInRoom.push(await room.getPeerId())
        }
    })

    it('SendTo messages', async () => {
        for(let i = 0; i < roomIntefaces.length ; i = i + 2) {
            const client1 = roomIntefaces[i]
            const client2 = roomIntefaces[i + 1]
            const _message = 'privet'

            client2.once('message', message => {
                console.log(`Client #${i} say ${message.data} to client #${ i + 1 }`)
                expect(message.data).to.be.equal(_message)
            })

            const peer = await client2.getPeerId()
            const status = await client1.sendTo(peer, _message)
            /* tslint:disable-next-line  */
            expect(status).to.be.true
        }
    })

    it('Test set many onMessage listeners', async () => {
        for(let i = 0; i < roomIntefaces.length ; i = i + 2) {
            const client1 = roomIntefaces[i]
            const client2 = roomIntefaces[i + 1]
            const _message = 'privet'

            client2.once('message', message => {
                console.log(`Client #${i} say ${message.data} to client #${ i + 1 } - first listener`)
                expect(message.data).to.be.equal(_message)
            })

            client2.once('message', message => {
                console.log(`Client #${i} say ${message.data} to client #${ i + 1 } - second listener`)
                expect(message.data).to.be.equal(_message)
            })

            const peer = await client2.getPeerId()
            const status = await client1.sendTo(peer, _message)
            /* tslint:disable-next-line  */
            expect(status).to.be.true
        }
    })

    it('Get peers in room', async () => {
        for(let i = 0; i < roomIntefaces.length; i++) {
            const room = roomIntefaces[i]
            const peers = await room.getPeers()
            expect(peers).to.deep.equal(peersInRoom)
        }
    })

    it('Has peer in room', async() => {
        for(let i = 0; i < roomIntefaces.length ; i = i + 2) {
            const client1 = roomIntefaces[i]
            const client2 = roomIntefaces[i + 1]

            const status = await client1.hasPeer(await client2.getPeerId())
            /* tslint:disable-next-line  */
            expect(status).to.be.true
        }
    })

    it('Broadcast message', async () => {
        let countMessages = 1
        const messageBroadcast = 'broadcast'
        const src = roomIntefaces[0]
        for (let i = 1; i < roomIntefaces.length; i++) {
            const dest = roomIntefaces[i]
            dest.once('message', message => {
                if (messageBroadcast === message.data) {
                    countMessages++
                }
            })
        }
        const status = await src.broadcast(messageBroadcast)
        /* tslint:disable-next-line  */
        expect(status).to.be.true
        expect(countMessages).to.be.equal(roomIntefaces.length)
    })

    it('Leave rooms', async () => {
        // await sleep(2000)
        for (let i = 0; i < roomIntefaces.length; i++) {
            const room = roomIntefaces[i]
            const status = await room.leave()
            /* tslint:disable-next-line  */
            expect(status).to.be.true
        }
    })

    it('Close connections', () => {
        for (let i = 0; i < clientSockets.length; i++) {
            const ws = clientSockets[i]
            if (ws.readyState === WebSocket.OPEN) {
                ws.close()
            } else {
                ws.on('open', () => {
                    ws.close()
                })
            }
        }
    })
})
