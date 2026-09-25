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
import { render, RenderResult, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { AgentSpaceDetails, Props } from '@/pages/AgentSpaceDetails';
import {
  SANDBOX_CONDITION_POD_SCHEDULED,
  SANDBOX_CONDITION_READY,
  SANDBOX_CONDITION_SUSPENDED,
} from '@/services/sandbox';
import { buildCondition, buildSandbox } from '@/store/__mocks__/sandboxBuilder';

jest.mock('@/components/Head', () => {
  const FakeHead = () => <span>Dummy Head Component</span>;
  FakeHead.displayName = 'fake-Head';
  return FakeHead;
});

const mockBack = jest.fn();
const mockChangeOperatingMode = jest.fn();
const mockDelete = jest.fn();

const runningSandbox = buildSandbox({
  name: 'my-sandbox',
  creationTimestamp: '2025-09-24T10:00:00Z',
  nodeName: 'node-1',
  podIPs: ['10.128.0.15', '10.128.0.16'],
  runtimeClassName: 'gvisor',
  serviceFQDN: 'my-sandbox.user-che.svc.cluster.local',
  conditions: [buildCondition(SANDBOX_CONDITION_READY, 'True', 'PodReady', 'the pod is ready')],
});

describe('Sandbox Details Page', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show the spinner while loading', () => {
    renderComponent({ isLoading: true, sandbox: undefined });

    expect(screen.queryByTestId('sandbox-loading-spinner')).toBeInTheDocument();
  });

  it('should show the not-found state for a missing sandbox', () => {
    renderComponent({ sandbox: undefined });

    expect(screen.getByTestId('sandbox-not-found')).toHaveTextContent(
      'The sandbox "my-sandbox" does not exist, or it has been deleted.',
    );
  });

  it('should show the load error instead of the not-found message', () => {
    renderComponent({ error: 'forbidden', sandbox: undefined });

    expect(screen.getByTestId('sandbox-not-found')).toHaveTextContent('forbidden');
  });

  it('should show the error of the last operation next to the sandbox', () => {
    renderComponent({ error: 'the patch has failed' });

    expect(screen.getByTestId('sandbox-details-error')).toHaveTextContent('the patch has failed');
    expect(screen.queryByTestId('sandbox-spec')).toBeInTheDocument();
  });

  it('should render the spec', () => {
    renderComponent();

    const spec = screen.getByTestId('sandbox-spec');

    expect(spec).toHaveTextContent('user-che');
    expect(spec).toHaveTextContent('quay.io/sandbox/hello-world:latest');
    expect(spec).toHaveTextContent('gvisor');
    expect(spec).toHaveTextContent('CPU: 500m, Memory: 512Mi');
    expect(spec).toHaveTextContent('my-sandbox.user-che.svc.cluster.local');
    expect(spec).toHaveTextContent('10.128.0.15, 10.128.0.16');
    expect(spec).toHaveTextContent('node-1');
    expect(spec).toHaveTextContent('Running');
  });

  it('should fall back to a dash for the fields the controller has not reported', () => {
    renderComponent({ sandbox: buildSandbox({ name: 'my-sandbox' }) });

    expect(screen.getByTestId('sandbox-spec')).toHaveTextContent('-');
  });

  it('should render the conditions', () => {
    renderComponent();

    const conditions = screen.getByTestId('sandbox-conditions');

    expect(conditions).toHaveTextContent('Ready');
    expect(conditions).toHaveTextContent('PodReady');
    expect(conditions).toHaveTextContent('the pod is ready');
  });

  it('should tell that there is no condition yet', () => {
    renderComponent({ sandbox: buildSandbox({ name: 'my-sandbox' }) });

    expect(screen.queryByTestId('sandbox-conditions')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sandbox-no-conditions')).toBeInTheDocument();
  });

  it('should render the events', () => {
    const events = [
      {
        metadata: { uid: '1', name: 'event-1' },
        type: 'Warning',
        reason: 'FailedScheduling',
        message: 'no nodes available',
        count: 3,
        lastTimestamp: new Date('2025-09-24T10:00:00Z'),
      },
      {
        metadata: { uid: '2', name: 'event-2' },
      },
    ] as CoreV1Event[];

    renderComponent({ events });

    const table = screen.getByTestId('sandbox-events');

    expect(table).toHaveTextContent('FailedScheduling');
    expect(table).toHaveTextContent('no nodes available');
    expect(table).toHaveTextContent('3');
  });

  it('should tell that there is no event', () => {
    renderComponent();

    expect(screen.queryByTestId('sandbox-events')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sandbox-no-events')).toBeInTheDocument();
  });

  it('should surface a blocking condition', () => {
    const sandbox = buildSandbox({
      name: 'my-sandbox',
      conditions: [
        buildCondition(
          SANDBOX_CONDITION_POD_SCHEDULED,
          'False',
          'Unschedulable',
          'no nodes available',
        ),
      ],
    });

    renderComponent({ sandbox });

    expect(screen.getByTestId('sandbox-condition-error')).toHaveTextContent('no nodes available');
  });

  it('should handle the breadcrumb', async () => {
    renderComponent();

    await userEvent.click(screen.getByTestId('agent-space-breadcrumb'));

    expect(mockBack).toHaveBeenCalled();
  });

  it('should stop a running sandbox', async () => {
    renderComponent();

    await userEvent.click(screen.getByTestId('sandbox-action-stop'));

    expect(mockChangeOperatingMode).toHaveBeenCalledWith('my-sandbox', 'Suspended');
  });

  it('should resume a hibernated sandbox', async () => {
    const sandbox = buildSandbox({
      name: 'my-sandbox',
      operatingMode: 'Suspended',
      conditions: [buildCondition(SANDBOX_CONDITION_SUSPENDED, 'True')],
    });

    renderComponent({ sandbox });

    await userEvent.click(screen.getByTestId('sandbox-action-resume'));

    expect(mockChangeOperatingMode).toHaveBeenCalledWith('my-sandbox', 'Running');
  });

  it('should offer no lifecycle action while the sandbox is terminating', () => {
    const sandbox = buildSandbox({
      name: 'my-sandbox',
      deletionTimestamp: '2025-09-24T10:00:00Z',
    });

    renderComponent({ sandbox });

    expect(screen.queryByTestId('sandbox-action-stop')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sandbox-action-start')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sandbox-action-delete')).toBeInTheDocument();
  });

  it('should delete the sandbox once it is confirmed', async () => {
    renderComponent();

    await userEvent.click(screen.getByTestId('sandbox-action-delete'));
    await userEvent.click(screen.getByTestId('confirmation-checkbox'));
    await userEvent.click(screen.getByTestId('delete-sandbox-button'));

    expect(mockDelete).toHaveBeenCalledWith('my-sandbox');
  });

  it('should close the delete confirmation without deleting', async () => {
    renderComponent();

    await userEvent.click(screen.getByTestId('sandbox-action-delete'));
    await userEvent.click(screen.getByTestId('close-button'));

    expect(mockDelete).not.toHaveBeenCalled();
    expect(screen.queryByTestId('delete-sandbox-button')).not.toBeInTheDocument();
  });
});

function getDefaultProps(): Props {
  return {
    error: undefined,
    events: [],
    isLoading: false,
    sandbox: runningSandbox,
    sandboxName: 'my-sandbox',
    onBack: mockBack,
    onChangeOperatingMode: mockChangeOperatingMode,
    onDelete: mockDelete,
  };
}

function renderComponent(propsOverrides: Partial<Props> = {}): RenderResult {
  return render(<AgentSpaceDetails {...getDefaultProps()} {...propsOverrides} />);
}
