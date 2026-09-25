/*
 * Copyright (c) 2018-2025 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { api, helpers } from '@eclipse-che/common';

import { AxiosWrapper } from '@/services/axios-wrapper/axiosWrapper';
import { dashboardBackendPrefix } from '@/services/backend-client/const';

export async function fetchSandboxes(namespace: string): Promise<api.ISandbox[]> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().get<api.ISandboxList>(
      `${dashboardBackendPrefix}/namespace/${namespace}/sandboxes`,
    );
    return response.data.items || [];
  } catch (e) {
    throw new Error(`Failed to fetch sandboxes. ${helpers.errors.getMessage(e)}`);
  }
}

export async function fetchSandbox(namespace: string, name: string): Promise<api.ISandbox> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().get<api.ISandbox>(
      `${dashboardBackendPrefix}/namespace/${namespace}/sandboxes/${name}`,
    );
    return response.data;
  } catch (e) {
    throw new Error(`Failed to fetch the sandbox '${name}'. ${helpers.errors.getMessage(e)}`);
  }
}

export async function createSandbox(
  namespace: string,
  sandbox: api.ISandbox,
): Promise<api.ISandbox> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().post<api.ISandbox>(
      `${dashboardBackendPrefix}/namespace/${namespace}/sandboxes`,
      sandbox,
    );
    return response.data;
  } catch (e) {
    throw new Error(`Failed to create the sandbox. ${helpers.errors.getMessage(e)}`);
  }
}

export async function patchSandbox(
  namespace: string,
  name: string,
  patches: api.IPatch[],
): Promise<api.ISandbox> {
  try {
    const response = await AxiosWrapper.createToRetryMissedBearerTokenError().patch<api.ISandbox>(
      `${dashboardBackendPrefix}/namespace/${namespace}/sandboxes/${name}`,
      patches,
    );
    return response.data;
  } catch (e) {
    throw new Error(`Failed to update the sandbox '${name}'. ${helpers.errors.getMessage(e)}`);
  }
}

export async function deleteSandbox(namespace: string, name: string): Promise<void> {
  try {
    await AxiosWrapper.createToRetryMissedBearerTokenError().delete(
      `${dashboardBackendPrefix}/namespace/${namespace}/sandboxes/${name}`,
    );
  } catch (e) {
    throw new Error(`Failed to delete the sandbox '${name}'. ${helpers.errors.getMessage(e)}`);
  }
}
