import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire("file:///E:/Genlayer-Tools/studio-next-toolchain/package.json");
const { createClient } = require("genlayer-js");
const { studioDevnet } = require("genlayer-js/chains");

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Usage: node read-live-schema.mjs <contract-source>");

const source = fs.readFileSync(sourcePath, "utf8");
const client = createClient({ chain: studioDevnet });
const schema = await client.getContractSchemaForCode(source);

process.stdout.write(JSON.stringify({
  network: "studio-dev",
  chainId: 61997,
  rpc: "https://studio-dev.genlayer.com/api",
  sourceBytes: Buffer.byteLength(source),
  schema,
}, null, 2));
