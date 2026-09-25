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

import { api } from '@eclipse-che/common';
import * as mockClient from '@kubernetes/client-node';
import { CustomObjectsApi } from '@kubernetes/client-node';

import { SANDBOX_GROUP, SANDBOX_PLURAL, SANDBOX_VERSION } from '@/constants/k8s';
import { SandboxApiService } from '@/devworkspaceClient/services/sandboxApi';

const namespace = 'user-che';
const name = 'my-sandbox';

describe('Sandbox API Service', () => {
  let sandboxService: SandboxApiService;

  const stubCustomObjectsApi = {
    createNamespacedCustomObject: () => Promise.resolve(getSandbox()),
    deleteNamespacedCustomObject: () => Promise.resolve({}),
    getNamespacedCustomObject: () => Promise.resolve(getSandbox()),
    listNamespacedCustomObject: () => Promise.resolve(getSandboxList()),
    patchNamespacedCustomObject: () => Promise.resolve(getSandbox()),
  } as unknown as CustomObjectsApi;

  const spyCreateNamespacedCustomObject = jest.spyOn(
    stubCustomObjectsApi,
    'createNamespacedCustomObject',
  );
  const spyDeleteNamespacedCustomObject = jest.spyOn(
    stubCustomObjectsApi,
    'deleteNamespacedCustomObject',
  );
  const spyGetNamespacedCustomObject = jest.spyOn(
    stubCustomObjectsApi,
    'getNamespacedCustomObject',
  );
  const spyListNamespacedCustomObject = jest.spyOn(
    stubCustomObjectsApi,
    'listNamespacedCustomObject',
  );
  const spyPatchNamespacedCustomObject = jest.spyOn(
    stubCustomObjectsApi,
    'patchNamespacedCustomObject',
  );

  beforeEach(() => {
    const { KubeConfig } = mockClient;
    const kubeConfig = new KubeConfig();

    kubeConfig.makeApiClient = jest.fn().mockImplementation(() => stubCustomObjectsApi);

    sandboxService = new SandboxApiService(kubeConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('listing sandboxes', async () => {
    const res = await sandboxService.listInNamespace(namespace);

    expect(res).toEqual(getSandboxList());
    expect(spyListNamespacedCustomObject).toHaveBeenCalledWith({
      group: SANDBOX_GROUP,
      version: SANDBOX_VERSION,
      namespace,
      plural: SANDBOX_PLURAL,
    });
  });

  test('listing sandboxes when the API returns no items', async () => {
    spyListNamespacedCustomObject.mockResolvedValueOnce({
      apiVersion: 'agents.x-k8s.io/v1beta1',
      kind: 'SandboxList',
    });

    const res = await sandboxService.listInNamespace(namespace);

    expect(res.items).toEqual([]);
  });

  test('getting by name', async () => {
    const res = await sandboxService.getByName(namespace, name);

    expect(res).toEqual(getSandbox());
    expect(spyGetNamespacedCustomObject).toHaveBeenCalledWith({
      group: SANDBOX_GROUP,
      version: SANDBOX_VERSION,
      namespace,
      plural: SANDBOX_PLURAL,
      name,
    });
  });

  test('creating', async () => {
    const res = await sandboxService.create(namespace, {
      metadata: { name },
      spec: getSandbox().spec,
    });

    expect(res).toEqual(getSandbox());
    expect(spyCreateNamespacedCustomObject).toHaveBeenCalledWith({
      group: SANDBOX_GROUP,
      version: SANDBOX_VERSION,
      namespace,
      plural: SANDBOX_PLURAL,
      body: {
        apiVersion: 'agents.x-k8s.io/v1beta1',
        kind: 'Sandbox',
        metadata: { name, namespace },
        spec: getSandbox().spec,
      },
    });
  });

  test('patching', async () => {
    const patches: api.IPatch[] = [
      {
        op: 'add',
        path: '/spec/operatingMode',
        value: 'Suspended',
      },
    ];

    const res = await sandboxService.patch(namespace, name, patches);

    expect(res).toEqual(getSandbox());
    expect(spyPatchNamespacedCustomObject).toHaveBeenCalledWith(
      {
        group: SANDBOX_GROUP,
        version: SANDBOX_VERSION,
        namespace,
        plural: SANDBOX_PLURAL,
        name,
        body: patches,
      },
      expect.anything(),
    );
  });

  test('deleting', async () => {
    await sandboxService.delete(namespace, name);

    expect(spyDeleteNamespacedCustomObject).toHaveBeenCalledWith({
      group: SANDBOX_GROUP,
      version: SANDBOX_VERSION,
      namespace,
      plural: SANDBOX_PLURAL,
      name,
    });
  });

  describe('error handling', () => {
    let rejectingSandboxService: SandboxApiService;

    beforeEach(() => {
      // A 404 Kubernetes client error short-circuits the retry loop
      const notFoundError = Object.assign(new Error('not found'), {
        code: 404,
        headers: {},
        body: { message: 'sandboxes.agents.x-k8s.io not found' },
      });
      const rejectingCustomObjectsApi = {
        createNamespacedCustomObject: jest.fn().mockRejectedValue(notFoundError),
        deleteNamespacedCustomObject: jest.fn().mockRejectedValue(notFoundError),
        getNamespacedCustomObject: jest.fn().mockRejectedValue(notFoundError),
        listNamespacedCustomObject: jest.fn().mockRejectedValue(notFoundError),
        patchNamespacedCustomObject: jest.fn().mockRejectedValue(notFoundError),
      } as unknown as CustomObjectsApi;

      const { KubeConfig } = mockClient;
      const kubeConfig = new KubeConfig();
      kubeConfig.makeApiClient = jest.fn().mockImplementation(() => rejectingCustomObjectsApi);

      rejectingSandboxService = new SandboxApiService(kubeConfig);
    });

    test('list failure', async () => {
      await expect(rejectingSandboxService.listInNamespace(namespace)).rejects.toThrow(
        'Unable to list sandboxes',
      );
    });

    test('get failure', async () => {
      await expect(rejectingSandboxService.getByName(namespace, name)).rejects.toThrow(
        `Unable to get sandbox "${namespace}/${name}"`,
      );
    });

    test('create failure', async () => {
      await expect(
        rejectingSandboxService.create(namespace, { metadata: { name }, spec: getSandbox().spec }),
      ).rejects.toThrow('Unable to create sandbox');
    });

    test('patch failure', async () => {
      await expect(rejectingSandboxService.patch(namespace, name, [])).rejects.toThrow(
        `Unable to patch sandbox "${namespace}/${name}"`,
      );
    });

    test('delete failure', async () => {
      await expect(rejectingSandboxService.delete(namespace, name)).rejects.toThrow(
        `Unable to delete sandbox "${namespace}/${name}"`,
      );
    });
  });
});

function getSandbox(): api.ISandbox {
  return {
    apiVersion: 'agents.x-k8s.io/v1beta1',
    kind: 'Sandbox',
    metadata: {
      name,
      namespace,
    },
    spec: {
      operatingMode: 'Running',
      podTemplate: {
        spec: {
          containers: [
            {
              name: 'main',
              image: 'quay.io/sandbox/hello-world:latest',
            },
          ],
        },
      },
    },
  };
}

function getSandboxList(): api.ISandboxList {
  return {
    apiVersion: 'agents.x-k8s.io/v1beta1',
    kind: 'SandboxList',
    metadata: {
      resourceVersion: '123',
    },
    items: [getSandbox()],
  };
}
