# Render fidelity tools

This package contains tools and testing processes to ensure high-fidelity 3D model rendering as well as compare rendering qualities across renderers. See `test/results-viewer.html` if running this package locally.

## Development

The repository has been tested on Windows and Linux systems.

The following commands are available when working with the repository:

Command                         | Description
------------------------------- | -----------
`npm run setup`                 | Fetch Filament, model-viewer and the other renderers
`npm run build`                 | Build artifacts required to run testing and review tools
`npm run clean`                 | Deletes all build artifacts
`npm run test`                  | Run a render fidelity check comparing `gltf-sample-viewer` to other renderers
`npm run render-goldens`        | Render the "golden" images for all renderers
`npm run fetch:<name>`          | Fetch a single dependency: `renderers`, `filament` or `model-viewer`
`npm run build:<name>`          | Build a single renderer: `gltf-sample-renderer`, `dspbr-pt` or `vk_gltf_renderer`

## Setup

```
git clone git@github.com:KhronosGroup/glTF-Render-Fidelity-Generator.git
cd glTF-Render-Fidelity-Generator
git submodule update --init --recursive
```

The last two commands download several MBs of raw data, including the reference Sample Assets (`.glb`) and the reference renders (`.webp`).

Then, execute these steps to create a development environment with the desired renderers. Some native renderers (e.g. Blender) expect to find the executable already installed on the system.

1. `npm i`
2. `npm run setup`
3. *(optional)* `npm run build:vk_gltf_renderer -- --dlss --optix`
4. *(optional)* `npm run build:dspbr-pt`
5. *(optional)* `npm run fetch:model-viewer`
6. *(optional)* `npm run fetch:filament`
7. `npm run build:gltf-sample-renderer`
8. `npm run build`

### Fidelity Test CLI

For `npm run test`, we support these command line options:

Command            | Default             | Description
--------------------|----------- | -----------
  -c, --config      |  | Path to configuration json.
  -r, --renderer    | gltf-sample-viewer | The renderer to fidelity test, must be a web-based renderer.
  -s, --scenario    |  | Limit to specific scenarios. This now also allows you to specify multiple scenarios in the whitelist.  You can use a full name or a partial name of scenarios and it will match against all that contain that scenario substring.
  -p, --port        | 9040  | Port for web server.
  -d, --dry-run      | false | Lists which images would be rendered but doesn't render.  Useful when trying to figure out which tests will run given that command line.
  -q, --quiet        | false | Hide the puppeteer controlled browser.  This can allow you to work on the computer while it is running in the background.

To run a subset of scenarios do something like this:

```
% npm run test -- --scenario=texture --quiet
```

*NOTE: In the above example, the `--` is required to separate the arguments to `npm run test` from the arguments to the script itself.*

After running `npm run test`, you can look at the results by starting a local web server (e.g. `npx http-server`) in this folder, then opening `test/results-viewer.html` in a browser.

### Render Goldens CLI

For `npm run render-goldens`, we support these command line options:

Command            | Default             | Description
--------------------|----------- | -----------
  -c, --config      |  | Path to configuration json.
  -r, --renderer    |  | Limit to specific renderers, by label (see [Supported renderers](#supported-renderers)). This now allows you to specify multiple renderers in the whitelist, rather than only one.
  -s, --scenario    |  | Limit to specific scenarios. This now also allows you to specify multiple scenarios in the whitelist.  You can use a full name or a partial name of scenarios and it will match against all that contain that scenario substring.
  -p, --port        | 9040  | Port for web server.
  -m, --missing-only | false | Only render if an output image is missing.  Very useful when adding new tests.
  -d, --dry-run      | false | Lists which images would be rendered but doesn't render.  Useful when trying to figure out which tests will run given that command line.
  -q, --quiet        | false | Hide the puppeteer controlled browser.  This can allow you to work on the computer while it is running in the background.

#### Supported renderers

Name                              | Label                  | Rendering Type | Platform
--------------------------------- | ---------------------- | -------------- | --------
gltf-sample-viewer                | `gltf-sample-viewer`   | Real-Time      | Web
`<model-viewer>`                  | `model-viewer`         | Real-Time      | Web
three.js                          | `three`                | Real-Time      | Web
filament.js                       | `filament`             | Real-Time      | Web, Android
babylon.js                        | `babylon`              | Real-Time      | Web
RhodoniteTS                       | `rhodonite`            | Real-Time      | Web
Phasma Viewer                     | `phasma-viewer`        | Real-Time      | Web
Enterprise PBR WebGL Path Tracer  | `dspbr-pt`             | Path Tracing   | Web
three-gpu-pathtracer              | `three-gpu-pathtracer` | Path Tracing   | Web
Dassault STELLAR                  | `stellar`              | Path Tracing   | Windows, Linux
Chaos Group V-Ray (via vray_gltf) | `vray`                 | Path Tracing   | Linux, Windows, MacOS
Blender Cycles                    | `blender-cycles`       | Path Tracing   | Linux, Windows, MacOS
Vulkan RTX Path Tracer            | `vk-gltf-renderer`     | Path Tracing   | Linux, Windows, MacOS

To run a subset of renders or scenarios do something like this:

```
% npm run render-goldens -- --renderer=filament --renderer=gltf-sample-viewer --scenario=clearcoat -q 
```

*NOTE: In the above example, the `--` is required to separate the arguments to `npm run render-goldens` from the arguments to the script itself.*
