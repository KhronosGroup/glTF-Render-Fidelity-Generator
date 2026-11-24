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
import {existsSync, rmSync} from 'fs';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const REPOSITORIES = [
  {
    directory: 'dspbr-pt',
    url: 'https://github.com/DassaultSystemes-Technology/dspbr-pt.git',
    commit: '7f446e3292cfc226b244fcb2692bbf4d3f0100f7',
  },
  {
    directory: 'glTF-Sample-Renderer',
    url: 'https://github.com/KhronosGroup/glTF-Sample-Renderer.git',
    commit: '6e8a3d1aaa6f07e9f1310a488453e21325677786',
  },
  {
    directory: 'vk_gltf_renderer',
    url: 'https://github.com/nvpro-samples/vk_gltf_renderer.git',
    commit: '8c0ef8357b19acd05f5ae988a6c9cb912f39909b',
  },
];

const git = (args, cwd) => {
  const result = spawnSync('git', args, {cwd, stdio: 'inherit'});
  if (result.error != null) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} exited with ${result.status}`);
  }
};

for (const {directory, url, commit} of REPOSITORIES) {
  const path = join(PACKAGE_ROOT, directory);

  if (existsSync(path)) {
    console.log(`🎾 ${directory} already present, skipping`);
    continue;
  }

  console.log(`🐶 Fetching ${directory} at ${commit.slice(0, 7)} from ${url}`);

  try {
    // Fetch only the pinned commit, like a shallow clone of it
    git(['init', '--quiet', directory], PACKAGE_ROOT);
    git(['remote', 'add', 'origin', url], path);
    git(['fetch', '--quiet', '--depth', '1', 'origin', commit], path);
    git(['checkout', '--quiet', 'FETCH_HEAD'], path);
    git(['submodule', 'update', '--init', '--recursive', '--depth', '1'], path);
  } catch (error) {
    console.error(error.message);
    // Remove the partial checkout so the next run does not skip it
    rmSync(path, {recursive: true, force: true});
    process.exit(1);
  }
}
