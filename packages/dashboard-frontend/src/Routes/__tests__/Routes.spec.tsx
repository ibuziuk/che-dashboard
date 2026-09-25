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

import { render, screen, waitFor } from '@testing-library/react';
import { Location } from 'history';
import React, { Suspense } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import Fallback from '@/components/Fallback';
import { AppRoutes, ROUTE } from '@/Routes';
import {
  buildDetailsLocation,
  buildGettingStartedLocation,
  buildIdeLoaderLocation,
  buildWorkspacesLocation,
} from '@/services/helpers/location';
import { LoaderTab, WorkspaceDetailsTab } from '@/services/helpers/types';
import { constructWorkspace, Workspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';
import { MockStoreBuilder } from '@/store/__mocks__/mockStore';

jest.mock('@/pages/GetStarted', () => {
  return function GetStarted() {
    return <span>Create Workspace</span>;
  };
});
jest.mock('@/containers/WorkspacesList', () => {
  return function WorkspacesList() {
    return <span>Workspaces List</span>;
  };
});
jest.mock('@/containers/WorkspaceDetails', () => {
  return function WorkspaceDetails() {
    return <span>Workspace Details</span>;
  };
});
jest.mock('@/containers/Loader', () => {
  return function Loader() {
    return <span>Loader</span>;
  };
});
jest.mock('@/pages/UserPreferences', () => {
  return function UserPreferences() {
    return <span>User Preferences</span>;
  };
});
jest.mock('@/Routes/NavigateHome', () => {
  return function NavigateHome() {
    return <span>Navigate Home</span>;
  };
});
jest.mock('@/containers/AgentSpace', () => {
  return function AgentSpace() {
    return <span>Agent Space</span>;
  };
});
jest.mock('@/containers/AgentSpaceCreate', () => {
  return function AgentSpaceCreate() {
    return <span>Create Sandbox</span>;
  };
});
jest.mock('@/containers/AgentSpaceDetails', () => {
  return function AgentSpaceDetails() {
    return <span>Sandbox Details</span>;
  };
});

describe('Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Workspace route', () => {
    it('should handle "/"', async () => {
      const path = ROUTE.HOME;
      render(getComponent(path));

      await waitFor(() => expect(screen.queryByText('Navigate Home')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });

    it('should handle "/create-workspace"', async () => {
      const location = buildGettingStartedLocation();
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Create Workspace')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Workspaces List route', () => {
    it('should handle "/workspaces"', async () => {
      const location = buildWorkspacesLocation();
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Workspaces List')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Workspace Details route', () => {
    let workspace: Workspace;

    beforeEach(() => {
      workspace = constructWorkspace(
        new DevWorkspaceBuilder().withNamespace('namespace').withName('wksp').build(),
      );
    });

    it('should handle "/workspace/namespace/name"', async () => {
      const location = buildDetailsLocation(workspace);
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Workspace Details')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });

    it('should handle "/workspace/namespace/name?tab=Overview"', async () => {
      const location = buildDetailsLocation(workspace, WorkspaceDetailsTab.OVERVIEW);
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Workspace Details')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });

    it('should handle "/workspace/namespace/name?tab=Devfile"', async () => {
      const location = buildDetailsLocation(workspace, WorkspaceDetailsTab.DEVFILE);
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Workspace Details')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });

    it('should handle "/workspace/namespace/name?tab=Logs"', async () => {
      const location = buildDetailsLocation(workspace, WorkspaceDetailsTab.LOGS);
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Workspace Details')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });

    it('should handle "/workspace/namespace/name?tab=Events"', async () => {
      const location = buildDetailsLocation(workspace, WorkspaceDetailsTab.EVENTS);
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Workspace Details')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });
  });

  describe('IDE Loader route', () => {
    let workspace: Workspace;

    beforeEach(() => {
      workspace = constructWorkspace(
        new DevWorkspaceBuilder().withNamespace('namespace').withName('wksp').build(),
      );
    });

    it('should handle "/ide/namespace/name"', async () => {
      const location = buildIdeLoaderLocation(workspace);
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Loader')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });

    it('should handle "/ide/namespace/name?tab=Progress"', async () => {
      const path = buildIdeLoaderLocation(workspace, LoaderTab.Progress);
      render(getComponent(path));

      await waitFor(() => expect(screen.queryByText('Loader')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });

    it('should handle "/ide/namespace/name?tab=Logs"', async () => {
      const location = buildIdeLoaderLocation(workspace, LoaderTab.Logs);
      render(getComponent(location));

      await waitFor(() => expect(screen.queryByText('Loader')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });
  });

  describe('User Preferences route', () => {
    it('should handle "/user-preferences"', async () => {
      const path = ROUTE.USER_PREFERENCES;
      render(getComponent(path));

      await waitFor(() => expect(screen.queryByText('User Preferences')).toBeTruthy());

      expect(screen.queryByTestId('fallback-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Agent Space routes', () => {
    describe('when the agent sandbox is enabled', () => {
      it('should handle "/agent-space"', async () => {
        render(getComponent(ROUTE.AGENT_SPACE, true));

        await waitFor(() => expect(screen.queryByText('Agent Space')).toBeTruthy());
      });

      it('should handle "/agent-space/create"', async () => {
        render(getComponent(ROUTE.AGENT_SPACE_CREATE, true));

        await waitFor(() => expect(screen.queryByText('Create Sandbox')).toBeTruthy());
      });

      it('should handle "/agent-space/sandbox/my-sandbox"', async () => {
        render(getComponent('/agent-space/sandbox/my-sandbox', true));

        await waitFor(() => expect(screen.queryByText('Sandbox Details')).toBeTruthy());
      });
    });

    describe('when the agent sandbox is disabled', () => {
      it.each([ROUTE.AGENT_SPACE, ROUTE.AGENT_SPACE_CREATE, '/agent-space/sandbox/my-sandbox'])(
        'should redirect "%s" home',
        async path => {
          render(getComponent(path));

          await waitFor(() => expect(screen.queryByText('Navigate Home')).toBeTruthy());

          expect(screen.queryByText('Agent Space')).toBeFalsy();
          expect(screen.queryByText('Create Sandbox')).toBeFalsy();
          expect(screen.queryByText('Sandbox Details')).toBeFalsy();
        },
      );
    });
  });
});

function getComponent(
  locationOrPath: Location | string,
  agentSandboxEnabled = false,
): React.ReactElement {
  const store = new MockStoreBuilder()
    .withDwServerConfig({ agentSandbox: { enabled: agentSandboxEnabled } })
    .build();
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={[locationOrPath]}>
        <Suspense fallback={Fallback}>
          <AppRoutes />
        </Suspense>
      </MemoryRouter>
    </Provider>
  );
}
