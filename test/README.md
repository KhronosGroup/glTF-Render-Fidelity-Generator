# glTF Render Fidelity Testing

One goal of glTF is to standardize Physically-Based Rendering (PBR) materials such that you can be confident your model will appear as intended in any lighting environment in any renderer. This is a very ambitious goal, as real-time rendering at this level of quality is still very much an area of active research with improvements being made constantly. This repository demonstrates where we are on that path to convergence and highlights areas that could still use improvement. It is configured to generate reference render images for the models in the [glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) and [glTF-Test-Assets-Interactivity](https://github.com/KhronosGroup/glTF-Test-Assets-Interactivity) repositories, comparing the most popular real-time web renderers as well as path tracers (a rendering technique that uses far fewer approximations than are required by real-time renderers).

It is very important for any 3D model renderer to strive towards producing a render that is at once true to the source model, aesthetically pleasing to the person viewing the render and as consistent as possible with other commonly used renderers. 

This repository provides a unified pipeline that renders the same test scenarios with both real-time and path-traced renderers, and stores the results as golden images for fidelity comparison.

The generated artifacts, are compared against the [gltf-sample-viewer](https://github.com/KhronosGroup/glTF-Sample-Renderer) renders to selected third party reference model viewers, with an emphasis on revealing major inconsistencies and rendering errors. The goal of this testing is to improve the quality of renders over time, as well as to spark discussions with the authors of other renderers as the community seeks to achieve a satisfying balance between correctness, beauty and consistency.

## Reference model viewers

There are a lot of web and offline renderers out there. Since one of the main goals of glTF is to standardize Physically-Based Rendering (PBR) materials, the focus is on those viewers that have significant levels of distribution and/or reputation. However, anyone can submit a pull request and add a viewer to the comparison as long as they follow the configuration for each scenario and easily fit in the pipeline.

## Crafting new test scenarios

There is currently a lot of flexibility when it comes to crafting a new fidelity
testing scenario. The critical requirements include:

 - The scenario can be feasibly reproduced in all of the relevant model viewers.
 - The scenario demonstrates render qualities that are not comprehensively covered by existing scenarios

For most web renderers, each scenario is rendered im an HTML file that incorporates the viewer' s component with a given configuration. This HTML file is loaded by a browser at test time and used to produce a screenshot for comparison to any configured reference renders.

The steps to produce a new scenario are:

 1. Pick or create a glTF model that is representative of what the scenario should be testing,
    usually from one of the asset submodules (`glTF-Sample-Assets` or `glTF-Test-Assets-Interactivity`).
 2. Pick a descriptive name for the scenario. By convention it is prefixed, e.g. `khronos-<ModelName>`.
 3. Add an entry under `scenarios` in [`test/config.json`](./config.json):
    ```json
    {
      "name": "khronos-MyModel",
      "model": "../../../glTF-Sample-Assets/Models/MyModel/glTF/MyModel.gltf",
      "orbit": { "theta": 30, "phi": 75, "radius": 2.5 },
      "target": { "y": 0.5 },
      "dimensions": { "width": 1024, "height": 640 },
      "exclude": ["stellar"]
    }
    ```
      - Paths are relative to `test/renderers/<renderer>/`, hence the leading `../../../`.
      - Only `name` and `model` are required. The defaults ([`src/config-reader.ts`](../src/config-reader.ts))
        are: `lighting` = `environments/lightroom_14b.hdr`, a 768×768 image, `target` at the origin,
        `orbit` with `theta` 0, `phi` 90 and `radius` 1, a 45° `verticalFoV`, and no skybox.
      - Optional: `lighting` (path to an `.hdr`/`.jpg`), `renderSkybox`, `verticalFoV`, and `exclude`
        (renderer labels to skip).
      - Add a renderer to `exclude` when it cannot produce the scenario (e.g. it does not support the
        model's extensions), rather than leaving it without a golden, so the gap is documented as intentional.
 4. Render the goldens. They are written to `test/goldens/<scenario>/<renderer>-golden.webp`:
    ```
    npm run render-goldens -- -s khronos-MyModel -m
    ```
    `-m` renders only the goldens that are missing.
 5. Check the result with a dry run, then open `test/results-viewer.html` from a local web server:
    ```
    npm run test -- -d -s khronos-MyModel
    ```

## Adding CLI renderer backends

The `command` property of the renderer configuration allows adding external renderer processes to the screenshot generation and fidelity testing.

```json
"renderers": [
    {
      "name": "cli_renderer",
      "description": "An offline rendering backend",
      "command": { 
        "executable": "python",
        "args": ["test/renderers/cli_renderer/run.py"]
      }
    }
]
```
Providing an empty object will skip the renderer for image generation during `update-screenshots`, but it is still expected to provide renderings in the golden folders for image comparison and report generation.

On execution, a stringyfied scenario configuration will automatically be attached to `args`, the list of arguments to the `executable`. Please note the additional `outputFile` property.

Example configuration:
```json
{ 
  "lighting": "../../../environments/lightroom_14b.hdr",
  "dimensions": {
    "width": 768,
    "height": 450
  },
  "target": {
    "x": 0,
    "y": 0.3,
    "z": 0
  },
  "orbit": {
    "theta": 0,
    "phi": 90,
    "radius": 1
  },
  "verticalFoV": 45,
  "renderSkybox": False,
  "name": "khronos-SheenChair",
  "model": "../../../glTF-Sample-Assets/Models/SheenChair/glTF-Binary/SheenChair.glb"
},
```
