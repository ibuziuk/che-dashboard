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

import mockAxios from 'axios';

import {
  createSandbox,
  deleteSandbox,
  fetchSandbox,
  fetchSandboxes,
  patchSandbox,
} from '@/services/backend-client/sandboxApi';
import { buildSandbox } from '@/store/__mocks__/sandboxBuilder';

describe('Sandbox API', () => {
  const mockGet = mockAxios.get as jest.Mock;
  const mockPost = mockAxios.post as jest.Mock;
  const mockPatch = mockAxios.patch as jest.Mock;
  const mockDelete = mockAxios.delete as jest.Mock;

  const namespace = 'user-che';
  const name = 'my-sandbox';
  const sandbox = buildSandbox({ name, namespace });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('fetchSandboxes', () => {
    it('should return the list items', async () => {
      mockGet.mockResolvedValueOnce({ data: { items: [sandbox] } });

      const result = await fetchSandboxes(namespace);

      expect(mockGet).toHaveBeenCalledWith(
        `/dashboard/api/namespace/${namespace}/sandboxes`,
        undefined,
      );
      expect(result).toEqual([sandbox]);
    });

    it('should return an empty array when the list has no items', async () => {
      mockGet.mockResolvedValueOnce({ data: {} });

      await expect(fetchSandboxes(namespace)).resolves.toEqual([]);
    });

    it('should throw a readable error', async () => {
      mockGet.mockRejectedValueOnce(new Error('network down'));

      await expect(fetchSandboxes(namespace)).rejects.toThrow(
        'Failed to fetch sandboxes. network down',
      );
    });
  });

  describe('fetchSandbox', () => {
    it('should return the sandbox', async () => {
      mockGet.mockResolvedValueOnce({ data: sandbox });

      const result = await fetchSandbox(namespace, name);

      expect(mockGet).toHaveBeenCalledWith(
        `/dashboard/api/namespace/${namespace}/sandboxes/${name}`,
        undefined,
      );
      expect(result).toEqual(sandbox);
    });

    it('should throw a readable error', async () => {
      mockGet.mockRejectedValueOnce(new Error('not found'));

      await expect(fetchSandbox(namespace, name)).rejects.toThrow(
        `Failed to fetch the sandbox '${name}'. not found`,
      );
    });
  });

  describe('createSandbox', () => {
    it('should post the sandbox', async () => {
      mockPost.mockResolvedValueOnce({ data: sandbox });

      const result = await createSandbox(namespace, sandbox);

      expect(mockPost).toHaveBeenCalledWith(
        `/dashboard/api/namespace/${namespace}/sandboxes`,
        sandbox,
        undefined,
      );
      expect(result).toEqual(sandbox);
    });

    it('should throw a readable error', async () => {
      mockPost.mockRejectedValueOnce(new Error('already exists'));

      await expect(createSandbox(namespace, sandbox)).rejects.toThrow(
        'Failed to create the sandbox. already exists',
      );
    });
  });

  describe('patchSandbox', () => {
    const patches = [{ op: 'add', path: '/spec/operatingMode', value: 'Suspended' }];

    it('should patch the sandbox', async () => {
      mockPatch.mockResolvedValueOnce({ data: sandbox });

      const result = await patchSandbox(namespace, name, patches);

      expect(mockPatch).toHaveBeenCalledWith(
        `/dashboard/api/namespace/${namespace}/sandboxes/${name}`,
        patches,
        undefined,
      );
      expect(result).toEqual(sandbox);
    });

    it('should throw a readable error', async () => {
      mockPatch.mockRejectedValueOnce(new Error('conflict'));

      await expect(patchSandbox(namespace, name, patches)).rejects.toThrow(
        `Failed to update the sandbox '${name}'. conflict`,
      );
    });
  });

  describe('deleteSandbox', () => {
    it('should delete the sandbox', async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      await deleteSandbox(namespace, name);

      expect(mockDelete).toHaveBeenCalledWith(
        `/dashboard/api/namespace/${namespace}/sandboxes/${name}`,
        undefined,
      );
    });

    it('should throw a readable error', async () => {
      mockDelete.mockRejectedValueOnce(new Error('forbidden'));

      await expect(deleteSandbox(namespace, name)).rejects.toThrow(
        `Failed to delete the sandbox '${name}'. forbidden`,
      );
    });
  });
});
