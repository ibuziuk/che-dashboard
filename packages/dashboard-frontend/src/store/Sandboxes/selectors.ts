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

import { createSelector } from '@reduxjs/toolkit';

import { isSandboxTransitioning } from '@/services/sandbox';
import { RootState } from '@/store';
import { selectAllEvents } from '@/store/Events/selectors';

const selectState = (state: RootState) => state.sandboxes;

export const selectSandboxesIsLoading = createSelector(selectState, state => state.isLoading);

export const selectSandboxes = createSelector(selectState, state => state.sandboxes);

export const selectSandboxesError = createSelector(selectState, state => state.error);

export const selectSandboxByName = createSelector(
  [selectSandboxes, (_state: RootState, name: string) => name],
  (sandboxes, name) => sandboxes.find(sandbox => sandbox.metadata?.name === name),
);

/**
 * True when at least one Sandbox is running or is changing state, i.e. when the
 * list is worth polling.
 */
export const selectHasTransitioningSandboxes = createSelector(selectSandboxes, sandboxes =>
  sandboxes.some(sandbox => isSandboxTransitioning(sandbox)),
);

/**
 * Returns the namespace events that belong to the given Sandbox, the most recent first.
 * The Pod created for a Sandbox is named after it, hence the prefix match.
 */
export const selectSandboxEvents = createSelector(
  [selectAllEvents, (_state: RootState, name: string) => name],
  (events, name) =>
    events
      .filter(event => {
        const involvedObjectName = event.involvedObject?.name;
        return involvedObjectName === name || involvedObjectName?.startsWith(`${name}-`) === true;
      })
      .sort((eventA, eventB) => {
        const timeA = eventA.lastTimestamp ? new Date(eventA.lastTimestamp).getTime() : 0;
        const timeB = eventB.lastTimestamp ? new Date(eventB.lastTimestamp).getTime() : 0;
        return timeB - timeA;
      }),
);
