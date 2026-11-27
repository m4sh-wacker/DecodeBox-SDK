import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { aliases, releasePath } from './sdk-paths.mjs';

const root = process.argv[2] ?? 'dist';
async function readArtifact(path) {
  const bytes = await readFile(join(root, path));
  if (!bytes.length) throw new Error('Empty SDK artifact: ' + join(root, path));
  return bytes;
}

for (const [file, paths] of Object.entries(aliases)) {
  const source = releasePath + '/' + file;
  const expected = await readArtifact(source);
  for (const path of paths) {
    if (!(await readArtifact(path)).equals(expected)) {
      throw new Error(path + ' differs from ' + source);
    }
  }
  console.log([source, ...paths].join(', ') + ' verified (' + expected.length + ' bytes each)');
}
