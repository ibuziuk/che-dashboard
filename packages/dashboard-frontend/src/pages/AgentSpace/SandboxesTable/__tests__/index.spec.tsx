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

import { render, RenderResult, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { Props, SandboxesTable } from '@/pages/AgentSpace/SandboxesTable';
import { getFormattedDate } from '@/services/helpers/dates';
import { SANDBOX_CONDITION_READY, SandboxAction } from '@/services/sandbox';
import { buildCondition, buildSandbox } from '@/store/__mocks__/sandboxBuilder';

const mockAction = jest.fn();
const mockSandboxClick = jest.fn();

const runningSandbox = buildSandbox({
  name: 'running-sandbox',
  creationTimestamp: '2025-09-24T10:00:00Z',
  runtimeClassName: 'gvisor',
  conditions: [buildCondition(SANDBOX_CONDITION_READY, 'True')],
});

describe('SandboxesTable', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the columns of a sandbox', () => {
    renderComponent({ sandboxes: [runningSandbox] });

    const row = screen.getByTestId('sandbox-row-running-sandbox');

    expect(within(row).getByTestId('sandbox-name-link')).toHaveTextContent('running-sandbox');
    expect(within(row).getByTestId('sandbox-status-label')).toHaveTextContent('Running');
    expect(row).toHaveTextContent('gvisor');
    expect(row).toHaveTextContent(getFormattedDate(new Date('2025-09-24T10:00:00Z')));
  });

  it('should fall back to a dash for an unset runtime class and creation date', () => {
    renderComponent({ sandboxes: [buildSandbox({ name: 'bare-sandbox' })] });

    expect(screen.getByTestId('sandbox-row-bare-sandbox')).toHaveTextContent('-');
  });

  it('should offer the lifecycle action and Delete', async () => {
    renderComponent({ sandboxes: [runningSandbox] });

    await userEvent.click(screen.getByRole('button', { name: 'Kebab toggle' }));

    const items = screen.getAllByRole('menuitem').map(item => item.textContent);
    expect(items).toEqual([SandboxAction.STOP, SandboxAction.DELETE]);
  });

  it('should offer only Delete while the sandbox is terminating', async () => {
    const sandbox = buildSandbox({
      name: 'terminating-sandbox',
      deletionTimestamp: '2025-09-24T10:00:00Z',
    });

    renderComponent({ sandboxes: [sandbox] });

    await userEvent.click(screen.getByRole('button', { name: 'Kebab toggle' }));

    const items = screen.getAllByRole('menuitem').map(item => item.textContent);
    expect(items).toEqual([SandboxAction.DELETE]);
  });

  it('should report a lifecycle action', async () => {
    renderComponent({ sandboxes: [runningSandbox] });

    await userEvent.click(screen.getByRole('button', { name: 'Kebab toggle' }));
    await userEvent.click(screen.getByRole('menuitem', { name: SandboxAction.STOP }));

    expect(mockAction).toHaveBeenCalledWith(runningSandbox, SandboxAction.STOP);
  });

  it('should report the delete action', async () => {
    renderComponent({ sandboxes: [runningSandbox] });

    await userEvent.click(screen.getByRole('button', { name: 'Kebab toggle' }));
    await userEvent.click(screen.getByRole('menuitem', { name: SandboxAction.DELETE }));

    expect(mockAction).toHaveBeenCalledWith(runningSandbox, SandboxAction.DELETE);
  });

  it('should report a click on the name', async () => {
    renderComponent({ sandboxes: [runningSandbox] });

    await userEvent.click(screen.getByTestId('sandbox-name-link'));

    expect(mockSandboxClick).toHaveBeenCalledWith(runningSandbox);
  });
});

function getDefaultProps(): Props {
  return {
    sandboxes: [],
    onAction: mockAction,
    onSandboxClick: mockSandboxClick,
  };
}

function renderComponent(propsOverrides: Partial<Props> = {}): RenderResult {
  return render(<SandboxesTable {...getDefaultProps()} {...propsOverrides} />);
}
