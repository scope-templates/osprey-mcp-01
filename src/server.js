import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readSightings, updateSightings } from './store.js';

function asText(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

export function createServer() {
  const server = new McpServer({ name: 'osprey-sightings', version: '0.1.0' });

  server.registerTool(
    'list_sightings',
    {
      title: 'List sightings',
      description: 'Bird sightings from the log, newest first. Optionally filter by species and cap the number returned.',
      inputSchema: {
        species: z.string().min(1).optional().describe('Only sightings of this species (case-insensitive)'),
        limit: z.number().int().min(1).max(100).default(20).describe('Maximum number of sightings to return'),
      },
    },
    async ({ species, limit }) => {
      const wanted = species?.trim().toLowerCase();
      const sightings = (await readSightings())
        .filter((s) => !wanted || s.species.toLowerCase() === wanted)
        .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
        .slice(0, limit);
      return asText({ count: sightings.length, sightings });
    },
  );

  server.registerTool(
    'add_sighting',
    {
      title: 'Add a sighting',
      description: 'Record a new bird sighting in the log.',
      inputSchema: {
        species: z.string().min(1).max(80).describe('Common name of the species, for example "Osprey"'),
        location: z.string().min(1).max(120).describe('Where the bird was seen'),
        count: z.number().int().min(1).default(1).describe('Number of individuals'),
        observedAt: z.iso.datetime().optional().describe('ISO 8601 timestamp; defaults to now'),
        notes: z.string().max(500).optional(),
      },
    },
    async ({ species, location, count, observedAt, notes }) => {
      const sighting = await updateSightings((sightings) => {
        const record = {
          id: sightings.reduce((max, s) => Math.max(max, s.id), 0) + 1,
          species: species.trim(),
          count,
          location: location.trim(),
          observedAt: observedAt ?? new Date().toISOString(),
          notes: notes?.trim() ?? '',
        };
        sightings.push(record);
        return record;
      });
      return asText(sighting);
    },
  );

  server.registerTool(
    'sighting_stats',
    {
      title: 'Sighting statistics',
      description: 'Totals for the whole log: sightings, individuals, species, locations and the observation date range.',
    },
    async () => {
      const sightings = await readSightings();
      const bySpecies = {};
      for (const s of sightings) {
        bySpecies[s.species] = (bySpecies[s.species] ?? 0) + s.count;
      }
      const dates = sightings.map((s) => s.observedAt).sort();
      return asText({
        sightings: sightings.length,
        individuals: sightings.reduce((sum, s) => sum + s.count, 0),
        species: Object.keys(bySpecies).length,
        locations: new Set(sightings.map((s) => s.location)).size,
        bySpecies: Object.fromEntries(Object.entries(bySpecies).sort((a, b) => b[1] - a[1])),
        firstObservedAt: dates[0] ?? null,
        lastObservedAt: dates.at(-1) ?? null,
      });
    },
  );

  return server;
}
