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

import {
  createSandbox,
  deleteSandbox,
  fetchSandbox,
  fetchSandboxes,
  patchSandbox,
} from '@/services/backend-client/sandboxApi';
import { createMockStore } from '@/store/__mocks__/mockActionsTestStore';
import { buildSandbox } from '@/store/__mocks__/sandboxBuilder';
import * as namespaceSelectors from '@/store/InfrastructureNamespaces/selectors';
import {
  actionCreators,
  sandboxDeleteAction,
  sandboxesErrorAction,
  sandboxesReceiveAction,
  sandboxesRequestAction,
  sandboxReceiveAction,
} from '@/store/Sandboxes/actions';
import { verifyAuthorized } from '@/store/SanityCheck';

jest.mock('@/services/backend-client/sandboxApi');
jest.mock('@/store/SanityCheck');

describe('Sandboxes Actions', () => {
  const namespace = 'user-che';
  const sandbox = buildSandbox({ name: 'my-sandbox', namespace });
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore({});
    jest.clearAllMocks();

    jest
      .spyOn(namespaceSelectors, 'selectDefaultNamespace')
      .mockReturnValue({ name: namespace, attributes: { phase: 'Active' } });
    (verifyAuthorized as jest.Mock).mockResolvedValue(true);
  });

  describe('requestSandboxes', () => {
    it('should dispatch the request and the receive actions', async () => {
      (fetchSandboxes as jest.Mock).mockResolvedValue([sandbox]);

      await store.dispatch(actionCreators.requestSandboxes());

      expect(fetchSandboxes).toHaveBeenCalledWith(namespace);
      expect(store.getActions()).toEqual([
        sandboxesRequestAction(),
        sandboxesReceiveAction([sandbox]),
      ]);
    });

    it('should not dispatch the request action while polling', async () => {
      (fetchSandboxes as jest.Mock).mockResolvedValue([sandbox]);

      await store.dispatch(actionCreators.requestSandboxes(true));

      expect(store.getActions()).toEqual([sandboxesReceiveAction([sandbox])]);
    });

    it('should dispatch the error action', async () => {
      (fetchSandboxes as jest.Mock).mockRejectedValue(new Error('no access'));

      await expect(store.dispatch(actionCreators.requestSandboxes())).rejects.toThrow('no access');

      expect(store.getActions()).toEqual([
        sandboxesRequestAction(),
        sandboxesErrorAction('no access'),
      ]);
    });
  });

  describe('requestSandbox', () => {
    it('should dispatch the request and the receive actions', async () => {
      (fetchSandbox as jest.Mock).mockResolvedValue(sandbox);

      await store.dispatch(actionCreators.requestSandbox('my-sandbox'));

      expect(fetchSandbox).toHaveBeenCalledWith(namespace, 'my-sandbox');
      expect(store.getActions()).toEqual([sandboxesRequestAction(), sandboxReceiveAction(sandbox)]);
    });

    it('should not dispatch the request action while polling', async () => {
      (fetchSandbox as jest.Mock).mockResolvedValue(sandbox);

      await store.dispatch(actionCreators.requestSandbox('my-sandbox', true));

      expect(store.getActions()).toEqual([sandboxReceiveAction(sandbox)]);
    });

    it('should dispatch the error action', async () => {
      (fetchSandbox as jest.Mock).mockRejectedValue(new Error('not found'));

      await expect(store.dispatch(actionCreators.requestSandbox('my-sandbox'))).rejects.toThrow(
        'not found',
      );

      expect(store.getActions()).toEqual([
        sandboxesRequestAction(),
        sandboxesErrorAction('not found'),
      ]);
    });
  });

  describe('createSandbox', () => {
    it('should dispatch the receive action', async () => {
      (createSandbox as jest.Mock).mockResolvedValue(sandbox);

      await store.dispatch(actionCreators.createSandbox(sandbox));

      expect(createSandbox).toHaveBeenCalledWith(namespace, sandbox);
      expect(store.getActions()).toEqual([sandboxesRequestAction(), sandboxReceiveAction(sandbox)]);
    });

    it('should dispatch the error action', async () => {
      (createSandbox as jest.Mock).mockRejectedValue(new Error('already exists'));

      await expect(store.dispatch(actionCreators.createSandbox(sandbox))).rejects.toThrow(
        'already exists',
      );

      expect(store.getActions()).toEqual([
        sandboxesRequestAction(),
        sandboxesErrorAction('already exists'),
      ]);
    });
  });

  describe('changeSandboxOperatingMode', () => {
    it('should patch the operating mode', async () => {
      (patchSandbox as jest.Mock).mockResolvedValue(sandbox);

      await store.dispatch(actionCreators.changeSandboxOperatingMode('my-sandbox', 'Suspended'));

      expect(patchSandbox).toHaveBeenCalledWith(namespace, 'my-sandbox', [
        { op: 'add', path: '/spec/operatingMode', value: 'Suspended' },
      ]);
      expect(store.getActions()).toEqual([sandboxesRequestAction(), sandboxReceiveAction(sandbox)]);
    });

    it('should dispatch the error action', async () => {
      (patchSandbox as jest.Mock).mockRejectedValue(new Error('conflict'));

      await expect(
        store.dispatch(actionCreators.changeSandboxOperatingMode('my-sandbox', 'Running')),
      ).rejects.toThrow('conflict');

      expect(store.getActions()).toEqual([
        sandboxesRequestAction(),
        sandboxesErrorAction('conflict'),
      ]);
    });
  });

  describe('deleteSandbox', () => {
    it('should dispatch the delete action', async () => {
      (deleteSandbox as jest.Mock).mockResolvedValue(undefined);

      await store.dispatch(actionCreators.deleteSandbox('my-sandbox'));

      expect(deleteSandbox).toHaveBeenCalledWith(namespace, 'my-sandbox');
      expect(store.getActions()).toEqual([
        sandboxesRequestAction(),
        sandboxDeleteAction('my-sandbox'),
      ]);
    });

    it('should dispatch the error action', async () => {
      (deleteSandbox as jest.Mock).mockRejectedValue(new Error('forbidden'));

      await expect(store.dispatch(actionCreators.deleteSandbox('my-sandbox'))).rejects.toThrow(
        'forbidden',
      );

      expect(store.getActions()).toEqual([
        sandboxesRequestAction(),
        sandboxesErrorAction('forbidden'),
      ]);
    });
  });
});
