import Rtc from '../rtc.js'

console.log('')
console.log('Ping pong start')
console.log('')
console.log('')

const Room = new Rtc()

setInterval(() => {
  // console.log('send ping')
  Room.sendMsg({action: 'ping'})
}, 3333)

Room.on('all', data => {
  console.log(data)
  Room.sendMsg({action: 'pong'})
})

Room.on('pong', data => {
  console.log(data)
})
