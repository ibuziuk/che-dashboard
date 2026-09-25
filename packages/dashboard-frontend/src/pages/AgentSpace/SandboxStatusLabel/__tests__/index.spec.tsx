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
import { render, screen } from '@testing-library/react';
import React from 'react';

import { SandboxStatusLabel } from '@/pages/AgentSpace/SandboxStatusLabel';
import {
  SANDBOX_CONDITION_FINISHED,
  SANDBOX_CONDITION_POD_SCHEDULED,
  SANDBOX_CONDITION_READY,
  SANDBOX_CONDITION_SUSPENDED,
} from '@/services/sandbox';
import { buildCondition, buildSandbox } from '@/store/__mocks__/sandboxBuilder';

describe('SandboxStatusLabel', () => {
  it.each([
    [
      api.SandboxPhase.RUNNING,
      buildSandbox({ conditions: [buildCondition(SANDBOX_CONDITION_READY, 'True')] }),
    ],
    [
      api.SandboxPhase.STARTING,
      buildSandbox({ conditions: [buildCondition(SANDBOX_CONDITION_READY, 'False')] }),
    ],
    [api.SandboxPhase.STOPPING, buildSandbox({ operatingMode: 'Suspended' })],
    [
      api.SandboxPhase.HIBERNATED,
      buildSandbox({
        operatingMode: 'Suspended',
        conditions: [buildCondition(SANDBOX_CONDITION_SUSPENDED, 'True')],
      }),
    ],
    [
      api.SandboxPhase.STOPPED,
      buildSandbox({ conditions: [buildCondition(SANDBOX_CONDITION_FINISHED, 'True')] }),
    ],
    [
      api.SandboxPhase.FAILED,
      buildSandbox({
        conditions: [buildCondition(SANDBOX_CONDITION_FINISHED, 'True', 'PodFailed')],
      }),
    ],
    [
      api.SandboxPhase.BLOCKED,
      buildSandbox({ conditions: [buildCondition(SANDBOX_CONDITION_POD_SCHEDULED, 'False')] }),
    ],
    [api.SandboxPhase.TERMINATING, buildSandbox({ deletionTimestamp: '2025-09-24T10:00:00Z' })],
    [
      api.SandboxPhase.UNKNOWN,
      buildSandbox({ conditions: [buildCondition('SomethingElse', 'True')] }),
    ],
  ])('should render the %s phase', (phase, sandbox) => {
    render(<SandboxStatusLabel sandbox={sandbox} />);

    expect(screen.getByTestId('sandbox-status-label')).toHaveTextContent(phase);
  });

  it('should not wrap a healthy sandbox in a tooltip', () => {
    const sandbox = buildSandbox({
      conditions: [buildCondition(SANDBOX_CONDITION_READY, 'True')],
    });
    render(<SandboxStatusLabel sandbox={sandbox} />);

    expect(screen.queryByTestId('patternfly-tooltip')).not.toBeInTheDocument();
  });

  it('should show the failure reason in a tooltip', () => {
    const sandbox = buildSandbox({
      conditions: [
        buildCondition(
          SANDBOX_CONDITION_POD_SCHEDULED,
          'False',
          'Unschedulable',
          'no nodes available',
        ),
      ],
    });
    render(<SandboxStatusLabel sandbox={sandbox} />);

    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('no nodes available');
    expect(screen.getByTestId('sandbox-status-label')).toHaveTextContent('Blocked');
  });
});
