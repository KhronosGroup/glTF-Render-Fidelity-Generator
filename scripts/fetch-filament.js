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

// Downloads the Filament release matching FILAMENT_VERSION from GitHub:
//
//  - Exracts the web runtime (filament.js, filament.wasm and filament.d.ts) into
//    test/renderers/filament/runtime.
//  - Exracts the cmgen tool for the current platform into test/renderers/filament,
//    used to prefilter the IBLs.

import {chmodSync, createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {dirname, join} from 'path';
import {Readable} from 'stream';
import {pipeline} from 'stream/promises';
import * as tar from 'tar';
import {fileURLToPath} from 'url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FILAMENT_DIR = join(SCRIPT_DIR, '..', 'test', 'renderers', 'filament');
const RUNTIME_DIR = join(FILAMENT_DIR, 'runtime');
const RUNTIME_VERSION_FILE = join(RUNTIME_DIR, 'VERSION');
const CMGEN_PATH =
    join(FILAMENT_DIR, process.platform === 'win32' ? 'cmgen.exe' : 'cmgen');
const CMGEN_VERSION_FILE = join(FILAMENT_DIR, 'cmgen.version');

const FILAMENT_VERSION = '1.77.2';

const isUpToDate = (versionFile) => existsSync(versionFile) &&
    readFileSync(versionFile, 'utf8').trim() === FILAMENT_VERSION;

const releaseUrl = (platform) =>
    `https://github.com/google/filament/releases/download/v${
        FILAMENT_VERSION}/filament-v${FILAMENT_VERSION}-${platform}.tgz`;

// Maps the current OS / CPU to the suffix of Filament's desktop release
const desktopPlatform = () => {
  switch (process.platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'mac';
    case 'linux':
      return process.arch === 'arm64' ? 'arm-linux' : 'linux';
    default:
      throw new Error(`No Filament release available for ${process.platform}`);
  }
};

const download = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
        `Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  return Readable.fromWeb(response.body);
};

const fetchWebRuntime = async () => {
  if (isUpToDate(RUNTIME_VERSION_FILE)) {
    return;
  }

  console.log(`Fetching Filament ${FILAMENT_VERSION} web runtime`);

  const source = await download(releaseUrl('web'));

  rmSync(RUNTIME_DIR, {recursive: true, force: true});
  mkdirSync(RUNTIME_DIR, {recursive: true});

  try {
    // tar.x detects and decompresses gzip on its own.
    await pipeline(source, tar.x({cwd: RUNTIME_DIR}));
  } catch (error) {
    // Leave no partial runtime behind so the next run retries.
    rmSync(RUNTIME_DIR, {recursive: true, force: true});
    throw error;
  }

  writeFileSync(RUNTIME_VERSION_FILE, `${FILAMENT_VERSION}\n`);
};

// Streams a release archive and writes the first entry matching entryPattern
// to outputPath, then stops the download.
const extractEntry = (source, entryPattern, outputPath) =>
    new Promise((resolve, reject) => {
      let found = false;

      const parser = new tar.Parser({
        onReadEntry: (entry) => {
          if (found || !entryPattern.test(entry.path)) {
            entry.resume();
            return;
          }

          found = true;
          const output = createWriteStream(outputPath);
          output.once('error', reject);
          output.once('finish', () => {
            source.destroy();
            resolve();
          });
          entry.pipe(output);
        }
      });

      parser.once('error', reject);
      parser.once('end', () => {
        if (!found) {
          reject(new Error(`No entry matching ${entryPattern} in archive`));
        }
      });
      source.once('error', (error) => {
        if (!found) {
          reject(error);
        }
      });

      source.pipe(parser);
    });

const fetchCmgen = async () => {
  if (isUpToDate(CMGEN_VERSION_FILE) && existsSync(CMGEN_PATH)) {
    return;
  }

  const platform = desktopPlatform();
  console.log(`Fetching Filament ${FILAMENT_VERSION} cmgen (${platform})`);

  const source = await download(releaseUrl(platform));

  rmSync(CMGEN_PATH, {force: true});
  rmSync(CMGEN_VERSION_FILE, {force: true});

  try {
    // The Windows archive has bin/ at its root, the others filament/bin/.
    await extractEntry(source, /(^|\/)bin\/cmgen(\.exe)?$/, CMGEN_PATH);
  } catch (error) {
    rmSync(CMGEN_PATH, {force: true});
    throw error;
  }

  if (process.platform !== 'win32') {
    chmodSync(CMGEN_PATH, 0o755);
  }

  writeFileSync(CMGEN_VERSION_FILE, `${FILAMENT_VERSION}\n`);
};

try {
  await fetchWebRuntime();
  await fetchCmgen();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
