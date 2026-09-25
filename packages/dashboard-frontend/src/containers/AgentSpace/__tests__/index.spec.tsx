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

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Store } from 'redux';

import AgentSpaceContainer, { POLLING_INTERVAL_MS } from '@/containers/AgentSpace';
import { Props as AgentSpaceProps } from '@/pages/AgentSpace';
import { SANDBOX_CONDITION_READY, SANDBOX_CONDITION_SUSPENDED } from '@/services/sandbox';
import { SANDBOX_SAMPLES } from '@/services/sandbox/samples';
import { AppThunk } from '@/store';
import { MockStoreBuilder } from '@/store/__mocks__/mockStore';
import { buildCondition, buildSandbox } from '@/store/__mocks__/sandboxBuilder';

const mockChangeSandboxOperatingMode = jest.fn();
const mockDeleteSandbox = jest.fn();
const mockRequestSandboxes = jest.fn();

jest.mock('@/store/Sandboxes/actions', () => ({
  ...jest.requireActual('@/store/Sandboxes/actions'),
  actionCreators: {
    changeSandboxOperatingMode:
      (...args: unknown[]): AppThunk =>
      async () =>
        mockChangeSandboxOperatingMode(...args),
    deleteSandbox:
      (...args: unknown[]): AppThunk =>
      async () =>
        mockDeleteSandbox(...args),
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

jest.mock('@/pages/AgentSpace', () => {
  const FakeAgentSpace = (props: AgentSpaceProps): React.ReactElement => (
    <div>
      <span data-testid="sandboxes-count">{props.sandboxes.length}</span>
      <span data-testid="is-loading">{props.isLoading.toString()}</span>
      <span data-testid="error">{props.error || ''}</span>
      <button data-testid="create" onClick={() => props.onCreateClick()} />
      <button data-testid="refresh" onClick={() => props.onRefresh()} />
      <button data-testid="sample" onClick={() => props.onSampleClick(SANDBOX_SAMPLES[1])} />
      <button data-testid="open" onClick={() => props.onSandboxClick(props.sandboxes[0])} />
      <button
        data-testid="stop"
        onClick={() => props.onChangeOperatingMode('my-sandbox', 'Suspended')}
      />
      <button data-testid="delete" onClick={() => props.onDelete('my-sandbox')} />
    </div>
  );
  FakeAgentSpace.displayName = 'FakeAgentSpace';
  return FakeAgentSpace;
});

const runningSandbox = buildSandbox({
  name: 'my-sandbox',
  conditions: [buildCondition(SANDBOX_CONDITION_READY, 'True')],
});
const hibernatedSandbox = buildSandbox({
  name: 'my-sandbox',
  operatingMode: 'Suspended',
  conditions: [buildCondition(SANDBOX_CONDITION_SUSPENDED, 'True')],
});

describe('Agent Space Container', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should request the sandboxes on mount', () => {
    renderComponent(buildStore([]));

    expect(mockRequestSandboxes).toHaveBeenCalledWith(false);
  });

  it('should pass the store state down to the page', () => {
    renderComponent(buildStore([runningSandbox], true, 'no access'));

    expect(screen.getByTestId('sandboxes-count')).toHaveTextContent('1');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    expect(screen.getByTestId('error')).toHaveTextContent('no access');
  });

  it('should navigate to the create page', async () => {
    renderComponent(buildStore([]));

    await userEvent.click(screen.getByTestId('create'));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/agent-space/create', search: '' }),
    );
  });

  it('should navigate to the create page with the picked sample', async () => {
    renderComponent(buildStore([]));

    await userEvent.click(screen.getByTestId('sample'));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/agent-space/create',
        search: `?sample=${SANDBOX_SAMPLES[1].id}`,
      }),
    );
  });

  it('should navigate to the details page', async () => {
    renderComponent(buildStore([runningSandbox]));

    await userEvent.click(screen.getByTestId('open'));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/agent-space/sandbox/my-sandbox' }),
    );
  });

  it('should refresh the list', async () => {
    renderComponent(buildStore([]));
    mockRequestSandboxes.mockClear();

    await userEvent.click(screen.getByTestId('refresh'));

    expect(mockRequestSandboxes).toHaveBeenCalledWith(false);
  });

  it('should change the operating mode', async () => {
    renderComponent(buildStore([runningSandbox]));

    await userEvent.click(screen.getByTestId('stop'));

    expect(mockChangeSandboxOperatingMode).toHaveBeenCalledWith('my-sandbox', 'Suspended');
  });

  it('should delete a sandbox', async () => {
    renderComponent(buildStore([runningSandbox]));

    await userEvent.click(screen.getByTestId('delete'));

    expect(mockDeleteSandbox).toHaveBeenCalledWith('my-sandbox');
  });

  it('should log the failure of a request', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockRequestSandboxes.mockImplementation(() => {
      throw new Error('request failed');
    });

    renderComponent(buildStore([]));
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
    mockRequestSandboxes.mockReset();
  });

  describe('polling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should poll while a sandbox is running', () => {
      renderComponent(buildStore([runningSandbox]));
      mockRequestSandboxes.mockClear();

      act(() => {
        jest.advanceTimersByTime(POLLING_INTERVAL_MS);
      });

      expect(mockRequestSandboxes).toHaveBeenCalledWith(true);
    });

    it('should not poll when all the sandboxes are hibernated', () => {
      renderComponent(buildStore([hibernatedSandbox]));
      mockRequestSandboxes.mockClear();

      act(() => {
        jest.advanceTimersByTime(POLLING_INTERVAL_MS * 3);
      });

      expect(mockRequestSandboxes).not.toHaveBeenCalled();
    });

    it('should stop polling once unmounted', () => {
      const { unmount } = renderComponent(buildStore([runningSandbox]));
      mockRequestSandboxes.mockClear();

      unmount();
      act(() => {
        jest.advanceTimersByTime(POLLING_INTERVAL_MS * 3);
      });

      expect(mockRequestSandboxes).not.toHaveBeenCalled();
    });
  });
});

function buildStore(
  sandboxes: ReturnType<typeof buildSandbox>[],
  isLoading = false,
  error?: string,
): Store {
  return new MockStoreBuilder().withSandboxes({ sandboxes, error }, isLoading).build();
}

function renderComponent(store: Store) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/agent-space']}>
        <Routes>
          <Route path="/agent-space" element={<AgentSpaceContainer />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}
