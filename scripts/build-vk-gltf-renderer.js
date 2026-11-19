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

// Configures and builds vk_gltf_renderer with CMake.
//
// Usage: npm run build:vk_gltf_renderer [-- --dlss] [-- --optix]
//
//   --dlss   build with NVIDIA DLSS support (USE_DLSS)
//   --optix  build with the OptiX denoiser (USE_OPTIX_DENOISER)
//

import {spawnSync} from 'child_process';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';
import {parseArgs} from 'util';

const SOURCE_DIR =
    join(dirname(fileURLToPath(import.meta.url)), '..', 'vk_gltf_renderer');

const {values: options} = parseArgs({
  options: {
    'dlss': {type: 'boolean', default: false},
    'optix': {type: 'boolean', default: false},
  }
});

const onOff = (enabled) => enabled ? 'ON' : 'OFF';
const BUILD_DIR = ['build']
                      .concat(options.dlss ? ['dlss'] : [])
                      .concat(options.optix ? ['optix'] : [])
                      .join('-');

const cmake = (args) => {
  console.log(`> cmake ${args.join(' ')}`);
  const result = spawnSync('cmake', args, {cwd: SOURCE_DIR, stdio: 'inherit'});
  if (result.error != null) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status != null ? result.status : 1);
  }
};

cmake([
  '-B', BUILD_DIR, '-S', '.',
  '-DCMAKE_BUILD_TYPE=Release',
  `-DUSE_DLSS=${onOff(options.dlss)}`,
  `-DUSE_OPTIX_DENOISER=${onOff(options.optix)}`,
]);

cmake(['--build', BUILD_DIR, '--config', 'Release']);
