# [DC-Messanging](https://github.com/DaoCasino/dc-messaging)

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

Creates a room based on an IPFS pub-sub channel. 
Emits membership events, listens for messages, broadcast and direct messeges to peers.

messaging uses internally [ipfs-js](https://github.com/ipfs/js-ipfs) and [ipfs-pubsub-room](https://github.com/ipfs-shipyard/ipfs-pubsub-room)
This project is part of [dc-dev](https://github.com/DaoCasino/dc-dev) and is used in [DCLib](https://github.com/DaoCasino/DCLib/tree/384c9dd1521cd0386b0ea313bbcdda11e5e74c8a) And [bankroller-core](https://github.com/DaoCasino/bankroller-core/tree/3936c3e8bd235263474d36eb3b5ff5f9e1e89a0b)

### Install
```shell
npm install DaoCasino/dc-messaging --save
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


### Signal server
```
cd ./signal 
npm i 
npm start
```

or 

```
npm run install_signalserver
npm run start_signalserver
```

or 

```
npm i -g libp2p-websocket-star-rendezvous
rendezvous --port=9090 --host=localhost
```
and open http://localhost:9090 in browser, you see signal url aka `s /dns4/localhost/tcp/9090/ws/p2p-websocket-star/`
