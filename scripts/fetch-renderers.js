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

// Clone the renderers that are built from
// source into the package root.
// Build commands are in package.json.

import {spawnSync} from 'child_process';
import {existsSync} from 'fs';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const REPOSITORIES = [
  {
    directory: 'dspbr-pt',
    url: 'https://github.com/DassaultSystemes-Technology/dspbr-pt.git',
  },
  {
    directory: 'glTF-Sample-Renderer',
    url: 'https://github.com/KhronosGroup/glTF-Sample-Renderer.git',
  },
  {
    directory: 'vk_gltf_renderer',
    url: 'https://github.com/nvpro-samples/vk_gltf_renderer.git',
  },
];

for (const {directory, url} of REPOSITORIES) {
  const path = join(PACKAGE_ROOT, directory);

  if (existsSync(path)) {
    console.log(`🎾 ${directory} already present, skipping`);
    continue;
  }

  console.log(`🐶 Fetching ${directory} from ${url}`);

  const result = spawnSync(
      'git',
      [
        'clone',
        '--depth',
        '1',
        '--recurse-submodules',
        '--shallow-submodules',
        url,
        directory,
      ],
      {cwd: PACKAGE_ROOT, stdio: 'inherit'});

  if (result.error != null) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status != null ? result.status : 1);
  }
}
