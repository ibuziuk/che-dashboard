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
import { createAction } from '@reduxjs/toolkit';

import {
  createSandbox,
  deleteSandbox,
  fetchSandbox,
  fetchSandboxes,
  patchSandbox,
} from '@/services/backend-client/sandboxApi';
import { buildOperatingModePatch } from '@/services/sandbox';
import { AppThunk } from '@/store';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import { verifyAuthorized } from '@/store/SanityCheck';

export const sandboxesRequestAction = createAction('sandboxes/request');
export const sandboxesReceiveAction = createAction<api.ISandbox[]>('sandboxes/receive');
export const sandboxReceiveAction = createAction<api.ISandbox>('sandboxes/receiveOne');
export const sandboxDeleteAction = createAction<string>('sandboxes/delete');
export const sandboxesErrorAction = createAction<string>('sandboxes/error');

export const actionCreators = {
  /**
   * Fetches all the Sandboxes of the user namespace.
   *
   * @param isPolling when true, the request does not toggle the loading flag, so that
   * the background status refresh does not blank out the list.
   */
  requestSandboxes:
    (isPolling = false): AppThunk =>
    async (dispatch, getState) => {
      const namespace = selectDefaultNamespace(getState()).name;
      try {
        await verifyAuthorized(dispatch, getState);

        if (!isPolling) {
          dispatch(sandboxesRequestAction());
        }

        const sandboxes = await fetchSandboxes(namespace);
        dispatch(sandboxesReceiveAction(sandboxes));
      } catch (e) {
        const errorMessage = helpers.errors.getMessage(e);
        dispatch(sandboxesErrorAction(errorMessage));
        throw e;
      }
    },

  requestSandbox:
    (name: string, isPolling = false): AppThunk =>
    async (dispatch, getState) => {
      const namespace = selectDefaultNamespace(getState()).name;
      try {
        await verifyAuthorized(dispatch, getState);

        if (!isPolling) {
          dispatch(sandboxesRequestAction());
        }

        const sandbox = await fetchSandbox(namespace, name);
        dispatch(sandboxReceiveAction(sandbox));
      } catch (e) {
        const errorMessage = helpers.errors.getMessage(e);
        dispatch(sandboxesErrorAction(errorMessage));
        throw e;
      }
    },

  createSandbox:
    (sandbox: api.ISandbox): AppThunk =>
    async (dispatch, getState) => {
      const namespace = selectDefaultNamespace(getState()).name;
      try {
        await verifyAuthorized(dispatch, getState);

        dispatch(sandboxesRequestAction());

        const created = await createSandbox(namespace, sandbox);
        dispatch(sandboxReceiveAction(created));
      } catch (e) {
        const errorMessage = helpers.errors.getMessage(e);
        dispatch(sandboxesErrorAction(errorMessage));
        throw e;
      }
    },

  /**
   * Switches the Sandbox operating mode, which is what the Start, Stop, Hibernate
   * and Resume actions come down to.
   */
  changeSandboxOperatingMode:
    (name: string, operatingMode: api.SandboxOperatingMode): AppThunk =>
    async (dispatch, getState) => {
      const namespace = selectDefaultNamespace(getState()).name;
      try {
        await verifyAuthorized(dispatch, getState);

        dispatch(sandboxesRequestAction());

        const sandbox = await patchSandbox(namespace, name, buildOperatingModePatch(operatingMode));
        dispatch(sandboxReceiveAction(sandbox));
      } catch (e) {
        const errorMessage = helpers.errors.getMessage(e);
        dispatch(sandboxesErrorAction(errorMessage));
        throw e;
      }
    },

  deleteSandbox:
    (name: string): AppThunk =>
    async (dispatch, getState) => {
      const namespace = selectDefaultNamespace(getState()).name;
      try {
        await verifyAuthorized(dispatch, getState);

        dispatch(sandboxesRequestAction());

        await deleteSandbox(namespace, name);
        dispatch(sandboxDeleteAction(name));
      } catch (e) {
        const errorMessage = helpers.errors.getMessage(e);
        dispatch(sandboxesErrorAction(errorMessage));
        throw e;
      }
    },
};
