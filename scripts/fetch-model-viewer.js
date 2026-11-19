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

// Downloads the <model-viewer> npm package matching MODEL_VIEWER_VERSION and
// extracts its self-contained bundle (model-viewer.min.js
// into test/renderers/model-viewer/runtime. Fetching it outside of
// npm keeps model-viewer's three peer dependency from pinning our own three.

import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {dirname, join} from 'path';
import {Readable} from 'stream';
import {pipeline} from 'stream/promises';
import * as tar from 'tar';
import {fileURLToPath} from 'url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const MODEL_VIEWER_DIR =
    join(SCRIPT_DIR, '..', 'test', 'renderers', 'model-viewer');
const RUNTIME_DIR = join(MODEL_VIEWER_DIR, 'runtime');
const RUNTIME_VERSION_FILE = join(RUNTIME_DIR, 'VERSION');
const BUNDLE_ENTRY = 'package/dist/model-viewer.min.js';

const MODEL_VIEWER_VERSION = '4.4.0';

const packageUrl =
    `https://registry.npmjs.org/@google/model-viewer/-/model-viewer-${
        MODEL_VIEWER_VERSION}.tgz`;

const download = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
        `Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  return Readable.fromWeb(response.body);
};

const fetchRuntime = async () => {
  if (existsSync(RUNTIME_VERSION_FILE) &&
      readFileSync(RUNTIME_VERSION_FILE, 'utf8').trim() ===
          MODEL_VIEWER_VERSION) {
    return;
  }

  console.log(`Fetching <model-viewer> ${MODEL_VIEWER_VERSION}`);

  const source = await download(packageUrl);

  rmSync(RUNTIME_DIR, {recursive: true, force: true});
  mkdirSync(RUNTIME_DIR, {recursive: true});

  try {
    // tar.x detects and decompresses gzip on its own.
    await pipeline(source, tar.x({
      cwd: RUNTIME_DIR,
      strip: 2,
      filter: (path) => path === BUNDLE_ENTRY
    }));
    if (!existsSync(join(RUNTIME_DIR, 'model-viewer.min.js'))) {
      throw new Error(`No ${BUNDLE_ENTRY} in ${packageUrl}`);
    }
  } catch (error) {
    // Leave no partial runtime behind so the next run retries.
    rmSync(RUNTIME_DIR, {recursive: true, force: true});
    throw error;
  }

  writeFileSync(RUNTIME_VERSION_FILE, `${MODEL_VIEWER_VERSION}\n`);
};

try {
  await fetchRuntime();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
