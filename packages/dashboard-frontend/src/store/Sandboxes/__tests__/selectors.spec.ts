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

import { CoreV1Event } from '@kubernetes/client-node';

import { SANDBOX_CONDITION_READY, SANDBOX_CONDITION_SUSPENDED } from '@/services/sandbox';
import { MockStoreBuilder } from '@/store/__mocks__/mockStore';
import { buildCondition, buildSandbox } from '@/store/__mocks__/sandboxBuilder';
import {
  selectHasTransitioningSandboxes,
  selectSandboxByName,
  selectSandboxes,
  selectSandboxesError,
  selectSandboxesIsLoading,
  selectSandboxEvents,
} from '@/store/Sandboxes/selectors';

describe('Sandboxes selectors', () => {
  const runningSandbox = buildSandbox({
    name: 'running-sandbox',
    conditions: [buildCondition(SANDBOX_CONDITION_READY, 'True')],
  });
  const hibernatedSandbox = buildSandbox({
    name: 'hibernated-sandbox',
    operatingMode: 'Suspended',
    conditions: [buildCondition(SANDBOX_CONDITION_SUSPENDED, 'True')],
  });

  it('should return the loading flag', () => {
    const state = new MockStoreBuilder().withSandboxes({}, true).build().getState();

    expect(selectSandboxesIsLoading(state)).toBe(true);
  });

  it('should return the sandboxes', () => {
    const state = new MockStoreBuilder()
      .withSandboxes({ sandboxes: [runningSandbox] })
      .build()
      .getState();

    expect(selectSandboxes(state)).toEqual([runningSandbox]);
  });

  it('should return the error', () => {
    const state = new MockStoreBuilder().withSandboxes({ error: 'no access' }).build().getState();

    expect(selectSandboxesError(state)).toEqual('no access');
  });

  it('should find a sandbox by name', () => {
    const state = new MockStoreBuilder()
      .withSandboxes({ sandboxes: [runningSandbox, hibernatedSandbox] })
      .build()
      .getState();

    expect(selectSandboxByName(state, 'hibernated-sandbox')).toEqual(hibernatedSandbox);
    expect(selectSandboxByName(state, 'unknown-sandbox')).toBeUndefined();
  });

  describe('selectHasTransitioningSandboxes', () => {
    it('should be true when a sandbox is running', () => {
      const state = new MockStoreBuilder()
        .withSandboxes({ sandboxes: [runningSandbox, hibernatedSandbox] })
        .build()
        .getState();

      expect(selectHasTransitioningSandboxes(state)).toBe(true);
    });

    it('should be false when all the sandboxes are hibernated', () => {
      const state = new MockStoreBuilder()
        .withSandboxes({ sandboxes: [hibernatedSandbox] })
        .build()
        .getState();

      expect(selectHasTransitioningSandboxes(state)).toBe(false);
    });
  });

  describe('selectSandboxEvents', () => {
    const events = [
      {
        metadata: { uid: '1', name: 'event-1' },
        involvedObject: { name: 'running-sandbox' },
        lastTimestamp: new Date('2025-09-24T10:00:00Z'),
      },
      {
        metadata: { uid: '2', name: 'event-2' },
        involvedObject: { name: 'running-sandbox-abcd' },
        lastTimestamp: new Date('2025-09-24T11:00:00Z'),
      },
      {
        metadata: { uid: '3', name: 'event-3' },
        involvedObject: { name: 'other-sandbox' },
        lastTimestamp: new Date('2025-09-24T12:00:00Z'),
      },
      {
        metadata: { uid: '4', name: 'event-4' },
        involvedObject: {},
      },
    ] as CoreV1Event[];

    it('should return the events of the sandbox and of its pod, most recent first', () => {
      const state = new MockStoreBuilder()
        .withSandboxes({ sandboxes: [runningSandbox] })
        .withEvents({ events })
        .build()
        .getState();

      const result = selectSandboxEvents(state, 'running-sandbox');

      expect(result.map(event => event.metadata.uid)).toEqual(['2', '1']);
    });

    it('should return no event when nothing matches', () => {
      const state = new MockStoreBuilder()
        .withSandboxes({ sandboxes: [runningSandbox] })
        .withEvents({ events })
        .build()
        .getState();

      expect(selectSandboxEvents(state, 'missing-sandbox')).toEqual([]);
    });
  });
});
