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

import {promises as fs} from 'fs';
import {mkdirp} from 'mkdirp';
import {join, resolve} from 'path';
import puppeteer, {Browser} from 'puppeteer';

import {DEVICE_PIXEL_RATIO, Dimensions, FIDELITY_TEST_THRESHOLD, FidelityRegressionResults, GoldenConfig, ImageComparator, ImageComparisonAnalysis, ImageComparisonConfig, ScenarioConfig, toDecibel} from './common.js';
import {ConfigReader} from './config-reader.js';
import {decodeRGBA, encodeWebpLossless, goldenFilename} from './image-io.js';


const $configReader = Symbol('configReader');

export type AnalysisResults = Array<ImageComparisonAnalysis>;

export interface ScenarioRecord extends ScenarioConfig {
  analysisResults: AnalysisResults;
}

export class ArtifactCreator {
  private[$configReader]: ConfigReader = new ConfigReader(this.config);
  private browser: Browser|null = null;

  constructor(
      protected config: ImageComparisonConfig, protected rootDirectory: string,
      protected baseUrl: string) {
    console.log('🌈 Preparing to capture screenshots for fidelity comparison');
  }

  async close() {
    if (this.browser != null) {
      await this.browser.close();
      this.browser = null;
    }
  }
  protected get outputDirectory(): string {
    return join(resolve(this.rootDirectory), 'results');
  }

  protected get goldens(): Array<GoldenConfig> {
    return this.config.renderers.map(
        renderer => ({...renderer, file: goldenFilename(renderer.name)}));
  }

  protected rendererGolden(renderer: string): GoldenConfig {
    const golden = this.goldens.find(golden => golden.name === renderer);
    if (golden == null) {
      throw new Error(
          `❌ Renderer "${renderer}" is not configured in the test config`);
    }
    return golden;
  }

  /**
   * Returns the names of renderers whose goldens are missing for this
   * scenario. Those renderers are skipped rather than failing the comparison.
   */
  async compareRenderers(scenario: ScenarioConfig, renderer: string):
      Promise<Array<string>> {
    const analysisResults: AnalysisResults = [];
    const missingGoldens: Array<string> = [];
    const {rootDirectory, outputDirectory, goldens} = this;
    const {name: scenarioName, exclude, dimensions} = scenario;

    // skip if this renderer is excluded from this scenario
    if (exclude != null && exclude.includes(renderer)) {
      return missingGoldens;
    }

    console.log(
        `Start to compare ${renderer}'s golden with other renderers' goldens:`);

    const rendererGoldenFile = this.rendererGolden(renderer).file;
    const rendererGoldenPath =
        join(rootDirectory, 'goldens', scenarioName, rendererGoldenFile);
    let rendererGolden;
    try {
      rendererGolden = await fs.readFile(rendererGoldenPath);
    } catch (error) {
      throw new Error(`❌ Failed to read ${renderer}'s ${
          scenarioName} golden! Error message: ${error.message}`);
    }

    // save goldens images to result folder which will be used to show in the
    // result-viewer page.
    await fs.writeFile(
        join(outputDirectory, scenarioName, rendererGoldenFile),
        rendererGolden);

    const rendererGoldenImage = await decodeRGBA(rendererGolden);

    for (const golden of goldens) {
      if (golden.name === renderer ||
          (exclude != null && exclude.includes(golden.name))) {
        continue;
      }

      console.log(`\n🔍 Comparing ${renderer} to ${golden.description}`);

      const candidateGoldenPath =
          join(rootDirectory, 'goldens', scenarioName, golden.file);
      let candidateGolden;
      try {
        candidateGolden = await fs.readFile(candidateGoldenPath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw new Error(`❌ Failed to read ${golden.name}'s ${
              scenarioName} golden! Error message: ${error.message}`);
        }
        console.warn(`⚠️ ${golden.name}'s ${
            scenarioName} golden is missing, skipping it`);
        missingGoldens.push(golden.name);
        continue;
      }

      // save goldens images to result folder which will be used to show in the
      // result-viewer page.
      await fs.writeFile(
          join(outputDirectory, scenarioName, golden.file), candidateGolden);

      const candidateGoldenImage = await decodeRGBA(candidateGolden);
      const analysisResult = await this.analyze(
          rendererGoldenImage, candidateGoldenImage, dimensions);
      analysisResults.push(analysisResult);
    }
    // record missing goldens as excluded so the results viewer hides them and
    // keeps analysisResults aligned with the remaining renderers
    const scenarioRecord = {
      analysisResults,
      scenario: {...scenario, exclude: [...(exclude ?? []), ...missingGoldens]}
    };

    console.log(`\n💾 Recording analysis`);
    await fs.writeFile(
        join(outputDirectory, scenarioName, 'analysis.json'),
        JSON.stringify(scenarioRecord));

    return missingGoldens;
  }

  async captureAndAnalyzeScreenshot(
      scenario: ScenarioConfig, renderer: string,
      quiet: boolean = false): Promise<ImageComparisonAnalysis> {
    const {rootDirectory} = this;
    const {name: scenarioName, dimensions, exclude} = scenario;

    console.log(`start compare ${renderer}'s golden with ${
        renderer}'s screenshot generated from fidelity test:`);

    let screenshot: Uint8Array|undefined;
    try {
      // set the output path to an empty string to tell puppeteer to not save
      // the screenshot image
      screenshot = await this.captureScreenshot(
          renderer, scenarioName, dimensions, '', 60, quiet);
    } catch (error) {
      if (this.browser != null) {
        await this.browser.close();
        this.browser = null;
      }
      throw new Error(`❌ Failed to capture ${renderer}'s screenshot of ${
          scenarioName}. Error message: ${error.message}`);
    }

    if (screenshot == null) {
      throw new Error(`❌ ${renderer}'s screenshot of ${
          scenarioName} is not captured correctly (value is null).`);
    }
    const screenshotImage = await decodeRGBA(screenshot);

    const rendererGoldenPath = join(
        rootDirectory, 'goldens', scenarioName,
        this.rendererGolden(renderer).file);
    let rendererGolden;
    try {
      rendererGolden = await fs.readFile(rendererGoldenPath);
    } catch (error) {
      throw new Error(`❌ Failed to read ${renderer}'s ${
          scenarioName} golden! Error message: ${error.message}`);
    }
    const rendererGoldenImage = await decodeRGBA(rendererGolden);

    const result =
        await this.analyze(screenshotImage, rendererGoldenImage, dimensions);

    const rmsInDb = toDecibel(result.rmsDistanceRatio);

    // the rmsInDb is negative, and the less negative means the less closer the
    // two images are
    if (rmsInDb > FIDELITY_TEST_THRESHOLD) {
      if (exclude?.includes(renderer)) {
        console.log(`❌ Skipped! Senario name: ${
            scenario.name}, rms distance ratio: ${rmsInDb.toFixed(2)} dB.`);
      } else {
        throw new Error(`❌ Senarios name: ${
            scenario.name}, rms distance ratio: ${rmsInDb.toFixed(2)} dB.`);
      }
    }

    return result;
  }

  async fidelityTest(
      scenarioWhitelist: Set<string>|null = null, renderer: string,
      dryRun: boolean = false, quiet: boolean = false) {
    const {scenarios} = this.config;
    const {outputDirectory} = this;
    const analyzedScenarios: Array<ScenarioConfig> = [];
    const fidelityRegressionResults:
        FidelityRegressionResults = {results: [], errors: [], warnings: []};

    const compareRenderersErrors: Array<string> = [];

    for (const scenarioBase of scenarios) {
      const scenarioName = scenarioBase.name;
      const scenario = this[$configReader].scenarioConfig(scenarioName)!;

      // skip if white lists exists and this scenario isn't in it
      if (scenarioWhitelist != null && !scenarioWhitelist.has(scenarioName)) {
        continue;
      }

      // skip if this renderer is excluded from this scenario
      if (scenario.exclude != null && scenario.exclude.includes(renderer)) {
        continue;
      }

      console.log(`\n🎨 Scenario: ${scenarioName}`);

      const scenarioOutputDirectory = join(outputDirectory, scenarioName);
      mkdirp.sync(scenarioOutputDirectory);

      let missingGoldens: Array<string> = [];
      try {
        missingGoldens = await this.compareRenderers(scenario, renderer);
      } catch (error) {
        const errorMessage =
            `❌Fail to compare ${renderer} with other renderers of scenario ${
                scenarioName}. Error message: ${error.message}`;
        compareRenderersErrors.push(errorMessage);
      }

      if (!dryRun) {
        try {
          const autoTestResult =
              await this.captureAndAnalyzeScreenshot(scenario, renderer, quiet);
          fidelityRegressionResults.results.push(autoTestResult);
        } catch (error) {
          const message = `❌Fail to analyze scenario :${
              scenarioName}! Error message: ${error.message}`;

          fidelityRegressionResults.errors.push(message);
        }
      }

      // record the scenario even on a dry run so the results viewer can show
      // the golden-vs-golden comparisons
      analyzedScenarios.push({
        ...scenario,
        exclude: [...(scenario.exclude ?? []), ...missingGoldens]
      });
    }


    console.log('💾 Recording configuration');

    const finalConfig: ImageComparisonConfig = Object.assign(
        {},
        this.config,
        {scenarios: analyzedScenarios, errors: compareRenderersErrors});

    // ensure directory exists, this can happen if all scenarios are ignored
    await fs.mkdir(outputDirectory, {recursive: true});

    await fs.writeFile(
        join(outputDirectory, 'config.json'), JSON.stringify(finalConfig));

    await fs.writeFile(
        join(outputDirectory, 'fidelityRegressionResults.json'),
        JSON.stringify(fidelityRegressionResults));
  }

  protected async analyze(
      candidateImage: Uint8ClampedArray, goldenImage: Uint8ClampedArray,
      dimensions: Dimensions): Promise<ImageComparisonAnalysis> {
    const imageDimensions = {
      width: dimensions.width * DEVICE_PIXEL_RATIO,
      height: dimensions.height * DEVICE_PIXEL_RATIO
    };
    const comparator =
        new ImageComparator(candidateImage, goldenImage, imageDimensions);

    const {analysis} = comparator.analyze();
    const {rmsDistanceRatio} = analysis;
    console.log(`\n  📊 Decibels of root mean square color distance: ${
        (10 * Math.log10(rmsDistanceRatio)).toFixed(2)}`);

    return analysis;
  }


  async captureScreenshot(
      renderer: string, scenarioName: string, dimensions: Dimensions,
      outputPath: string = join(this.outputDirectory, 'gltf-sample-viewer.webp'),
      maxTimeInSec: number = -1, quiet: boolean = false,
      model: string|null = null) {
    const scaledWidth = dimensions.width;
    const scaledHeight = dimensions.height;
    const rendererConfig = this[$configReader].rendererConfig(renderer);

    if (rendererConfig == null) {
      console.log(`⚠️ Renderer "${
          renderer}" is not configured. Did you add it to the test config?`);
      return;
    }


    if (this.browser == null) {
      console.log(`🚀 Launching browser`);
      // Headless Chrome hides scrollbars by default; --hide-scrollbars does
      // the same in headed mode so screenshots match either way.
      this.browser = await puppeteer.launch({
        headless: quiet,
        protocolTimeout: 0,
        args: ['--ignore-gpu-blocklist', '--enable-gpu', '--hide-scrollbars']
      });
    }

    const page = await this.browser.newPage();

    const url = `${this.baseUrl}?hide-ui&config=../../config.json&scenario=${
        encodeURIComponent(scenarioName)}${
        model != null ? `&model=${encodeURIComponent(model)}` : ''}`;

    await page.setViewport({
      width: scaledWidth,
      height: scaledHeight,
      deviceScaleFactor: DEVICE_PIXEL_RATIO
    });

    // Uncaught exceptions, unhandled rejections and crashes in the page mean
    // the model will never become ready, so they fail the capture.
    let failPage: (error: Error) => void;
    const pageFailure = new Promise<never>((_, reject) => {
      failPage = reject;
    });
    // Avoids an unhandled rejection when the page fails before it is awaited
    pageFailure.catch(() => {});

    page.on('error', (error: any) => {
      console.log(`🚨 ${error}`);
      failPage(new Error(`Page crashed: ${error?.message ?? error}`));
    });

    page.on('pageerror', (error: any) => {
      console.log(`🚨 Page error: ${error?.stack ?? error}`);
      failPage(new Error(`Page error: ${error?.message ?? error}`));
    });

    page.on('requestfailed', (request: any) => {
      console.log(`🚨 Request failed: ${request.url()} (${
          request.failure()?.errorText})`);
    });

    page.on('response', (response: any) => {
      if (response.status() >= 400) {
        console.log(`🚨 HTTP ${response.status()}: ${response.url()}`);
      }
    });

    page.on('console', async (message: any) => {
      const args =
          await Promise.all(message.args().map((arg: any) => arg.jsonValue()));

      if (args.length) {
        console.log(`➡️`, ...args);
      }
    });

    console.log(`🗺  Navigating to ${url}`);

    let evaluateError: string|null;
    try {
      await Promise.race([page.goto(url), pageFailure]);

      console.log(
          `🖌  Rendering ${scenarioName} with ${rendererConfig.description}`);

      // NOTE: The function passed to page.evaluate is stringified and eval'd
      // in a browser context. Importantly, this implies that no external
      // variables are captured in its closure scope. TypeScript compiler
      // currently has no mechanism to detect this and will happily tell you
      // your code is correct when it isn't.
      evaluateError = await Promise.race([
        page.evaluate(async (maxTimeInSec: number) => {
          const modelBecomesReady = new Promise<void>((resolve, reject) => {
            let timeout: NodeJS.Timeout;
            if (maxTimeInSec > 0) {
              timeout = setTimeout(() => {
                reject(new Error(
                    `Stop capturing screenshot after ${maxTimeInSec} seconds`));
              }, maxTimeInSec * 1000);
            }

            self.addEventListener('model-ready', () => {
              if (maxTimeInSec > 0) {
                clearTimeout(timeout);
              }
              resolve();
            }, {once: true});

            // Renderers dispatch this when they fail to load or render
            self.addEventListener('model-error', (event: Event) => {
              if (maxTimeInSec > 0) {
                clearTimeout(timeout);
              }
              const {message} = (event as CustomEvent).detail ?? {};
              reject(new Error(`Renderer error: ${message ?? 'unknown'}`));
            }, {once: true});
          });

          try {
            await modelBecomesReady;
            return null;
          } catch (error) {
            return error.message;
          }
        }, maxTimeInSec),
        pageFailure
      ]);
    } catch (error) {
      evaluateError = error.message;
    }

    if (evaluateError) {
      console.log(`🚨 ${evaluateError}`);
      await page.close().catch(() => {});
      throw new Error(evaluateError);
    }

    console.log(`🖼  Capturing screenshot`);

    try {
      await fs.mkdir(this.outputDirectory);
    } catch (e) {
      // Ignored...
    }

    // Capture as a PNG and re-encode
    // it as lossless WebP. 
    // Directly requesting WebP might encode
    // in lower quality on some browsers.
    const screenshot =
        await page.screenshot({type: 'png', omitBackground: true});

    await page.close();

    if (outputPath) {
      await fs.writeFile(outputPath, await encodeWebpLossless(screenshot));
    }

    return screenshot;
  }
}
