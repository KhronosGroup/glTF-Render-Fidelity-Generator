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

// Renders a scenario with nvpro-samples' vk_gltf_renderer in headless mode.
// Invoked by render-goldens with the render config JSON as last argument:
// {"scenario": {...}, "outputFile": "..."}

import {spawnSync} from 'child_process';
import {mkdtempSync, rmSync} from 'fs';
import {tmpdir} from 'os';
import {dirname, join, resolve} from 'path';
import sharp from 'sharp';
import {fileURLToPath} from 'url';

const RENDERER_DIR = dirname(fileURLToPath(import.meta.url));
const EXECUTABLE = join(
    RENDERER_DIR, '..', '..', '..', 'vk_gltf_renderer', '_bin', 'Release',
    process.platform === 'win32' ? 'vk_gltf_renderer.exe' : 'vk_gltf_renderer');

// Goldens are rendered at twice the scenario dimensions, matching
// DEVICE_PIXEL_RATIO in src/common.ts used for the browser renderers.
const DEVICE_PIXEL_RATIO = 2;

const {scenario, outputFile} = JSON.parse(process.argv[process.argv.length - 1]);

// Place the camera on the scenario's orbit around its target, like the other
// renderers: theta is the azimuth around +Y, phi the polar angle from +Y.
const {target, orbit, verticalFoV} = scenario;
const theta = orbit.theta * Math.PI / 180;
const phi = orbit.phi * Math.PI / 180;
// Unit vector from the target towards the camera.
const direction = [
  Math.sin(phi) * Math.sin(theta),
  Math.cos(phi),
  Math.sin(phi) * Math.cos(theta),
];
const eye = [
  target.x + orbit.radius * direction[0],
  target.y + orbit.radius * direction[1],
  target.z + orbit.radius * direction[2],
];
// Look at a point one unit in front of the eye rather than at the target, so
// that a zero radius (camera placed at the target, e.g. Sponza) still has a
// view direction.
const center = eye.map((value, i) => value - direction[i]);
// The orbit's own up direction. It equals world +Y projected onto the image
// plane, but stays defined when looking straight up or down (phi = 0 or 180),
// where theta then sets the roll like orbit controls.
const up = [
  -Math.cos(phi) * Math.sin(theta),
  Math.sin(phi),
  -Math.cos(phi) * Math.cos(theta),
];
// "{eye}, {center}, {up}, {fov}" with a vertical FoV in degrees; near/far are
// left to the renderer's fit to the scene bounds.
const cameraString = `{${eye.join(', ')}}, {${center.join(', ')}}, {${
    up.join(', ')}}, {${verticalFoV}}`;

// The renderer only writes PNG or JPEG, so render a PNG into a temporary
// directory and convert it to lossless WebP afterwards.
const tempDirectory = mkdtempSync(join(tmpdir(), 'vk-gltf-renderer-'));
const pngFile = join(tempDirectory, 'render.png');

// Scenario paths are relative to the renderer's directory.
const args = [
  '--headless',
  '--size', `${scenario.dimensions.width * DEVICE_PIXEL_RATIO}`,
  `${scenario.dimensions.height * DEVICE_PIXEL_RATIO}`,
  '--scenefile', resolve(RENDERER_DIR, scenario.model),
  '--hdrfile', resolve(RENDERER_DIR, scenario.lighting),
  '--cameraString', cameraString,
  '--frames', '128',
  '--ptMaxSamples', '128',
  '--ptSamples', '1',
  '--ptAdaptiveSampling', '0',
  '--oidnEnable', '1',
  '--oidnQuality', '2',
  '--renderSystem', '0',
  '--envSystem', '1',
  // Match the tonemapping of the Blender Cycles
  '--tmAutoExposure', '0',
  '--tmMethod', '3',
  '--tmExposure', `${1 / 0.6}`,
  '--tmDither', '0',
  '--output', pngFile,
];

if (!scenario.renderSkybox) {
  args.push('--useSolidBackground', '--solidBackgroundColor', '0', '0', '0');
}

// DLSS-RR is on by default in DLSS builds and writes an opaque alpha, hiding
// the transparent background. Builds without DLSS reject the parameter.
const help = spawnSync(EXECUTABLE, ['--help'], {encoding: 'utf8'});
if (`${help.stdout}${help.stderr}`.includes('dlssEnable')) {
  args.push('--dlssEnable', '0');
}

const result = spawnSync(EXECUTABLE, args, {stdio: 'inherit'});

let status = result.status != null ? result.status : 1;
if (result.error != null) {
  console.error(result.error);
  status = 1;
}

try {
  if (status === 0) {
    let image = sharp(pngFile);
    // The path tracer writes zero alpha wherever a primary ray misses the
    // scene, even though the environment is in the color channels. Drop the
    // alpha to make the skybox visible.
    if (scenario.renderSkybox) {
      image = image.removeAlpha();
    }
    await image.webp({lossless: true, exact: true, effort: 6})
        .toFile(outputFile);
  }
} catch (error) {
  console.error(error);
  status = 1;
} finally {
  rmSync(tempDirectory, {recursive: true, force: true});
}

process.exit(status);
