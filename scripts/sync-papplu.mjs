import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = 'https://github.com/doublexmax/PappluAI';
const files = [
  'cards.mjs',
  'evaluate.mjs',
  'game.mjs',
  'qnet.mjs',
  'ai.mjs',
  'engine.mjs',
  'engine-worker.mjs',
  'table.mjs',
  'papplu-model.json',
];
const root = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const destination = join(root, 'src', 'features', 'papplu', 'engine');
const manifestPath = join(destination, 'VERSION.json');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

function guardDestination() {
  let current = root;
  for (const segment of ['src', 'features', 'papplu', 'engine']) {
    current = join(current, segment);
    if (existsSync(current) && relative(root, realpathSync(current)) !== relative(root, current)) {
      throw new Error('The engine destination must stay inside src/features/papplu/engine.');
    }
  }
  mkdirSync(destination, { recursive: true });
  for (const name of [...files, 'VERSION.json']) {
    const path = join(destination, name);
    if (existsSync(path) && lstatSync(path).isSymbolicLink()) {
      throw new Error(`Refusing to write through a symbolic link at ${path}.`);
    }
  }
}

function check() {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.repository !== repository ||
      JSON.stringify(Object.keys(manifest.files).sort()) !== JSON.stringify([...files].sort())) {
    throw new Error('VERSION.json does not describe the expected Papplu engine files.');
  }
  for (const name of files) {
    if (hash(readFileSync(join(destination, name))) !== manifest.files[name]) {
      throw new Error(`${name} differs from VERSION.json. Sync from PappluAI instead of editing vendored files.`);
    }
  }
  console.log(`Verified ${files.length} Papplu engine files against VERSION.json.`);
}

function sync(source) {
  const sourcePath = realpathSync(resolve(source));
  if (sourcePath === destination) throw new Error('The source must be the upstream PappluAI web directory.');
  const revision = execFileSync('git', ['-C', sourcePath, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const dirty = execFileSync('git', [
    '-C', sourcePath, 'status', '--porcelain', '--untracked-files=all', '--', ...files,
  ], { encoding: 'utf8' }).trim();
  const contents = new Map(files.map((name) => [
    name,
    dirty
      ? readFileSync(join(sourcePath, name))
      : execFileSync('git', ['-C', sourcePath, 'show', `${revision}:./${name}`], { maxBuffer: Infinity }),
  ]));
  const manifest = {
    repository,
    revision,
    source: 'web',
    sourceState: dirty ? 'working-tree' : 'committed',
    files: Object.fromEntries([...contents].map(([name, bytes]) => [name, hash(bytes)])),
  };
  guardDestination();
  for (const [name, bytes] of contents) writeFileSync(join(destination, name), bytes);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  check();
}

try {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--check') check();
  else if (args.length === 2 && args[0] === '--source') sync(args[1]);
  else throw new Error('Use --check or --source <PappluAI web directory>.');
} catch (error) {
  console.error(`Papplu engine sync failed. ${error.message}`);
  process.exitCode = 1;
}
