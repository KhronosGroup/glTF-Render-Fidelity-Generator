import {css, html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js'
import Rn from 'rhodonite';

import {ScenarioConfig} from '../../common.js';

// Resolution of the environment cube map and of the prefiltered IBL maps.
const CUBE_MAP_SIZE = 512;
// Frames to render after everything is loaded before signalling readiness,
// so that MSAA resolves and the transmission back buffer are populated.
const FRAMES_BEFORE_READY = 3;

const $canvas = Symbol('canvas');
const $engine = Symbol('engine');
const $updateScenario = Symbol('updateScenario');
const $updateSize = Symbol('updateSize');

@customElement('rhodonite-viewer')
export class RhodoniteViewer extends LitElement {
  @property({type: Object}) scenario: ScenarioConfig|null = null;

  private[$canvas]: HTMLCanvasElement|null = null;
  private[$engine]: Rn.Engine|null = null;

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

    if (changedProperties.has('scenario') && this.scenario != null) {
      this[$updateScenario](this.scenario).catch((error) => {
        console.error(`Rhodonite failed to render scenario: ${
            error?.stack ?? error}`);
        // Lets the framework fail this scenario instead of waiting for it
        this.dispatchEvent(new CustomEvent(
            'model-error', {detail: {message: String(error?.message ?? error)}}));
      });
    }
  }

  private async[$updateScenario](scenario: ScenarioConfig) {
    this[$canvas] = this.shadowRoot!.querySelector('canvas');
    const canvas = this[$canvas]!;

    if (this[$engine] == null) {
      this[$engine] = await Rn.Engine.init({
        approach: Rn.ProcessApproach.DataTexture,
        canvas,
        notToDisplayRnInfoAtInit: true,
      });
    }
    const engine = this[$engine]!;

    const {width, height} = this[$updateSize]();

    // Scenario paths are relative to the renderer page.
    const resolveUrl = (url: string) => new URL(url, self.location.href).href;

    const {cameraEntity, cameraComponent} = createCamera(engine, scenario);

    const [mainExpression, environment] = await Promise.all([
      Rn.GltfImporter.importFromUrl(engine, resolveUrl(scenario.model), {
        cameraComponent,
        defaultMaterialHelperArgumentArray: [{makeOutputSrgb: false}],
      }),
      loadEnvironment(engine, resolveUrl(scenario.lighting)),
    ]);
    fitClipPlanesToModel(cameraEntity, mainExpression);

    const pipeline = new Rn.ForwardRenderPipeline(engine);
    await pipeline.setup(width, height, {isBloom: false, isShadow: false});
    pipeline.setToneMappingType(Rn.ToneMappingType.ACES_Hill_Exposure_Boost);

    const expressions = [mainExpression];
    if (scenario.renderSkybox) {
      expressions.unshift(
          createSkyboxExpression(engine, environment.cube, cameraEntity));
    }
    pipeline.setExpressions(expressions);
    pipeline.setIBLTextures(
        environment.diffuse as any,
        environment.specular as any,
        environment.sheen as any);

    let frameCount = 0;
    pipeline.startRenderLoop((frame: Rn.Frame) => {
      engine.process(frame);
      if (++frameCount === FRAMES_BEFORE_READY) {
        this.dispatchEvent(
            // This notifies the framework that the model is visible and the
            // screenshot can be taken
            new CustomEvent('model-visibility', {detail: {visible: true}}));
      }
    });
  }

  private[$updateSize]() {
    const {dimensions} = this.scenario!;
    const canvas = this[$canvas]!;

    const dpr = window.devicePixelRatio;
    const width = dimensions.width * dpr;
    const height = dimensions.height * dpr;

    this[$engine]!.resizeCanvas(width, height);
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    return {width, height};
  }
}

function createCamera(engine: Rn.Engine, scenario: ScenarioConfig) {
  const {target, orbit, verticalFoV, dimensions} = scenario;

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

  const cameraEntity = Rn.createCameraEntity(engine, true);
  const cameraComponent = cameraEntity.getCamera();

  // The camera looks from its local origin towards `direction`, so place the
  // entity at the eye and aim it at the target.
  cameraEntity.getTransform().localPosition =
      Rn.Vector3.fromCopyArray3(eye as [number, number, number]);
  cameraComponent.up = Rn.Vector3.fromCopy3(0, 1, 0);
  cameraComponent.direction = Rn.Vector3.normalize(Rn.Vector3.fromCopy3(
      center[0] - eye[0], center[1] - eye[1], center[2] - eye[2]));

  const far = 2 * Math.max(orbit.radius, 1e-3) * 10;
  cameraComponent.zNear = far / 1000;
  cameraComponent.zFar = far;
  cameraComponent.setFovyAndChangeFocalLength(verticalFoV);
  cameraComponent.aspect = dimensions.width / dimensions.height;

  return {cameraEntity, cameraComponent};
}

/**
 * The orbit radius says nothing about the model's size (it is 0 for cameras
 * placed inside a scene), so push the far plane out to contain the whole model.
 */
function fitClipPlanesToModel(
    cameraEntity: Rn.ICameraEntity, expression: Rn.Expression) {
  const cameraComponent = cameraEntity.getCamera();
  const eye = cameraEntity.getTransform().localPosition;

  let far = cameraComponent.zFar;
  for (const renderPass of expression.renderPasses) {
    for (const sceneGraph of renderPass.sceneTopLevelGraphComponents) {
      const aabb = sceneGraph.calcWorldMergedAABB();
      if (aabb.isVanilla()) {
        continue;
      }
      const {x, y, z} = aabb.centerPoint;
      const distance = Math.hypot(x - eye.x, y - eye.y, z - eye.z);
      far = Math.max(far, 2 * (distance + aabb.lengthCenterToCorner));
    }
  }

  cameraComponent.zNear = far / 1000;
  cameraComponent.zFar = far;
}

interface Environment {
  cube: Rn.RenderTargetTextureCube;
  diffuse: Rn.RenderTargetTextureCube;
  specular: Rn.RenderTargetTextureCube;
  sheen: Rn.RenderTargetTextureCube;
}

/**
 * Loads an equirectangular environment (Radiance .hdr or an 8-bit image),
 * converts it to a cube map and prefilters the diffuse, specular and sheen
 * IBL maps on the GPU.
 */
async function loadEnvironment(
    engine: Rn.Engine, url: string): Promise<Environment> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load environment ${url}: ${response.status}`);
  }
  const image = url.toLowerCase().endsWith('.hdr') ?
      parseHdr(new Uint8Array(await response.arrayBuffer())) :
      await decodeLdr(await response.blob());

  const panorama = new Rn.Texture(engine);
  panorama.allocate({
    width: image.width,
    height: image.height,
    format: Rn.TextureFormat.RGBA32F,
  });
  await panorama.loadImageToMipLevel({
    mipLevel: 0,
    xOffset: 0,
    yOffset: 0,
    width: image.width,
    height: image.height,
    rowSizeByPixel: image.width,
    data: image.data,
    type: Rn.ComponentType.Float,
  });

  const createCube = (mipLevelCount?: number) =>
      Rn.RenderableHelper.createFrameBufferCubeMap(engine, {
        width: CUBE_MAP_SIZE,
        height: CUBE_MAP_SIZE,
        textureFormat: Rn.TextureFormat.RGBA32F,
        mipLevelCount,
      });

  // Equirectangular panorama -> cube map
  const panoramaToCubeMaterial =
      Rn.MaterialHelper.createPanoramaToCubeMaterial(engine);
  const panoramaToCubeRenderPass =
      Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
          engine, panoramaToCubeMaterial, panorama);
  const [cubeFramebuffer, cube] = createCube();
  panoramaToCubeRenderPass.toClearColorBuffer = false;
  panoramaToCubeRenderPass.toClearDepthBuffer = false;
  panoramaToCubeRenderPass.isDepthTest = false;
  panoramaToCubeRenderPass.setFramebuffer(cubeFramebuffer);
  const panoramaToCubeExpression = new Rn.Expression();
  panoramaToCubeExpression.addRenderPasses([panoramaToCubeRenderPass]);

  for (let face = 0; face < 6; face++) {
    panoramaToCubeMaterial.setParameter('cubeMapFaceId', face);
    cubeFramebuffer.setColorAttachmentCubeAt(0, face, 0, cube);
    engine.process([panoramaToCubeExpression]);
  }
  cube.generateMipmaps();

  // Cube map -> prefiltered IBL maps
  const sampler = new Rn.Sampler(engine, {
    magFilter: Rn.TextureParameter.Linear,
    minFilter: Rn.TextureParameter.LinearMipmapLinear,
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
    wrapR: Rn.TextureParameter.ClampToEdge,
  });
  sampler.create();
  const prefilterMaterial = Rn.MaterialHelper.createPrefilterIBLMaterial(engine);
  const prefilterRenderPass =
      Rn.RenderPassHelper.createScreenDrawRenderPassWithBaseColorTexture(
          engine, prefilterMaterial, cube, sampler);
  prefilterRenderPass.toClearColorBuffer = false;
  prefilterRenderPass.toClearDepthBuffer = false;
  prefilterRenderPass.isDepthTest = false;
  const prefilterExpression = new Rn.Expression();
  prefilterExpression.addRenderPasses([prefilterRenderPass]);

  // distributionType: 0 = Lambertian, 1 = GGX, 2 = Charlie (sheen)
  const prefilter = (distributionType: number, mipLevelCount: number) => {
    const [framebuffer, target] = createCube(mipLevelCount);
    prefilterRenderPass.setFramebuffer(framebuffer);
    prefilterMaterial.setParameter('distributionType', distributionType);
    for (let mip = 0; mip < mipLevelCount; mip++) {
      const roughness = mipLevelCount > 1 ? mip / (mipLevelCount - 1) : 0;
      prefilterMaterial.setParameter('roughness', roughness);
      prefilterRenderPass.setViewport(Rn.Vector4.fromCopy4(
          0, 0, CUBE_MAP_SIZE >> mip, CUBE_MAP_SIZE >> mip));
      for (let face = 0; face < 6; face++) {
        prefilterMaterial.setParameter('cubeMapFaceId', face);
        framebuffer.setColorAttachmentCubeAt(0, face, mip, target);
        engine.process([prefilterExpression]);
      }
    }
    target.setIsTextureReady();
    return target;
  };

  const fullMipChain = Math.floor(Math.log2(CUBE_MAP_SIZE)) + 1;
  return {
    cube,
    diffuse: prefilter(0, 1),
    specular: prefilter(1, fullMipChain),
    sheen: prefilter(2, fullMipChain),
  };
}

function createSkyboxExpression(
    engine: Rn.Engine,
    cube: Rn.RenderTargetTextureCube,
    cameraEntity: Rn.ICameraEntity) {
  const material = Rn.MaterialHelper.createEnvConstantMaterial(engine);
  const sampler = new Rn.Sampler(engine, {
    wrapS: Rn.TextureParameter.ClampToEdge,
    wrapT: Rn.TextureParameter.ClampToEdge,
    minFilter: Rn.TextureParameter.Linear,
    magFilter: Rn.TextureParameter.Linear,
  });
  material.setTextureParameter('colorEnvTexture', cube as any, sampler);
  material.setParameter('envHdriFormat', Rn.HdriFormat.HDR_LINEAR.index);
  material.setParameter('makeOutputSrgb', 0);

  const sphere = new Rn.Sphere(engine);
  const camera = cameraEntity.getCamera();
  sphere.generate({
    radius: camera.zFar * 0.9,
    widthSegments: 40,
    heightSegments: 40,
    material,
  });
  const mesh = new Rn.Mesh(engine);
  mesh.addPrimitive(sphere);

  const sphereEntity = Rn.createMeshEntity(engine);
  sphereEntity.getTransform().localScale = Rn.Vector3.fromCopyArray([-1, 1, 1]);
  sphereEntity.getTransform().localPosition =
      cameraEntity.getTransform().localPosition;
  sphereEntity.getMesh().setMesh(mesh);

  const renderPass = new Rn.RenderPass(engine);
  renderPass.addEntities([sphereEntity]);
  renderPass.cameraComponent = camera;

  const expression = new Rn.Expression();
  expression.addRenderPasses([renderPass]);
  return expression;
}

interface FloatImage {
  width: number;
  height: number;
  data: Float32Array;  // RGBA, linear
}

/** Decodes a Radiance RGBE (.hdr) file, including RLE scanlines. */
function parseHdr(bytes: Uint8Array): FloatImage {
  let pos = 0;
  const readLine = () => {
    let line = '';
    while (pos < bytes.length && bytes[pos] !== 0x0a) {
      line += String.fromCharCode(bytes[pos++]);
    }
    pos++;
    return line;
  };

  if (!readLine().startsWith('#?')) {
    throw new Error('Not a Radiance HDR file');
  }
  for (let line = readLine(); line !== ''; line = readLine()) {
    if (line.startsWith('FORMAT=') && line !== 'FORMAT=32-bit_rle_rgbe') {
      throw new Error(`Unsupported HDR format: ${line}`);
    }
  }
  const resolution = readLine().match(/^-Y (\d+) \+X (\d+)$/);
  if (resolution == null) {
    throw new Error('Unsupported HDR orientation');
  }
  const height = parseInt(resolution[1]);
  const width = parseInt(resolution[2]);

  const data = new Float32Array(width * height * 4);
  const scanline = new Uint8Array(width * 4);
  for (let y = 0; y < height; y++) {
    const isRle = width >= 8 && width < 0x8000 && bytes[pos] === 2 &&
        bytes[pos + 1] === 2 && !(bytes[pos + 2] & 0x80);
    if (isRle) {
      pos += 4;
      for (let channel = 0; channel < 4; channel++) {
        for (let x = 0; x < width;) {
          let count = bytes[pos++];
          if (count > 128) {
            count -= 128;
            const value = bytes[pos++];
            for (let i = 0; i < count; i++) {
              scanline[(x++) * 4 + channel] = value;
            }
          } else {
            for (let i = 0; i < count; i++) {
              scanline[(x++) * 4 + channel] = bytes[pos++];
            }
          }
        }
      }
    } else {
      scanline.set(bytes.subarray(pos, pos + width * 4));
      pos += width * 4;
    }

    for (let x = 0; x < width; x++) {
      const e = scanline[x * 4 + 3];
      const scale = e === 0 ? 0 : Math.pow(2, e - 136);
      const i = (y * width + x) * 4;
      data[i] = scanline[x * 4] * scale;
      data[i + 1] = scanline[x * 4 + 1] * scale;
      data[i + 2] = scanline[x * 4 + 2] * scale;
      data[i + 3] = 1;
    }
  }

  return {width, height, data};
}

/** Decodes an 8-bit sRGB image into linear float RGBA. */
async function decodeLdr(blob: Blob): Promise<FloatImage> {
  const bitmap = await createImageBitmap(blob);
  const {width, height} = bitmap;
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d')!;
  context.drawImage(bitmap, 0, 0);
  const pixels = context.getImageData(0, 0, width, height).data;

  const toLinear = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const data = new Float32Array(width * height * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    data[i] = toLinear(pixels[i]);
    data[i + 1] = toLinear(pixels[i + 1]);
    data[i + 2] = toLinear(pixels[i + 2]);
    data[i + 3] = 1;
  }
  return {width, height, data};
}
