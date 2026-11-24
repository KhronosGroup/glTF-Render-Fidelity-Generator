/* @license
 * Copyright 2022 Google LLC. All Rights Reserved.
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

import {spawnSync} from 'child_process';
import {normalize} from 'path';

import {ScenarioConfig} from '../../common.js';

export const rendererOffline = async(
    scenario: ScenarioConfig|null,
    rendererCommand: string,
    rendererArgs: string[],
    outputFile: string): Promise<void> => {
  if (scenario == null) {
    throw new Error(' Scenario not specified!');
  }

  if (outputFile == null) {
    throw new Error(' Output file not specified!');
  }

  let renderConfig = {scenario: scenario, outputFile: outputFile}

  const args = rendererArgs.concat([JSON.stringify(renderConfig)])
  // Normalize so the configured path can use either / or \ as separator.
  // Renderers can log a lot, so allow more output than the 1 MB default, past
  // which Node kills the process.
  const result = spawnSync(
      normalize(rendererCommand), args, {maxBuffer: 256 * 1024 * 1024});

  // The last lines of output, which usually say why a render failed
  const outputTail = () =>
      `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim().split(/\r?\n/)
          .slice(-20)
          .join('\n');

  if (result.error) {  // handle issues with the external process
    throw new Error(`${result.error.message}\n${outputTail()}`);
  } else if (result.status != 0) {  // handle renderer issues
    throw new Error(`exit code ${result.status}${
        result.signal ? `, signal ${result.signal}` : ''}\n${outputTail()}`);
  } else {  // succceed!
    console.log('done!\n')
    console.log(result.stdout.toString());
  }
};
