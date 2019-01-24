This repository contains code that implements request exchange between the bankroller side and the player. 
Note that the solution supports both the distributed mode when bankroller and player are actually separated (e.g., in production environments and the direct mode when no request is actually sent and the whole process takes place in the same environment (e.g. for testing purposes).

Check the [index.ts](https://github.com/DaoCasino/dc-monorepo/blob/development/packages/dc-messaging/src/index.ts) file in this repository. It represents a "road-map" with paths to source code for:
- Room setup ([Interfaces.ts](https://github.com/DaoCasino/dc-monorepo/blob/development/packages/dc-messaging/src/Interfaces.ts)).
- Message exchange with IPFS ([IpfsTransportProvider.ts](https://github.com/DaoCasino/dc-monorepo/blob/development/packages/dc-messaging/src/Ipfs/IpfsTransportProvider.ts)) 
- Direct messaging ([DirectTransportProvider.ts] (https://github.com/DaoCasino/dc-monorepo/blob/development/packages/dc-messaging/src/direct/DirectTransportProvider.ts)) 
- WebSocket messaging 
