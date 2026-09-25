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
import { createReducer } from '@reduxjs/toolkit';

import {
  sandboxDeleteAction,
  sandboxesErrorAction,
  sandboxesReceiveAction,
  sandboxesRequestAction,
  sandboxReceiveAction,
} from '@/store/Sandboxes/actions';

export interface State {
  isLoading: boolean;
  sandboxes: api.ISandbox[];
  error?: string;
}

export const unloadedState: State = {
  isLoading: false,
  sandboxes: [],
};

export const reducer = createReducer(unloadedState, builder =>
  builder
    .addCase(sandboxesRequestAction, state => {
      state.isLoading = true;
      state.error = undefined;
    })
    .addCase(sandboxesReceiveAction, (state, action) => {
      state.isLoading = false;
      state.sandboxes = action.payload;
    })
    .addCase(sandboxReceiveAction, (state, action) => {
      state.isLoading = false;
      const name = action.payload.metadata?.name;
      const index = state.sandboxes.findIndex(sandbox => sandbox.metadata?.name === name);
      if (index === -1) {
        state.sandboxes.push(action.payload);
      } else {
        state.sandboxes[index] = action.payload;
      }
    })
    .addCase(sandboxDeleteAction, (state, action) => {
      state.isLoading = false;
      state.sandboxes = state.sandboxes.filter(
        sandbox => sandbox.metadata?.name !== action.payload,
      );
    })
    .addCase(sandboxesErrorAction, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    })
    .addDefaultCase(state => state),
);
