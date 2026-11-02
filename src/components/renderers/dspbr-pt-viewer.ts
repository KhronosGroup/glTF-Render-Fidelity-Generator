/* @license
 * Copyright 2019 Google LLC. All Rights Reserved.
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

// 'dspbr-pt' is the local package at dspbr-pt/packages/lib
// built with `npm run build:dspbr-pt`
import {createPathtracingViewport, PathtracingViewport} from 'dspbr-pt';
import {css, html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js'
import {ScenarioConfig} from '../../common.js';

const DEFAULT_NUM_SAMPLES = 128;

const $canvas = Symbol('canvas');
const $viewport = Symbol('viewport');
const $updateScenario = Symbol('scenario');
const $updateSize = Symbol('updateSize');
const $updateCamera = Symbol('updateCamera');

@customElement('dspbr-pt-viewer')
export class PathtracingViewer extends LitElement {
  @property({type: Object}) scenario: ScenarioConfig|null = null;

  private[$canvas]: HTMLCanvasElement|null = null;
  private[$viewport]: PathtracingViewport|null = null;

  disconnectedCallback() {
    super.disconnectedCallback();
    this[$viewport]?.dispose();
    this[$viewport] = null;
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);

    if (changedProperties.has('scenario') && this.scenario != null) {
      this[$updateScenario](this.scenario).catch((error) => {
        console.error(`dspbr-pt failed to render scenario: ${
            error?.stack ?? error}`);
        // Lets the framework fail this scenario instead of waiting for it
        this.dispatchEvent(new CustomEvent(
            'model-error', {detail: {message: String(error?.message ?? error)}}));
      });
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

  private async[$updateScenario](scenario: ScenarioConfig) {
    this[$canvas] = this.shadowRoot!.querySelector('canvas');

    this[$viewport]?.dispose();
    const viewport = createPathtracingViewport({
      canvas: this[$canvas]!,
      settings: {
        pixelRatio: 1.0,
        exposure: 1.0,
        maxBounces: 8,
        toneMapping: 'AcesFilm',
        showBackground: scenario.renderSkybox,
        iblRotationDegrees: 180,
        backgroundColor: [0, 0, 0, 0],
      },
    });
    this[$viewport] = viewport;

    this[$updateSize]();

    const resolveUrl = (url: string) => new URL(url, self.location.href).href;

    await Promise.all([
      viewport.loadSceneFromUrl(resolveUrl(scenario.model)),
      scenario.lighting ? viewport.loadIblFromUrl(resolveUrl(scenario.lighting)) :
                          Promise.resolve(),
    ]);

    this[$updateCamera]();

    const numSamples = scenario.pt?.numSamples ?? DEFAULT_NUM_SAMPLES;
    console.log('Rendering ' + numSamples + ' samples');

    viewport.on('frameRendered', ({frameCount}) => {
      if (frameCount % 100 == 0) {
        console.log(frameCount, '/', numSamples);
      }
    });

    viewport.on('renderFinished', () => {
      console.log('Done!');
      requestAnimationFrame(() => {
        this.dispatchEvent(
            new CustomEvent('model-visibility', {detail: {visible: true}}));
      });
    });

    viewport.start(numSamples);
  }

  private[$updateSize]() {
    if (this[$canvas] == null || this[$viewport] == null ||
        this.scenario == null) {
      return;
    }

    const {dimensions} = this.scenario;

    const width = dimensions.width * window.devicePixelRatio;
    const height = dimensions.height * window.devicePixelRatio;

    this[$canvas]!.style.width = `${dimensions.width}px`;
    this[$canvas]!.style.height = `${dimensions.height}px`;
    this[$viewport]!.resize(width, height);
  }

  private[$updateCamera]() {
    const {target, orbit, verticalFoV} = this.scenario!;

    const center = [target.x, target.y, target.z];

    const theta = orbit.theta * Math.PI / 180;
    const phi = orbit.phi * Math.PI / 180;
    const radiusSinPhi = orbit.radius * Math.sin(phi);
    const eye = [
      radiusSinPhi * Math.sin(theta) + target.x,
      orbit.radius * Math.cos(phi) + target.y,
      radiusSinPhi * Math.cos(theta) + target.z
    ];
    if (orbit.radius <= 0) {
      center[0] = eye[0] - Math.sin(phi) * Math.sin(theta);
      center[1] = eye[1] - Math.cos(phi);
      center[2] = eye[2] - Math.sin(phi) * Math.cos(theta);
    }

    // Handle phi = 0 or 180.
    const up = {
      x: -Math.cos(phi) * Math.sin(theta),
      y: Math.sin(phi),
      z: -Math.cos(phi) * Math.cos(theta)
    };

    this[$viewport]!.setLookAtCamera({
      position: {x: eye[0], y: eye[1], z: eye[2]},
      target: {x: center[0], y: center[1], z: center[2]},
      up,
      fov: verticalFoV,
      near: Math.max(orbit.radius, 1e-3) / 1000,
    });
  }
}
