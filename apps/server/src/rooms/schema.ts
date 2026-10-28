import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") color: string = "";

  // Quantized physics & transforms
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") vx: number = 0;
  @type("number") vy: number = 0;
  @type("number") scale: number = 1.0;
  @type("boolean") facingRight: boolean = true;

  // Combat & health
  @type("uint8") hits: number = 0;
  @type("uint8") lives: number = 0;
  @type("uint16") score: number = 0;
  @type("string") item: string = ""; // 'mega' | 'freeze' | 'swap' | 'shield' | ''

  // Status flags
  @type("boolean") grounded: boolean = false;
  @type("boolean") stunned: boolean = false;
  @type("boolean") frozen: boolean = false;
  @type("boolean") shielded: boolean = false;
  @type("boolean") isOut: boolean = false;

  // Room & Netcode
  @type("boolean") connected: boolean = true;
  @type("boolean") isBot: boolean = false;
  @type("boolean") ready: boolean = false;
  @type("boolean") host: boolean = false;
  @type("uint16") ackSeq: number = 0; // Last acknowledged input sequence number
}

export class CrateSchema extends Schema {
  @type("uint8") id: number = 0;
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("string") itemType: string = "";
  @type("string") state: string = "beacon"; // 'beacon' | 'live'
}

export class BombSchema extends Schema {
  @type("string") holderId: string = "";
  @type("number") fuse: number = 0;
  @type("number") timer: number = 0;
}

export class CrownSchema extends Schema {
  @type("string") holderId: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
}

export class RoomState extends Schema {
  @type("string") roomCode: string = "";
  @type("string") phase: string = "lobby"; // 'lobby' | 'intro' | 'pick' | 'play' | 'results' | 'final'
  @type("uint8") round: number = 0;
  @type("string") mode: string = "brawl"; // 'brawl' | 'bomb' | 'crown'
  @type(["string"]) twists = new ArraySchema<string>();
  @type("string") themeId: string = "sunny";
  @type("number") timeLeft: number = 0;
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type([CrateSchema]) crates = new ArraySchema<CrateSchema>();
  @type(BombSchema) bomb = new BombSchema();
  @type(CrownSchema) crown = new CrownSchema();
  @type("uint32") arenaSeed: number = 0;
  @type("string") settingsHash: string = "";
  @type("uint16") crumbleTilesBitmask: number = 0; // bit i = 1 if tile i is fallen
  @type("uint16") crumbleWarnBitmask: number = 0; // bit i = 1 if tile i is warning
}
