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

import {
  buildOperatingModePatch,
  getOperatingModeForAction,
  getSandboxCondition,
  getSandboxErrorConditions,
  getSandboxErrorMessage,
  getSandboxLifecycleActions,
  getSandboxName,
  getSandboxPhase,
  isSandboxTransitioning,
  SANDBOX_CONDITION_FINISHED,
  SANDBOX_CONDITION_POD_SCHEDULED,
  SANDBOX_CONDITION_READY,
  SANDBOX_CONDITION_SUSPENDED,
  SandboxAction,
} from '@/services/sandbox';
import { buildCondition, buildSandbox } from '@/store/__mocks__/sandboxBuilder';

describe('sandbox helpers', () => {
  describe('getSandboxName', () => {
    it('should return the name', () => {
      expect(getSandboxName(buildSandbox({ name: 'my-sandbox' }))).toEqual('my-sandbox');
    });

    it('should return an empty string when there is no metadata', () => {
      expect(getSandboxName({ spec: { podTemplate: { spec: { containers: [] } } } })).toEqual('');
    });
  });

  describe('getSandboxCondition', () => {
    it('should find the condition by type', () => {
      const sandbox = buildSandbox({
        conditions: [buildCondition(SANDBOX_CONDITION_READY, 'True', 'DependenciesReady')],
      });

      expect(getSandboxCondition(sandbox, SANDBOX_CONDITION_READY)?.reason).toEqual(
        'DependenciesReady',
      );
    });

    it('should return undefined when the condition is missing', () => {
      const sandbox = buildSandbox({ conditions: [] });

      expect(getSandboxCondition(sandbox, SANDBOX_CONDITION_READY)).toBeUndefined();
    });
  });

  describe('getSandboxPhase', () => {
    it('should report Terminating when the sandbox is being deleted', () => {
      const sandbox = buildSandbox({
        deletionTimestamp: '2025-09-24T10:00:00Z',
        conditions: [buildCondition(SANDBOX_CONDITION_READY, 'True')],
      });

      expect(getSandboxPhase(sandbox)).toEqual(api.SandboxPhase.TERMINATING);
    });

    it('should report Hibernated when suspended and the pod is gone', () => {
      const sandbox = buildSandbox({
        operatingMode: 'Suspended',
        conditions: [buildCondition(SANDBOX_CONDITION_SUSPENDED, 'True', 'PodTerminated')],
      });

      expect(getSandboxPhase(sandbox)).toEqual(api.SandboxPhase.HIBERNATED);
    });

    it('should report Stopping while the pod is still terminating', () => {
      const sandbox = buildSandbox({
        operatingMode: 'Suspended',
        conditions: [buildCondition(SANDBOX_CONDITION_SUSPENDED, 'False', 'PodTerminating')],
      });

      expect(getSandboxPhase(sandbox)).toEqual(api.SandboxPhase.STOPPING);
    });

    it('should report Failed when the pod has failed', () => {
      const sandbox = buildSandbox({
        conditions: [buildCondition(SANDBOX_CONDITION_FINISHED, 'True', 'PodFailed')],
      });

      expect(getSandboxPhase(sandbox)).toEqual(api.SandboxPhase.FAILED);
    });

    it('should report Stopped when the pod has succeeded', () => {
      const sandbox = buildSandbox({
        conditions: [buildCondition(SANDBOX_CONDITION_FINISHED, 'True', 'PodSucceeded')],
      });

      expect(getSandboxPhase(sandbox)).toEqual(api.SandboxPhase.STOPPED);
    });

    it('should report Running when ready', () => {
      const sandbox = buildSandbox({
        conditions: [buildCondition(SANDBOX_CONDITION_READY, 'True', 'DependenciesReady')],
      });

      expect(getSandboxPhase(sandbox)).toEqual(api.SandboxPhase.RUNNING);
    });

    it('should report Blocked when the pod cannot be scheduled', () => {
      const sandbox = buildSandbox({
        conditions: [
          buildCondition(SANDBOX_CONDITION_READY, 'False', 'DependenciesNotReady'),
          buildCondition(SANDBOX_CONDITION_POD_SCHEDULED, 'False', 'Unschedulable'),
        ],
      });

      expect(getSandboxPhase(sandbox)).toEqual(api.SandboxPhase.BLOCKED);
    });

    it('should report Stopped when the sandbox has expired', () => {
      const sandbox = buildSandbox({
        conditions: [buildCondition(SANDBOX_CONDITION_READY, 'False', 'SandboxExpired')],
      });

      expect(getSandboxPhase(sandbox)).toEqual(api.SandboxPhase.STOPPED);
    });

    it.each(['InvalidConfiguration', 'MultiplePods'])(
      'should report Failed when the reason is %s',
      reason => {
        const sandbox = buildSandbox({
          conditions: [buildCondition(SANDBOX_CONDITION_READY, 'False', reason)],
        });

        expect(getSandboxPhase(sandbox)).toEqual(api.SandboxPhase.FAILED);
      },
    );

    it('should report Starting for any other not-ready reason', () => {
      const sandbox = buildSandbox({
        conditions: [buildCondition(SANDBOX_CONDITION_READY, 'False', 'DependenciesNotReady')],
      });

      expect(getSandboxPhase(sandbox)).toEqual(api.SandboxPhase.STARTING);
    });

    it('should report Starting when the controller has not reconciled yet', () => {
      expect(getSandboxPhase(buildSandbox({}))).toEqual(api.SandboxPhase.STARTING);
      expect(getSandboxPhase(buildSandbox({ conditions: [] }))).toEqual(api.SandboxPhase.STARTING);
    });

    it('should report Unknown when the conditions are inconclusive', () => {
      const sandbox = buildSandbox({
        conditions: [buildCondition(SANDBOX_CONDITION_READY, 'Unknown')],
      });

      expect(getSandboxPhase(sandbox)).toEqual(api.SandboxPhase.UNKNOWN);
    });
  });

  describe('isSandboxTransitioning', () => {
    it('should be true for a running sandbox', () => {
      const sandbox = buildSandbox({
        conditions: [buildCondition(SANDBOX_CONDITION_READY, 'True')],
      });

      expect(isSandboxTransitioning(sandbox)).toBe(true);
    });

    it('should be true for a starting sandbox', () => {
      expect(isSandboxTransitioning(buildSandbox({}))).toBe(true);
    });

    it('should be false for a hibernated sandbox', () => {
      const sandbox = buildSandbox({
        operatingMode: 'Suspended',
        conditions: [buildCondition(SANDBOX_CONDITION_SUSPENDED, 'True')],
      });

      expect(isSandboxTransitioning(sandbox)).toBe(false);
    });
  });

  describe('getSandboxLifecycleActions', () => {
    it('should offer Stop for a running sandbox', () => {
      const sandbox = buildSandbox({
        conditions: [buildCondition(SANDBOX_CONDITION_READY, 'True')],
      });

      expect(getSandboxLifecycleActions(sandbox)).toEqual([SandboxAction.STOP]);
    });

    it('should offer Resume for a hibernated sandbox', () => {
      const sandbox = buildSandbox({
        operatingMode: 'Suspended',
        conditions: [buildCondition(SANDBOX_CONDITION_SUSPENDED, 'True')],
      });

      expect(getSandboxLifecycleActions(sandbox)).toEqual([SandboxAction.RESUME]);
    });

    it('should offer Start for a stopped sandbox', () => {
      const sandbox = buildSandbox({
        conditions: [buildCondition(SANDBOX_CONDITION_FINISHED, 'True', 'PodSucceeded')],
      });

      expect(getSandboxLifecycleActions(sandbox)).toEqual([SandboxAction.START]);
    });

    it('should offer no action while the sandbox is terminating', () => {
      const sandbox = buildSandbox({ deletionTimestamp: '2025-09-24T10:00:00Z' });

      expect(getSandboxLifecycleActions(sandbox)).toEqual([]);
    });
  });

  describe('getOperatingModeForAction', () => {
    it.each([SandboxAction.START, SandboxAction.RESUME])('should map %s to Running', action => {
      expect(getOperatingModeForAction(action)).toEqual('Running');
    });

    it.each([SandboxAction.STOP, SandboxAction.HIBERNATE])('should map %s to Suspended', action => {
      expect(getOperatingModeForAction(action)).toEqual('Suspended');
    });

    it('should not map Delete to an operating mode', () => {
      expect(getOperatingModeForAction(SandboxAction.DELETE)).toBeUndefined();
    });
  });

  describe('buildOperatingModePatch', () => {
    it('should build an add patch', () => {
      expect(buildOperatingModePatch('Suspended')).toEqual([
        {
          op: 'add',
          path: '/spec/operatingMode',
          value: 'Suspended',
        },
      ]);
    });
  });

  describe('error conditions', () => {
    it('should return no condition for a healthy sandbox', () => {
      const sandbox = buildSandbox({
        conditions: [buildCondition(SANDBOX_CONDITION_READY, 'True')],
      });

      expect(getSandboxErrorConditions(sandbox)).toEqual([]);
      expect(getSandboxErrorMessage(sandbox)).toBeUndefined();
    });

    it('should return the failing conditions', () => {
      const sandbox = buildSandbox({
        conditions: [
          buildCondition(SANDBOX_CONDITION_READY, 'False', 'InvalidConfiguration', 'Bad image'),
        ],
      });

      expect(getSandboxErrorConditions(sandbox)).toHaveLength(1);
      expect(getSandboxErrorMessage(sandbox)).toEqual('Bad image');
    });

    it('should fall back to the reason when there is no message', () => {
      const sandbox = buildSandbox({
        conditions: [
          buildCondition(SANDBOX_CONDITION_READY, 'False', 'DependenciesNotReady'),
          buildCondition(SANDBOX_CONDITION_POD_SCHEDULED, 'False', 'Unschedulable'),
        ],
      });

      expect(getSandboxErrorMessage(sandbox)).toEqual('DependenciesNotReady; Unschedulable');
    });

    it('should return undefined when the failing conditions carry no text', () => {
      const sandbox = buildSandbox({
        conditions: [
          buildCondition(SANDBOX_CONDITION_READY, 'False', 'InvalidConfiguration'),
          buildCondition(SANDBOX_CONDITION_POD_SCHEDULED, 'True'),
        ],
      });
      // The reason is dropped so that the message ends up empty.
      sandbox.status!.conditions![0].reason = '';

      expect(getSandboxErrorMessage(sandbox)).toBeUndefined();
    });
  });
});
