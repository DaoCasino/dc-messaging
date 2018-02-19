# [DC-Messanging](https://github.com/DaoCasino/dc-messaging)

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

Creates a room based on an IPFS pub-sub channel. 
Emits membership events, listens for messages, broadcast and direct messeges to peers.

### Install
```shell
npm install daocasino/dc-messanging
```
### Usage
```js
  import RTC from 'dc-messanging'
  
  const room = new RTC(address, room_name)
  room.sendMsg(msg)
```
### Api
```js
// listening for an event
room.on(event, callback)

// Listen to the event only once
room.once(event, callback)

// stop listening to an event
romm.off(event, callback)

// subscribe to events
room.subscribe(address, callback)

// unsubscribe to events
room.unsubscribe(address, callback)

// Sending message in all room users
room.sendMsg(data)
```
