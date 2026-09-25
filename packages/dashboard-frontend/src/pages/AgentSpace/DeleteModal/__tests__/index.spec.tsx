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

import { Props, SandboxDeleteModal } from '@/pages/AgentSpace/DeleteModal';

const mockClose = jest.fn();
const mockConfirm = jest.fn();

describe('SandboxDeleteModal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render nothing while it is closed', () => {
    renderComponent({ isOpen: false });

    expect(screen.queryByTestId('delete-sandbox-button')).not.toBeInTheDocument();
  });

  it('should name the sandbox', () => {
    renderComponent();

    expect(screen.getByText('Would you like to delete sandbox "my-sandbox"?')).toBeInTheDocument();
  });

  it('should keep the Delete button disabled until it is confirmed', async () => {
    renderComponent();

    expect(screen.getByTestId('delete-sandbox-button')).toBeDisabled();

    await userEvent.click(screen.getByTestId('confirmation-checkbox'));

    expect(screen.getByTestId('delete-sandbox-button')).toBeEnabled();
  });

  it('should confirm and close', async () => {
    renderComponent();

    await userEvent.click(screen.getByTestId('confirmation-checkbox'));
    await userEvent.click(screen.getByTestId('delete-sandbox-button'));

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it('should close without confirming', async () => {
    renderComponent();

    await userEvent.click(screen.getByTestId('close-button'));

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it('should reset the checkbox once it is reopened', async () => {
    const { rerender } = renderComponent();

    await userEvent.click(screen.getByTestId('confirmation-checkbox'));
    await userEvent.click(screen.getByTestId('close-button'));

    rerender(<SandboxDeleteModal {...getDefaultProps()} />);

    expect(screen.getByTestId('confirmation-checkbox')).not.toBeChecked();
    expect(screen.getByTestId('delete-sandbox-button')).toBeDisabled();
  });
});

function getDefaultProps(): Props {
  return {
    isOpen: true,
    sandboxName: 'my-sandbox',
    onClose: mockClose,
    onConfirm: mockConfirm,
  };
}

function renderComponent(propsOverrides: Partial<Props> = {}): RenderResult {
  return render(<SandboxDeleteModal {...getDefaultProps()} {...propsOverrides} />);
}
