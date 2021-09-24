/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

export function conditionalTest(testName: string, testCondition: () => boolean | Promise<boolean>, testCallback: (done: jest.DoneCallback) => void | Promise<void>, timeout: number): void {
    it(testName, async (done) => {
        const evaluatedCondition = await testCondition();
        if (evaluatedCondition) {
            testCallback(done);
        } else {
            console.warn(`${testName} was skipped`);
            done();
        }
    }, timeout);
}

export const INTEGRATION_TEST_ENV = 'INTEGRATION_TESTS';
export const isIntegrationTestEnabled = () => INTEGRATION_TEST_ENV in process.env && process.env[INTEGRATION_TEST_ENV] === 'true';

export async function delay(ms = 500): Promise<void> {
  await new Promise<void>(resolve => setTimeout(resolve, ms));
}
