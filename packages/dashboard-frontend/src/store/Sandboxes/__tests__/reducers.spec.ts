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

import { UnknownAction } from 'redux';

import { buildSandbox } from '@/store/__mocks__/sandboxBuilder';
import {
  sandboxDeleteAction,
  sandboxesErrorAction,
  sandboxesReceiveAction,
  sandboxesRequestAction,
  sandboxReceiveAction,
} from '@/store/Sandboxes/actions';
import { reducer, State, unloadedState } from '@/store/Sandboxes/reducer';

describe('Sandboxes reducer', () => {
  const sandbox = buildSandbox({ name: 'my-sandbox' });

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' } as UnknownAction)).toEqual(unloadedState);
  });

  it('should handle the request action', () => {
    const initialState: State = { isLoading: false, sandboxes: [], error: 'previous error' };

    expect(reducer(initialState, sandboxesRequestAction())).toEqual({
      isLoading: true,
      sandboxes: [],
      error: undefined,
    });
  });

  it('should handle the receive action', () => {
    const initialState: State = { isLoading: true, sandboxes: [] };

    expect(reducer(initialState, sandboxesReceiveAction([sandbox]))).toEqual({
      isLoading: false,
      sandboxes: [sandbox],
    });
  });

  it('should add a sandbox that is not in the list yet', () => {
    const initialState: State = { isLoading: true, sandboxes: [] };

    expect(reducer(initialState, sandboxReceiveAction(sandbox))).toEqual({
      isLoading: false,
      sandboxes: [sandbox],
    });
  });

  it('should replace a sandbox that is already in the list', () => {
    const initialState: State = { isLoading: false, sandboxes: [sandbox] };
    const updated = buildSandbox({ name: 'my-sandbox', operatingMode: 'Suspended' });

    expect(reducer(initialState, sandboxReceiveAction(updated))).toEqual({
      isLoading: false,
      sandboxes: [updated],
    });
  });

  it('should handle the delete action', () => {
    const other = buildSandbox({ name: 'other-sandbox' });
    const initialState: State = { isLoading: false, sandboxes: [sandbox, other] };

    expect(reducer(initialState, sandboxDeleteAction('my-sandbox'))).toEqual({
      isLoading: false,
      sandboxes: [other],
    });
  });

  it('should handle the error action', () => {
    const initialState: State = { isLoading: true, sandboxes: [] };

    expect(reducer(initialState, sandboxesErrorAction('no access'))).toEqual({
      isLoading: false,
      sandboxes: [],
      error: 'no access',
    });
  });
});
