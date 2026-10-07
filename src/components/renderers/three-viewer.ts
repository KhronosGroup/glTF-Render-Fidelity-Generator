/* @license
 * Copyright 2024 Google LLC. All Rights Reserved.
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

import {css, html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {ACESFilmicToneMapping, Box3, EquirectangularReflectionMapping, Group, MathUtils, PerspectiveCamera, PMREMGenerator, Scene, Sphere, SRGBColorSpace, Texture, TextureLoader, WebGLRenderer} from 'three';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {HDRLoader} from 'three/examples/jsm/loaders/HDRLoader.js';
import {KTX2Loader} from 'three/examples/jsm/loaders/KTX2Loader.js';

import {ScenarioConfig} from '../../common.js';

// Decoders are fetched lazily and only when a scenario's model actually uses
// the corresponding compression extension. Use the same gstatic-hosted Draco
// decoder as the three-gpu-pathtracer renderer for consistency.
const DRACO_DECODER_PATH =
    'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';
const KTX2_TRANSCODER_PATH =
    'https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/libs/basis/';

const $initialize = Symbol('initialize');
const $updateScenario = Symbol('updateScenario');
const $updateSize = Symbol('updateSize');
const $disposeScene = Symbol('disposeScene');
const $loadEnvironment = Symbol('loadEnvironment');
const $canvas = Symbol('canvas');
const $renderer = Symbol('renderer');
const $scene = Symbol('scene');
const $camera = Symbol('camera');
const $pmremGenerator = Symbol('pmremGenerator');
const $gltfLoader = Symbol('gltfLoader');
const $environment = Symbol('environment');
const $background = Symbol('background');

@customElement('three-viewer')
export class ThreeViewer extends LitElement {
  @property({type: Object}) scenario: ScenarioConfig|null = null;
  private[$canvas]: HTMLCanvasElement|null = null;
  private[$renderer]!: WebGLRenderer;
  private[$scene]!: Scene;
  private[$camera]!: PerspectiveCamera;
  private[$pmremGenerator]!: PMREMGenerator;
  private[$gltfLoader]!: GLTFLoader;
  private[$environment]: Texture|null = null;
  private[$background]: Texture|null = null;

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    this[$updateSize]();

    if (changedProperties.has('scenario') && this.scenario != null) {
      this[$updateScenario](this.scenario);
    }
  }

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

  private[$initialize]() {
    this[$canvas] = this.shadowRoot!.querySelector('canvas');

    this[$renderer] = new WebGLRenderer({
      canvas: this[$canvas] || undefined,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this[$renderer].toneMapping = ACESFilmicToneMapping;
    this[$renderer].toneMappingExposure = 1;
    this[$renderer].setClearColor(0x000000, 0);

    this[$camera] = new PerspectiveCamera(45, 1, 0.01, 2000);
    this[$scene] = new Scene();

    this[$pmremGenerator] = new PMREMGenerator(this[$renderer]);
    this[$pmremGenerator].compileEquirectangularShader();

    const dracoLoader = new DRACOLoader().setDecoderPath(DRACO_DECODER_PATH);
    const ktx2Loader = new KTX2Loader()
                           .setTranscoderPath(KTX2_TRANSCODER_PATH)
                           .detectSupport(this[$renderer]);

    this[$gltfLoader] = new GLTFLoader()
                            .setDRACOLoader(dracoLoader)
                            .setKTX2Loader(ktx2Loader);
  }

  private async[$updateScenario](scenario: ScenarioConfig) {
    // Defer initialization until now: in Lit's lifecycle the canvas is added to
    // the shadow root after the constructor runs.
    if (this[$renderer] == null) {
      this[$initialize]();
    }

    const {
      orbit,
      target,
      verticalFoV,
      renderSkybox,
      lighting,
      model,
    } = scenario;

    const renderer = this[$renderer];
    const scene = this[$scene];
    const camera = this[$camera];

    // Reset any state left over from a previously rendered scenario.
    this[$disposeScene]();
    scene.background = null;
    scene.environment = null;
    renderer.setAnimationLoop(null);

    // Load the environment and the model in parallel.
    const [equirectangular, gltf] = await Promise.all([
      this[$loadEnvironment](lighting),
      this[$gltfLoader].loadAsync(model),
    ]);

    // Image-based lighting: use the equirectangular HDR as the IBL source via a
    // pre-filtered mipmapped radiance environment map (PMREM), matching how
    // <model-viewer> derives its lighting from the same .hdr file.
    equirectangular.mapping = EquirectangularReflectionMapping;
    const environment =
        this[$pmremGenerator].fromEquirectangular(equirectangular).texture;
    this[$environment] = environment;
    scene.environment = environment;

    if (renderSkybox) {
      this[$background] = equirectangular;
      scene.background = equirectangular;
    } else {
      equirectangular.dispose();
    }

    // Offset the model by the orbit target so the camera can orbit the origin,
    // mirroring the three-gpu-pathtracer renderer's framing math.
    const targetGroup = new Group();
    targetGroup.position.set(-target.x, -target.y, -target.z);
    targetGroup.add(gltf.scene);
    targetGroup.updateMatrixWorld(true);
    scene.add(targetGroup);

    // Frame the camera. Spherical coordinates follow <model-viewer>'s
    // (theta, phi, radius) convention: phi is the polar angle from +Y and theta
    // is the azimuth around +Y.
    const box = new Box3().setFromObject(targetGroup);
    const sphere = new Sphere();
    box.getBoundingSphere(sphere);
    const radius = Math.max(orbit.radius, sphere.radius, 1e-5);

    camera.position.setFromSphericalCoords(
        orbit.radius,
        MathUtils.DEG2RAD * orbit.phi,
        MathUtils.DEG2RAD * orbit.theta);
    camera.lookAt(0, 0, 0);
    camera.fov = verticalFoV;
    camera.near = 2 * radius / 1000;
    camera.far = 2 * radius;
    this[$updateSize]();

    // Render a couple of frames to ensure all textures have been uploaded and
    // the PMREM environment is resolved before signalling readiness.
    renderer.render(scene, camera);
    requestAnimationFrame(() => {
      renderer.render(scene, camera);
      this.dispatchEvent(
          new CustomEvent('model-visibility', {detail: {visible: true}}));
    });
  }

  private async[$loadEnvironment](url: string): Promise<Texture> {
    // Radiance (.hdr) environments are loaded as linear half-float data;
    // low-dynamic-range images (e.g. .jpg/.png) are loaded as sRGB textures.
    if (/\.hdr$/i.test(url)) {
      return new HDRLoader().loadAsync(url);
    }

    const texture = await new TextureLoader().loadAsync(url);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }

  private[$disposeScene]() {
    if (this[$scene] == null) {
      return;
    }

    this[$scene].traverse((object: any) => {
      if (object.geometry != null) {
        object.geometry.dispose();
      }
      const materials =
          Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (material == null) {
          continue;
        }
        for (const value of Object.values(material)) {
          if (value instanceof Texture) {
            value.dispose();
          }
        }
        material.dispose();
      }
    });
    this[$scene].clear();

    if (this[$environment] != null) {
      this[$environment]!.dispose();
      this[$environment] = null;
    }

    if (this[$background] != null) {
      this[$background]!.dispose();
      this[$background] = null;
    }
  }

  private[$updateSize]() {
    if (this[$canvas] == null || this.scenario == null ||
        this[$renderer] == null) {
      return;
    }

    const renderer = this[$renderer];
    const camera = this[$camera];
    const {dimensions} = this.scenario;

    const dpr = window.devicePixelRatio;
    const {width, height} = dimensions;

    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}
