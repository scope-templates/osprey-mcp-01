import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

// stdout carries the protocol, so anything meant for a person goes to stderr.
const server = createServer();
await server.connect(new StdioServerTransport());
console.error('osprey sightings server listening on stdio');
