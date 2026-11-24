/* @license
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Generates the Filament IBL (ktx/<name>/<name>_ibl.ktx and _skybox.ktx) for
// an environment map with cmgen, if necessary. cmgen is downloaded by
// scripts/fetch-filament.js as part of `npm run build`.

import {spawnSync} from 'child_process';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {basename, dirname, extname, join, resolve} from 'path';
import sharp from 'sharp';
import {fileURLToPath} from 'url';
import {parseArgs} from 'util';

const showUsage = () => console.log(`Generates IBL with cmgen if necessary.

Usage:

  node prepare-ibl.js -i <ibl input file> [-vI]

Note: script caches generated IBLs across multiple invocations, and
regenerates them when cmgen changes version. To force regeneration of
the IBL, add the -I flag (be aware that this will take longer).`);

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const IBL_DIR = join(SCRIPT_DIR, 'ktx');
const CMGEN_BIN =
    join(SCRIPT_DIR, process.platform === 'win32' ? 'cmgen.exe' : 'cmgen');
// Written by scripts/fetch-filament.js next to the cmgen it downloads
const CMGEN_VERSION_FILE = join(SCRIPT_DIR, 'cmgen.version');

const readVersion = (file) =>
    existsSync(file) ? readFileSync(file, 'utf8').trim() : null;

let options;
try {
  ({values: options} = parseArgs({
    options: {
      'input': {type: 'string', short: 'i'},
      'regenerate': {type: 'boolean', short: 'I', default: false},
      'verbose': {type: 'boolean', short: 'v', default: false},
      'help': {type: 'boolean', short: '?', default: false},
    }
  }));
} catch (error) {
  console.error(error.message);
  showUsage();
  process.exit(1);
}

if (options.help) {
  showUsage();
  process.exit(0);
}

// Argument defaults:
const iblInputFile = options.input || process.env.LIGHTING;

if (!iblInputFile) {
  showUsage();
  process.exit(1);
}

if (!existsSync(CMGEN_BIN)) {
  console.error(
      `cmgen not found at ${CMGEN_BIN}. Run \`npm run fetch:filament\`.`);
  process.exit(1);
}

const iblExtension = extname(iblInputFile).slice(1).toLowerCase();
const iblBasename = basename(iblInputFile, extname(iblInputFile));
const iblOutputPath = join(IBL_DIR, iblBasename);
const iblFile = join(iblOutputPath, `${iblBasename}_ibl.ktx`);
// Records the cmgen version that generated this IBL
const iblVersionFile = join(iblOutputPath, 'cmgen.version');
const cmgenVersion = readVersion(CMGEN_VERSION_FILE);

if (!options.regenerate && existsSync(iblFile) && cmgenVersion != null &&
    readVersion(iblVersionFile) === cmgenVersion) {
  // Nothing to do...
  process.exit(0);
}

mkdirSync(IBL_DIR, {recursive: true});

let cmgenInputFile = resolve(iblInputFile);

// cmgen can't decode JPEGs, so convert them to PNG first.
if (iblExtension === 'jpg' || iblExtension === 'jpeg') {
  const pngFile = join(IBL_DIR, `${iblBasename}.png`);
  await sharp(cmgenInputFile, {limitInputPixels: false})
      .removeAlpha()
      .png()
      .toFile(pngFile);
  cmgenInputFile = pngFile;
}

const cmgenArgs = ['--format=ktx', '-x', iblOutputPath, cmgenInputFile];

if (options.verbose) {
  console.log(CMGEN_BIN, ...cmgenArgs);
}

rmSync(iblOutputPath, {recursive: true, force: true});

const result = spawnSync(CMGEN_BIN, cmgenArgs, {stdio: 'inherit'});

if (result.error != null || result.status !== 0) {
  if (result.error != null) {
    console.error(result.error);
  }
  // Leave no partial IBL behind so the next run retries.
  rmSync(iblOutputPath, {recursive: true, force: true});
  process.exit(1);
}

if (cmgenVersion != null) {
  writeFileSync(iblVersionFile, `${cmgenVersion}\n`);
}
