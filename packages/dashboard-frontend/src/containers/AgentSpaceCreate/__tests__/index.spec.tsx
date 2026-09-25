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

import 'reflect-metadata';

import { api } from '@eclipse-che/common';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Store } from 'redux';

import AgentSpaceCreateContainer from '@/containers/AgentSpaceCreate';
import { Props as AgentSpaceCreateProps } from '@/pages/AgentSpaceCreate';
import { AppThunk } from '@/store';
import { MockStoreBuilder } from '@/store/__mocks__/mockStore';
import { buildSandbox } from '@/store/__mocks__/sandboxBuilder';

const mockCreateSandbox = jest.fn();
const mockRequestSandboxes = jest.fn();
const mockSandboxSpec: api.ISandboxSpec = {
  podTemplate: {
    spec: {
      containers: [{ name: 'main', image: 'quay.io/sandbox/hello-world:latest' }],
    },
  },
};

jest.mock('@/store/Sandboxes/actions', () => ({
  ...jest.requireActual('@/store/Sandboxes/actions'),
  actionCreators: {
    createSandbox:
      (...args: unknown[]): AppThunk =>
      async () =>
        mockCreateSandbox(...args),
    requestSandboxes:
      (...args: unknown[]): AppThunk =>
      async () =>
        mockRequestSandboxes(...args),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@/pages/AgentSpaceCreate', () => {
  const FakeAgentSpaceCreate = (props: AgentSpaceCreateProps): React.ReactElement => (
    <div>
      <span data-testid="sample-id">{props.sampleId || 'none'}</span>
      <span data-testid="existing-names">{props.existingNames.join(',')}</span>
      <span data-testid="error">{props.error || ''}</span>
      <button data-testid="cancel" onClick={() => props.onCancel()} />
      <button
        data-testid="create"
        onClick={() => props.onCreate({ metadata: { name: 'new-sandbox' }, spec: mockSandboxSpec })}
      />
    </div>
  );
  FakeAgentSpaceCreate.displayName = 'FakeAgentSpaceCreate';
  return FakeAgentSpaceCreate;
});

describe('Create Sandbox Container', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should request the sandboxes on mount', () => {
    renderComponent(buildStore());

    expect(mockRequestSandboxes).toHaveBeenCalled();
  });

  it('should pass the existing names down to the page', () => {
    renderComponent(
      buildStore([buildSandbox({ name: 'first' }), buildSandbox({ name: 'second' })]),
    );

    expect(screen.getByTestId('existing-names')).toHaveTextContent('first,second');
  });

  it('should read the sample from the query string', () => {
    renderComponent(buildStore(), '/agent-space/create?sample=jupyterlab');

    expect(screen.getByTestId('sample-id')).toHaveTextContent('jupyterlab');
  });

  it('should pass no sample when the query string is empty', () => {
    renderComponent(buildStore());

    expect(screen.getByTestId('sample-id')).toHaveTextContent('none');
  });

  it('should pass the error down to the page', () => {
    renderComponent(buildStore([], 'forbidden'));

    expect(screen.getByTestId('error')).toHaveTextContent('forbidden');
  });

  it('should navigate back on cancel', async () => {
    renderComponent(buildStore());

    await userEvent.click(screen.getByTestId('cancel'));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/agent-space' }),
    );
  });

  it('should navigate to the new sandbox once it is created', async () => {
    renderComponent(buildStore());

    await userEvent.click(screen.getByTestId('create'));

    expect(mockCreateSandbox).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { name: 'new-sandbox' } }),
    );
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/agent-space/sandbox/new-sandbox' }),
      );
    });
  });

  it('should stay on the page when the creation fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockCreateSandbox.mockImplementation(() => {
      throw new Error('already exists');
    });

    renderComponent(buildStore());
    await userEvent.click(screen.getByTestId('create'));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    consoleError.mockRestore();
    mockCreateSandbox.mockReset();
  });
});

function buildStore(sandboxes: ReturnType<typeof buildSandbox>[] = [], error?: string): Store {
  return new MockStoreBuilder().withSandboxes({ sandboxes, error }).build();
}

function renderComponent(store: Store, entry = '/agent-space/create') {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/agent-space/create" element={<AgentSpaceCreateContainer />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}
