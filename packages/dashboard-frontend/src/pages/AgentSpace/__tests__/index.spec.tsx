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

import { render, RenderResult, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { AgentSpace, Props } from '@/pages/AgentSpace';
import { SANDBOX_CONDITION_READY, SANDBOX_CONDITION_SUSPENDED } from '@/services/sandbox';
import { buildCondition, buildSandbox } from '@/store/__mocks__/sandboxBuilder';

jest.mock('@/components/Head', () => {
  const FakeHead = () => <span>Dummy Head Component</span>;
  FakeHead.displayName = 'fake-Head';
  return FakeHead;
});

const mockChangeOperatingMode = jest.fn();
const mockCreateClick = jest.fn();
const mockDelete = jest.fn();
const mockRefresh = jest.fn();
const mockSampleClick = jest.fn();
const mockSandboxClick = jest.fn();

const runningSandbox = buildSandbox({
  name: 'running-sandbox',
  conditions: [buildCondition(SANDBOX_CONDITION_READY, 'True')],
});
const hibernatedSandbox = buildSandbox({
  name: 'hibernated-sandbox',
  operatingMode: 'Suspended',
  conditions: [buildCondition(SANDBOX_CONDITION_SUSPENDED, 'True')],
});

describe('Agent Space Page', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show the samples when there is no sandbox', () => {
    renderComponent();

    expect(screen.queryByTestId('agent-space-empty-state')).toBeInTheDocument();
    expect(screen.queryByTestId('sandboxes-table')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('sandbox-sample-card').length).toBeGreaterThan(0);
  });

  it('should show the loading spinner', () => {
    renderComponent({ isLoading: true });

    expect(screen.queryByTestId('sandboxes-loading-spinner')).toBeInTheDocument();
  });

  it('should show the error', () => {
    renderComponent({ error: 'no access' });

    expect(screen.getByTestId('sandboxes-error')).toHaveTextContent('no access');
  });

  it('should list the sandboxes', () => {
    renderComponent({ sandboxes: [runningSandbox, hibernatedSandbox] });

    expect(screen.queryByTestId('sandbox-row-running-sandbox')).toBeInTheDocument();
    expect(screen.queryByTestId('sandbox-row-hibernated-sandbox')).toBeInTheDocument();
  });

  it('should handle the create button', async () => {
    renderComponent({ sandboxes: [runningSandbox] });

    await userEvent.click(screen.getByTestId('create-sandbox-button'));

    expect(mockCreateClick).toHaveBeenCalled();
  });

  it('should handle the create button of the empty state', async () => {
    renderComponent();

    await userEvent.click(screen.getByTestId('empty-state-create-sandbox-button'));

    expect(mockCreateClick).toHaveBeenCalled();
  });

  it('should handle the refresh button', async () => {
    renderComponent({ sandboxes: [runningSandbox] });

    await userEvent.click(screen.getByTestId('refresh-sandboxes-button'));

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should handle a sample click', async () => {
    renderComponent();

    await userEvent.click(screen.getAllByTestId('sandbox-sample-card')[0]);

    expect(mockSampleClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String) }),
    );
  });

  it('should handle a sandbox name click', async () => {
    renderComponent({ sandboxes: [runningSandbox] });

    await userEvent.click(screen.getByTestId('sandbox-name-link'));

    expect(mockSandboxClick).toHaveBeenCalledWith(runningSandbox);
  });

  it('should stop a running sandbox', async () => {
    renderComponent({ sandboxes: [runningSandbox] });

    await userEvent.click(screen.getByRole('button', { name: 'Kebab toggle' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Stop' }));

    expect(mockChangeOperatingMode).toHaveBeenCalledWith('running-sandbox', 'Suspended');
  });

  it('should resume a hibernated sandbox', async () => {
    renderComponent({ sandboxes: [hibernatedSandbox] });

    await userEvent.click(screen.getByRole('button', { name: 'Kebab toggle' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Resume' }));

    expect(mockChangeOperatingMode).toHaveBeenCalledWith('hibernated-sandbox', 'Running');
  });

  it('should delete a sandbox only once it is confirmed', async () => {
    renderComponent({ sandboxes: [runningSandbox] });

    await userEvent.click(screen.getByRole('button', { name: 'Kebab toggle' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    const deleteButton = screen.getByTestId('delete-sandbox-button');
    expect(deleteButton).toBeDisabled();

    await userEvent.click(screen.getByTestId('confirmation-checkbox'));
    await userEvent.click(deleteButton);

    expect(mockDelete).toHaveBeenCalledWith('running-sandbox');
  });

  it('should close the delete confirmation without deleting', async () => {
    renderComponent({ sandboxes: [runningSandbox] });

    await userEvent.click(screen.getByRole('button', { name: 'Kebab toggle' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await userEvent.click(screen.getByTestId('close-button'));

    expect(mockDelete).not.toHaveBeenCalled();
    expect(screen.queryByTestId('delete-sandbox-button')).not.toBeInTheDocument();
  });
});

function getDefaultProps(): Props {
  return {
    error: undefined,
    isLoading: false,
    sandboxes: [],
    onChangeOperatingMode: mockChangeOperatingMode,
    onCreateClick: mockCreateClick,
    onDelete: mockDelete,
    onRefresh: mockRefresh,
    onSampleClick: mockSampleClick,
    onSandboxClick: mockSandboxClick,
  };
}

function renderComponent(propsOverrides: Partial<Props> = {}): RenderResult {
  return render(<AgentSpace {...getDefaultProps()} {...propsOverrides} />);
}
