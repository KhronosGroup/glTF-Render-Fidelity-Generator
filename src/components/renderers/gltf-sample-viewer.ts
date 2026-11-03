// @ts-ignore
import {GltfState, GltfView, ResourceLoader} from '@khronosgroup/gltf-viewer';
import {css, html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js'

import {ScenarioConfig} from '../../common.js';

// 'gltf-sample-renderer' is the local package at glTF-Sample-Renderer/dist
// built with `npm run build:gltf-sample-renderer`
const GLTF_SAMPLE_RENDERER_DIST = '../../../glTF-Sample-Renderer/dist';

const $updateScenario = Symbol('updateScenario');
const $updateSize = Symbol('updateSize');
const $canvas = Symbol('canvas');
const $view = Symbol('view');
const $state = Symbol('state');
const $resourceLoader = Symbol('resourceLoader');
const $degToRadians = Symbol('degToRadians');
const $loadEnvironmentFile = Symbol('loadEnvironmentFile');

@customElement('gltf-sample-viewer')
export class GltfSampleViewer extends LitElement {
  @property({type: Object}) scenario: ScenarioConfig|null = null;
  private[$canvas]: HTMLCanvasElement|null = null;
  private[$view]: GltfView;
  private[$state]: GltfState;
  private[$resourceLoader]: ResourceLoader;

  static get styles() {
    return css`
:host {
 display: block;
}
`;
  }

  render() {
    return html`<canvas id="canvas"></canvas>`;
  }


  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    this[$updateSize]();

    if (changedProperties.has('scenario') && this.scenario != null) {
      this[$updateScenario](this.scenario);
    }
  }


  private async[$updateScenario](scenario: ScenarioConfig) {
    if (this[$view] == null) {
      this[$canvas] = this.shadowRoot!.querySelector('canvas');
      this[$view] = new GltfView(
          this[$canvas]!.getContext('webgl2', {alpha: true, antialias: true}));
      this[$state] = this[$view].createState();
      this[$resourceLoader] = this[$view].createResourceLoader(
          undefined, undefined, `${GLTF_SAMPLE_RENDERER_DIST}/libs/`);
    }
    this[$updateSize]();

    this[$state].gltf = await this[$resourceLoader].loadGltf(scenario.model);

    const defaultScene = this[$state].gltf.scene;
    this[$state].sceneIndex = defaultScene === undefined ? 0 : defaultScene;
    const scene = this[$state].gltf.scenes[this[$state].sceneIndex];
    scene.applyTransformHierarchy(this[$state].gltf);

    const {target, orbit, verticalFoV} = scenario;
    const camera = this[$state].userCamera;
    camera.setVerticalFoV(this[$degToRadians](verticalFoV));
    camera.fitViewToScene(this[$state].gltf, this[$state].sceneIndex);

    const yaw = this[$degToRadians](orbit.theta);
    const pitch = this[$degToRadians]((orbit.phi - 90));
    camera.setRotation(yaw, pitch);
    camera.setDistanceFromTarget(orbit.radius, [target.x, target.y, target.z]);
    this[$state].renderingParameters.clearColor = [0, 0, 0, 0];

    const luts = {
      lut_ggx_file: `${GLTF_SAMPLE_RENDERER_DIST}/assets/lut_ggx.png`,
      lut_charlie_file: `${GLTF_SAMPLE_RENDERER_DIST}/assets/lut_charlie.png`,
      lut_sheen_E_file: `${GLTF_SAMPLE_RENDERER_DIST}/assets/lut_sheen_E.png`
    };

    this[$state].renderingParameters.environmentRotation = 0;

    this[$state].environment = await this[$resourceLoader].loadEnvironment(
        await this[$loadEnvironmentFile](scenario.lighting), luts);

    this[$state].renderingParameters.renderEnvironmentMap =
        scenario.renderSkybox;
    this[$state].renderingParameters.blurEnvironmentMap = false;

    this[$state].renderingParameters.toneMap =
        GltfState.ToneMaps.ACES_HILL_EXPOSURE_BOOST;

    this[$view].renderFrame(
        this[$state], this[$canvas]!.width, this[$canvas]!.height);
    requestAnimationFrame(() => {
      this.dispatchEvent(
          // This notifies the framework that the model is visible and the
          // screenshot can be taken
          new CustomEvent('model-visibility', {detail: {visible: true}}));
    });
  }


  private[$updateSize]() {
    if (this[$canvas] == null || this.scenario == null) {
      return;
    }

    const canvas = this[$canvas]!;
    const {dimensions} = this.scenario;

    const dpr = window.devicePixelRatio;
    const width = dimensions.width * dpr;
    const height = dimensions.height * dpr;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    const aspect = width / height;

    const camera = this[$state].userCamera;
    camera.aspectRatio = aspect;
  }

  private[$degToRadians](degree: number) {
    return Math.PI * (degree / 180);
  }

  private async[$loadEnvironmentFile](url: string):
      Promise<string|ArrayBuffer> {
    if (/\.hdr$/i.test(url)) {
      return url;
    }

    // The resource loader can only parse Radiance files, so low-dynamic-range
    // images (e.g. .jpg/.png) are re-encoded as an uncompressed in-memory one.
    const image = new Image();
    image.src = url;
    await image.decode();
    const {naturalWidth: width, naturalHeight: height} = image;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const {data: pixels} = context.getImageData(0, 0, width, height);

    const srgbToLinear = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const c = i / 255;
      srgbToLinear[i] =
          c < 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }

    const header = new TextEncoder().encode(
        `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`);
    const file = new Uint8Array(header.length + width * height * 4);
    file.set(header);

    const rgbe = file.subarray(header.length);
    for (let i = 0; i < rgbe.length; i += 4) {
      const r = srgbToLinear[pixels[i]];
      const g = srgbToLinear[pixels[i + 1]];
      const b = srgbToLinear[pixels[i + 2]];
      const max = Math.max(r, g, b);
      if (max === 0) {
        continue;
      }

      // Shared exponent such that the largest channel uses the full byte range
      const exponent = Math.floor(Math.log2(max)) + 1;
      const scale = Math.pow(2, 8 - exponent);
      rgbe[i] = Math.min(Math.round(r * scale), 255);
      rgbe[i + 1] = Math.min(Math.round(g * scale), 255);
      rgbe[i + 2] = Math.min(Math.round(b * scale), 255);
      rgbe[i + 3] = exponent + 128;
    }

    return file.buffer;
  }
}
