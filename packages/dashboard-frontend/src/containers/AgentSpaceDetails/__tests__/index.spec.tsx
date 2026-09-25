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

import { CoreV1Event } from '@kubernetes/client-node';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Store } from 'redux';

import AgentSpaceDetailsContainer, { POLLING_INTERVAL_MS } from '@/containers/AgentSpaceDetails';
import { Props as AgentSpaceDetailsProps } from '@/pages/AgentSpaceDetails';
import { SANDBOX_CONDITION_READY, SANDBOX_CONDITION_SUSPENDED } from '@/services/sandbox';
import { AppThunk } from '@/store';
import { MockStoreBuilder } from '@/store/__mocks__/mockStore';
import { buildCondition, buildSandbox } from '@/store/__mocks__/sandboxBuilder';

const mockChangeSandboxOperatingMode = jest.fn();
const mockDeleteSandbox = jest.fn();
const mockRequestSandbox = jest.fn();
const mockRequestEvents = jest.fn();

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
    requestSandbox:
      (...args: unknown[]): AppThunk =>
      async () =>
        mockRequestSandbox(...args),
  },
}));

jest.mock('@/store/Events/actions', () => ({
  ...jest.requireActual('@/store/Events/actions'),
  actionCreators: {
    requestEvents: (): AppThunk => async () => mockRequestEvents(),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@/pages/AgentSpaceDetails', () => {
  const FakeAgentSpaceDetails = (props: AgentSpaceDetailsProps): React.ReactElement => (
    <div>
      <span data-testid="sandbox-name">{props.sandboxName}</span>
      <span data-testid="has-sandbox">{(props.sandbox !== undefined).toString()}</span>
      <span data-testid="events-count">{props.events.length}</span>
      <span data-testid="error">{props.error || ''}</span>
      <button data-testid="back" onClick={() => props.onBack()} />
      <button
        data-testid="stop"
        onClick={() => props.onChangeOperatingMode(props.sandboxName, 'Suspended')}
      />
      <button data-testid="delete" onClick={() => props.onDelete(props.sandboxName)} />
    </div>
  );
  FakeAgentSpaceDetails.displayName = 'FakeAgentSpaceDetails';
  return FakeAgentSpaceDetails;
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

describe('Sandbox Details Container', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should request the sandbox and the events on mount', () => {
    renderComponent(buildStore([runningSandbox]));

    expect(mockRequestSandbox).toHaveBeenCalledWith('my-sandbox', false);
    expect(mockRequestEvents).toHaveBeenCalled();
  });

  it('should read the sandbox name from the route', () => {
    renderComponent(buildStore([runningSandbox]));

    expect(screen.getByTestId('sandbox-name')).toHaveTextContent('my-sandbox');
    expect(screen.getByTestId('has-sandbox')).toHaveTextContent('true');
  });

  it('should pass no sandbox when it is not in the store', () => {
    renderComponent(buildStore([]));

    expect(screen.getByTestId('has-sandbox')).toHaveTextContent('false');
  });

  it('should pass only the events of the sandbox', () => {
    const events = [
      { metadata: { uid: '1' }, involvedObject: { name: 'my-sandbox' } },
      { metadata: { uid: '2' }, involvedObject: { name: 'other-sandbox' } },
    ] as CoreV1Event[];

    renderComponent(buildStore([runningSandbox], undefined, events));

    expect(screen.getByTestId('events-count')).toHaveTextContent('1');
  });

  it('should pass the error down to the page', () => {
    renderComponent(buildStore([runningSandbox], 'no access'));

    expect(screen.getByTestId('error')).toHaveTextContent('no access');
  });

  it('should navigate back', async () => {
    renderComponent(buildStore([runningSandbox]));

    await userEvent.click(screen.getByTestId('back'));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/agent-space' }),
    );
  });

  it('should change the operating mode', async () => {
    renderComponent(buildStore([runningSandbox]));

    await userEvent.click(screen.getByTestId('stop'));

    expect(mockChangeSandboxOperatingMode).toHaveBeenCalledWith('my-sandbox', 'Suspended');
  });

  it('should navigate back once the sandbox is deleted', async () => {
    renderComponent(buildStore([runningSandbox]));

    await userEvent.click(screen.getByTestId('delete'));

    expect(mockDeleteSandbox).toHaveBeenCalledWith('my-sandbox');
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/agent-space' }),
      );
    });
  });

  it('should stay on the page when the deletion fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockDeleteSandbox.mockImplementation(() => {
      throw new Error('forbidden');
    });

    renderComponent(buildStore([runningSandbox]));
    await userEvent.click(screen.getByTestId('delete'));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    consoleError.mockRestore();
    mockDeleteSandbox.mockReset();
  });

  describe('polling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should poll while the sandbox is running', () => {
      renderComponent(buildStore([runningSandbox]));
      mockRequestSandbox.mockClear();

      act(() => {
        jest.advanceTimersByTime(POLLING_INTERVAL_MS);
      });

      expect(mockRequestSandbox).toHaveBeenCalledWith('my-sandbox', true);
    });

    it('should not poll a hibernated sandbox', () => {
      renderComponent(buildStore([hibernatedSandbox]));
      mockRequestSandbox.mockClear();

      act(() => {
        jest.advanceTimersByTime(POLLING_INTERVAL_MS * 3);
      });

      expect(mockRequestSandbox).not.toHaveBeenCalled();
    });

    it('should not poll a sandbox that is not in the store', () => {
      renderComponent(buildStore([]));
      mockRequestSandbox.mockClear();

      act(() => {
        jest.advanceTimersByTime(POLLING_INTERVAL_MS * 3);
      });

      expect(mockRequestSandbox).not.toHaveBeenCalled();
    });

    it('should stop polling once unmounted', () => {
      const { unmount } = renderComponent(buildStore([runningSandbox]));
      mockRequestSandbox.mockClear();

      unmount();
      act(() => {
        jest.advanceTimersByTime(POLLING_INTERVAL_MS * 3);
      });

      expect(mockRequestSandbox).not.toHaveBeenCalled();
    });
  });
});

function buildStore(
  sandboxes: ReturnType<typeof buildSandbox>[],
  error?: string,
  events: CoreV1Event[] = [],
): Store {
  return new MockStoreBuilder().withSandboxes({ sandboxes, error }).withEvents({ events }).build();
}

function renderComponent(store: Store) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/agent-space/sandbox/my-sandbox']}>
        <Routes>
          <Route
            path="/agent-space/sandbox/:sandboxName"
            element={<AgentSpaceDetailsContainer />}
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}
