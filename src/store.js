import { readFile, writeFile } from 'node:fs/promises';

const file = process.env.SIGHTINGS_FILE ?? new URL('../data/birds.json', import.meta.url);

export async function readSightings() {
  return JSON.parse(await readFile(file, 'utf8'));
}

// Writes are serialised so two concurrent add_sighting calls cannot drop each other's record.
let queue = Promise.resolve();

export function updateSightings(change) {
  const run = queue.then(async () => {
    const sightings = await readSightings();
    const result = change(sightings);
    await writeFile(file, `${JSON.stringify(sightings, null, 2)}\n`);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}
