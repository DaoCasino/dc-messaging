import Rtc from '../rtc.js'

console.log('')
console.log('Ping pong start')
console.log('')
console.log('')

const Room = new Rtc()


let pingInterval = setInterval(() => {
  Room.sendMsg({action: 'ping'})
}, 3333)

let pingCnt = 0
let pongCnt = 0

Room.on('action::ping', data => {
  pingCnt++
  console.log('Ping ' + pingCnt + ' ' + data.user_id)
  setTimeout(() => {
    Room.sendMsg({action: 'pong'})
  }, 555)
})

Room.on('action::pong', data => {
  clearInterval(pingInterval)
  pongCnt++
  console.log('Pong '+ pongCnt + ' ' + data.user_id)
  setTimeout(() => {
    Room.sendMsg({action: 'ping'})
  }, 777)
})


