// Renders a scenario with nvpro-samples' vk_gltf_renderer in headless mode.
// Invoked by render-goldens with the render config JSON as last argument:
// {"scenario": {...}, "outputFile": "..."}

import {spawnSync} from 'child_process';
import {dirname, join, resolve} from 'path';
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
  '--output', outputFile,
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

if (result.error != null) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status != null ? result.status : 1);
