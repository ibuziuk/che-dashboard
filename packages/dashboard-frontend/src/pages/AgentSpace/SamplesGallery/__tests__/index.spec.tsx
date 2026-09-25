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

import { Props, SandboxSamplesGallery } from '@/pages/AgentSpace/SamplesGallery';
import { getSandboxSampleById, SANDBOX_SAMPLES } from '@/services/sandbox/samples';

const mockSampleClick = jest.fn();

describe('SandboxSamplesGallery', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render a card per sample', () => {
    renderComponent();

    expect(screen.getAllByTestId('sandbox-sample-card')).toHaveLength(SANDBOX_SAMPLES.length);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getAllByTestId('sandbox-sample-badge').length).toBeGreaterThan(0);
  });

  it('should handle a click', async () => {
    renderComponent();

    await userEvent.click(screen.getAllByTestId('sandbox-sample-card')[0]);

    expect(mockSampleClick).toHaveBeenCalledWith(SANDBOX_SAMPLES[0]);
  });

  it('should handle the Enter key', async () => {
    renderComponent();

    screen.getAllByTestId('sandbox-sample-card')[0].focus();
    await userEvent.keyboard('{Enter}');

    expect(mockSampleClick).toHaveBeenCalledWith(SANDBOX_SAMPLES[0]);
  });

  it('should handle the Space key', async () => {
    renderComponent();

    screen.getAllByTestId('sandbox-sample-card')[1].focus();
    await userEvent.keyboard(' ');

    expect(mockSampleClick).toHaveBeenCalledWith(SANDBOX_SAMPLES[1]);
  });

  it('should ignore any other key', async () => {
    renderComponent();

    screen.getAllByTestId('sandbox-sample-card')[0].focus();
    await userEvent.keyboard('{Escape}');

    expect(mockSampleClick).not.toHaveBeenCalled();
  });

  it('should mark the selected sample', () => {
    renderComponent({ selectedSampleId: SANDBOX_SAMPLES[1].id });

    const cards = screen.getAllByTestId('sandbox-sample-card');

    expect(cards[1]).toHaveClass('pf-m-current');
    expect(cards[0]).not.toHaveClass('pf-m-current');
  });

  it('should find a sample by id', () => {
    expect(getSandboxSampleById('hello-world')).toEqual(SANDBOX_SAMPLES[0]);
    expect(getSandboxSampleById('no-such-sample')).toBeUndefined();
  });
});

function getDefaultProps(): Props {
  return {
    onSampleClick: mockSampleClick,
  };
}

function renderComponent(propsOverrides: Partial<Props> = {}): RenderResult {
  return render(<SandboxSamplesGallery {...getDefaultProps()} {...propsOverrides} />);
}
