import random         from 'random-object-generator'
import web3Acc        from 'web3-eth-accounts'
import * as messaging from '../../rtc.js'

messaging.upIPFS('/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star')

const Acc           = new web3Acc()
const account       = Acc.create()
const allow_address = [account.address]
const SharedRoom    = new messaging.RTC(account.address, 'TestRoom')

function testObject () {
  this.id            = 'id'
  this.number        = 'int'
  this.description   = 'string'
  this.anotherObject = [new anotherTestObject()]
  this.intArray      = ['int']
}

function anotherTestObject () {
  this.testId = 'id'
}

SharedRoom.on('action::getAddress', data => {
  allow_address.push(data.address)
  console.log('peer2', allow_address)
  SharedRoom.sendMsg({action: 'getAddress', address :account.address})
  
  const Room = new messaging.RTC(account.address, 'GameRoom', {
    privateKey    : account.privateKey,
    allowed_users : allow_address
  })

  Room.on('action::ping', data => {
    console.log(1)
    console.log(data.message)
    setTimeout(() => {
      Room.sendMsg({action: 'ping', message:random.randomObject(new testObject())})
    }, 777)
  })
})
