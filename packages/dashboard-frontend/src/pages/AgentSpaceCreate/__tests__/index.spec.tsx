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

import { fireEvent, render, RenderResult, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { AgentSpaceCreate, Props } from '@/pages/AgentSpaceCreate';

jest.mock('@/components/Head', () => {
  const FakeHead = () => <span>Dummy Head Component</span>;
  FakeHead.displayName = 'fake-Head';
  return FakeHead;
});

jest.mock('@/services/helpers/generateName', () => ({
  generateSuffix: () => '-abcd',
}));

const mockCancel = jest.fn();
const mockCreate = jest.fn();

describe('Create Sandbox Page', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should default the fields when no sample is preselected', () => {
    renderComponent();

    expect(screen.getByTestId('sandbox-name')).toHaveValue('sandbox-abcd');
    expect(screen.getByTestId('sandbox-image')).toHaveValue(
      'registry.access.redhat.com/ubi9/ubi-minimal:latest',
    );
    expect(screen.getByTestId('sandbox-runtime-class')).toHaveValue('');
    expect(screen.getByTestId('sandbox-cpu-limit')).toHaveValue('500m');
    expect(screen.getByTestId('sandbox-memory-limit')).toHaveValue('512Mi');
  });

  it('should prefill the fields from the preselected sample', () => {
    renderComponent({ sampleId: 'python-runtime' });

    expect(screen.getByTestId('sandbox-name')).toHaveValue('python-runtime-abcd');
    expect(screen.getByTestId('sandbox-image')).toHaveValue('docker.io/library/python:3.12-slim');
    expect(screen.getByTestId('sandbox-cpu-limit')).toHaveValue('1');
    expect(screen.getByTestId('sandbox-memory-limit')).toHaveValue('2Gi');
  });

  it('should prefill the fields when a sample is picked', async () => {
    renderComponent();

    await userEvent.click(screen.getByLabelText('Create sandbox from sample JupyterLab'));

    expect(screen.getByTestId('sandbox-name')).toHaveValue('jupyterlab-abcd');
    expect(screen.getByTestId('sandbox-image')).toHaveValue(
      'jupyterhub/k8s-singleuser-sample:4.2.0',
    );
    expect(screen.getByTestId('sandbox-memory-limit')).toHaveValue('4Gi');
  });

  it('should show the error', () => {
    renderComponent({ error: 'forbidden' });

    expect(screen.getByTestId('create-sandbox-error')).toHaveTextContent('forbidden');
  });

  it('should disable the submit button while loading', () => {
    renderComponent({ isLoading: true });

    expect(screen.getByTestId('submit-sandbox-button')).toBeDisabled();
  });

  it('should handle the cancel button', async () => {
    renderComponent();

    await userEvent.click(screen.getByTestId('cancel-sandbox-button'));

    expect(mockCancel).toHaveBeenCalled();
  });

  describe('validation', () => {
    it('should reject an empty name', async () => {
      renderComponent();

      await userEvent.clear(screen.getByTestId('sandbox-name'));

      expect(screen.getByTestId('sandbox-name-helper-text')).toHaveTextContent(
        'The name cannot be empty.',
      );
      expect(screen.getByTestId('submit-sandbox-button')).toBeDisabled();
    });

    it('should reject a name that is too long', async () => {
      renderComponent();

      await userEvent.clear(screen.getByTestId('sandbox-name'));
      await userEvent.paste('a'.repeat(64));

      expect(screen.getByTestId('sandbox-name-helper-text')).toHaveTextContent(
        'The name cannot be longer than 63 characters.',
      );
    });

    it('should reject a name that is not an RFC 1123 label', async () => {
      renderComponent();

      await userEvent.clear(screen.getByTestId('sandbox-name'));
      await userEvent.paste('My Sandbox');

      expect(screen.getByTestId('sandbox-name-helper-text')).toHaveTextContent(
        'The name can contain only lowercase letters, digits and dashes.',
      );
    });

    it('should reject a name that is already taken', async () => {
      renderComponent({ existingNames: ['taken-sandbox'] });

      await userEvent.clear(screen.getByTestId('sandbox-name'));
      await userEvent.paste('taken-sandbox');

      expect(screen.getByTestId('sandbox-name-helper-text')).toHaveTextContent(
        'A sandbox with this name already exists.',
      );
    });

    it('should reject an empty image', async () => {
      renderComponent();

      await userEvent.clear(screen.getByTestId('sandbox-image'));

      expect(screen.getByTestId('sandbox-image-helper-text')).toHaveTextContent(
        'The container image cannot be empty.',
      );
    });

    it('should reject an invalid runtime class', async () => {
      renderComponent();

      await userEvent.click(screen.getByTestId('sandbox-runtime-class'));
      await userEvent.paste('GVisor!');

      expect(screen.getByTestId('sandbox-runtime-class-helper-text')).toHaveTextContent(
        'The runtime class can contain only lowercase letters, digits, dashes and dots.',
      );
    });

    it('should reject an invalid CPU limit', async () => {
      renderComponent();

      await userEvent.clear(screen.getByTestId('sandbox-cpu-limit'));
      await userEvent.paste('two cores');

      expect(screen.getByTestId('sandbox-cpu-limit-helper-text')).toHaveTextContent(
        'The CPU limit must be a number of cores',
      );
    });

    it('should reject an invalid memory limit', async () => {
      renderComponent();

      await userEvent.clear(screen.getByTestId('sandbox-memory-limit'));
      await userEvent.paste('512 megabytes');

      expect(screen.getByTestId('sandbox-memory-limit-helper-text')).toHaveTextContent(
        'The memory limit must be a quantity',
      );
    });

    it('should accept an empty runtime class and empty limits', async () => {
      renderComponent();

      await userEvent.clear(screen.getByTestId('sandbox-cpu-limit'));
      await userEvent.clear(screen.getByTestId('sandbox-memory-limit'));

      expect(screen.getByTestId('submit-sandbox-button')).toBeEnabled();
    });

    it('should not submit an invalid form', async () => {
      renderComponent();

      await userEvent.clear(screen.getByTestId('sandbox-name'));
      fireEvent.submit(screen.getByTestId('create-sandbox-form'));

      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    it('should build a sandbox from the defaults', async () => {
      renderComponent();

      await userEvent.click(screen.getByTestId('submit-sandbox-button'));

      expect(mockCreate).toHaveBeenCalledWith({
        metadata: { name: 'sandbox-abcd' },
        spec: {
          podTemplate: {
            spec: {
              containers: [
                {
                  name: 'main',
                  image: 'registry.access.redhat.com/ubi9/ubi-minimal:latest',
                  command: ['/bin/sh', '-c', 'sleep infinity'],
                  resources: { limits: { cpu: '500m', memory: '512Mi' } },
                },
              ],
            },
          },
        },
      });
    });

    it('should drop the requests of the sample and keep the rest of its spec', async () => {
      renderComponent({ sampleId: 'python-runtime' });

      await userEvent.clear(screen.getByTestId('sandbox-cpu-limit'));
      await userEvent.paste('250m');
      await userEvent.click(screen.getByTestId('submit-sandbox-button'));

      expect(mockCreate).toHaveBeenCalledWith({
        metadata: { name: 'python-runtime-abcd' },
        spec: {
          podTemplate: {
            spec: {
              containers: [
                {
                  name: 'python-sandbox',
                  image: 'docker.io/library/python:3.12-slim',
                  command: ['/bin/sh', '-c', 'sleep infinity'],
                  ports: [{ containerPort: 8888 }],
                  resources: { limits: { cpu: '250m', memory: '2Gi' } },
                },
              ],
            },
          },
          service: true,
        },
      });
    });

    it('should set the runtime class and omit the resources when both limits are empty', async () => {
      renderComponent();

      await userEvent.click(screen.getByTestId('sandbox-runtime-class'));
      await userEvent.paste('gvisor');
      await userEvent.clear(screen.getByTestId('sandbox-cpu-limit'));
      await userEvent.clear(screen.getByTestId('sandbox-memory-limit'));
      await userEvent.click(screen.getByTestId('submit-sandbox-button'));

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          spec: expect.objectContaining({
            podTemplate: {
              spec: expect.objectContaining({
                runtimeClassName: 'gvisor',
                containers: [expect.objectContaining({ resources: undefined })],
              }),
            },
          }),
        }),
      );
    });
  });
});

function getDefaultProps(): Props {
  return {
    error: undefined,
    existingNames: [],
    isLoading: false,
    sampleId: undefined,
    onCancel: mockCancel,
    onCreate: mockCreate,
  };
}

function renderComponent(propsOverrides: Partial<Props> = {}): RenderResult {
  return render(<AgentSpaceCreate {...getDefaultProps()} {...propsOverrides} />);
}
