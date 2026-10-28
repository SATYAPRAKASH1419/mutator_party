import { SchemaSerializer } from './node_modules/.pnpm/@colyseus+core@0.18.21_@col_d0fa0ef23c62fd03af659c3ba6f99dcf/node_modules/@colyseus/core/build/serializer/SchemaSerializer.mjs';
import { getMessageBytes } from './node_modules/.pnpm/@colyseus+core@0.18.21_@col_d0fa0ef23c62fd03af659c3ba6f99dcf/node_modules/@colyseus/core/build/Protocol.mjs';
import { Protocol } from './node_modules/.pnpm/@colyseus+shared-types@0.18.3/node_modules/@colyseus/shared-types/build/index.mjs';
import { RoomState } from './apps/server/src/rooms/schema.ts';
import { Reflection, Decoder, decode } from './apps/client/node_modules/@colyseus/schema/build/index.mjs';

// 1. Server generates handshake
const serverState = new RoomState();
serverState.roomCode = 'TEST1';
const serializer = new SchemaSerializer();
serializer.reset(serverState);
const handshake = serializer.handshake();
console.log('Handshake byteLength:', handshake.byteLength);

// 2. Server creates JOIN_ROOM frame
const joinRoomFrame = getMessageBytes[Protocol.JOIN_ROOM]('recon_token_123', serializer.id, handshake);
console.log('Join room frame length:', joinRoomFrame.byteLength);

// 3. Client receives frame (simulating colyseus.js)
const bytes = Array.from(new Uint8Array(joinRoomFrame));
let offset = 1;

// utf8Read(bytes, offset) for reconnectionToken
const tokenLen = bytes[offset++];
offset += tokenLen; // skip token

// utf8Read(bytes, offset) for serializerId
const sidLen = bytes[offset++];
offset += sidLen; // skip 'schema'

console.log('offset before handshake:', offset);

// 4. SchemaSerializerV5 handshake
const it = { offset };
const uint8 = new Uint8Array(bytes);
const handshakeLen = decode.number(uint8, it);
console.log('Decoded handshakeLen:', handshakeLen);

const handshakeBytes = uint8.subarray(it.offset, it.offset + handshakeLen);
const decoder = Reflection.decode(handshakeBytes, { offset: 0 });
console.log('Reflection.decode SUCCESS! Reflected state class:', decoder.state.constructor.name);
console.log('Initial roomCode on reflected state:', decoder.state.roomCode);

// 5. Test state patch
serverState.roomCode = 'MATCHED!';
serializer.applyPatches([{ raw: () => { }, state: 1 }], serverState);
const patchBytes = serializer.encoder.sharedBuffer.subarray(1, serializer.encoder.offset);
decoder.decode(patchBytes, { offset: 0 });
console.log('Reflected state roomCode after patch:', decoder.state.roomCode);

