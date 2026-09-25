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

import React from 'react';
import { useSelector } from 'react-redux';
import { Params, Route, Routes } from 'react-router-dom';

import AgentSpaceContainer from '@/containers/AgentSpace';
import AgentSpaceCreateContainer from '@/containers/AgentSpaceCreate';
import AgentSpaceDetailsContainer from '@/containers/AgentSpaceDetails';
import GetStartedContainer from '@/containers/GetStarted';
import RestoreFromBackupContainer from '@/containers/RestoreFromBackup';
import UserPreferencesContainer from '@/containers/UserPreferences';
import WorkspaceDetailsContainer from '@/containers/WorkspaceDetails';
import WorkspacesListContainer from '@/containers/WorkspacesList';
import { Redirects } from '@/Routes/Redirects';
import { selectAgentSandboxEnabled } from '@/store/ServerConfig/selectors';

export enum ROUTE {
  HOME = '/',
  GET_STARTED = '/create-workspace',
  WORKSPACES = '/workspaces',
  WORKSPACE_DETAILS = '/workspace/:namespace/:workspaceName',
  WORKSPACE_DETAILS_TAB = '/workspace/:namespace/:workspaceName?tab=:tabId',
  IDE_LOADER = '/ide/:namespace/:workspaceName',
  IDE_LOADER_TAB = '/ide/:namespace/:workspaceName?tab=:tabId',
  RESTORE_FROM_BACKUP = '/restore-from-backup',
  FACTORY_LOADER = '/load-factory',
  FACTORY_LOADER_URL = '/load-factory?url=:url',
  USER_PREFERENCES = '/user-preferences',
  USER_PREFERENCES_TAB = '/user-preferences?tab=:tabId',
  AGENT_SPACE = '/agent-space',
  AGENT_SPACE_CREATE = '/agent-space/create',
  AGENT_SPACE_DETAILS = '/agent-space/sandbox/:sandboxName',
}

export type WorkspaceRouteParams = Params<'namespace' | 'workspaceName'>;

export type SandboxRouteParams = Params<'sandboxName'>;

const LoaderContainer = React.lazy(() => import('../containers/Loader'));

export function AppRoutes(): React.ReactElement {
  // The Agent Space routes are gated by the `agentSandbox.enabled` property of the
  // CheCluster CR, so that a direct URL does not reach a disabled feature.
  const agentSandboxEnabled = useSelector(selectAgentSandboxEnabled);

  return (
    <Routes>
      <Route key="get-started" path={ROUTE.GET_STARTED} element={<GetStartedContainer />} />
      <Route key="workspaces-list" path={ROUTE.WORKSPACES} element={<WorkspacesListContainer />} />
      <Route
        key="workspace-details"
        path={ROUTE.WORKSPACE_DETAILS}
        element={<WorkspaceDetailsContainer />}
      />
      <Route key="ide-loader" path={ROUTE.IDE_LOADER} element={<LoaderContainer />} />
      <Route
        key="restore-from-backup"
        path={ROUTE.RESTORE_FROM_BACKUP}
        element={<RestoreFromBackupContainer />}
      />
      <Route key="factory-loader" path={ROUTE.FACTORY_LOADER} element={<LoaderContainer />} />
      <Route
        key="user-preferences"
        path={ROUTE.USER_PREFERENCES}
        element={<UserPreferencesContainer />}
      />
      {agentSandboxEnabled && (
        <Route key="agent-space" path={ROUTE.AGENT_SPACE} element={<AgentSpaceContainer />} />
      )}
      {agentSandboxEnabled && (
        <Route
          key="agent-space-create"
          path={ROUTE.AGENT_SPACE_CREATE}
          element={<AgentSpaceCreateContainer />}
        />
      )}
      {agentSandboxEnabled && (
        <Route
          key="agent-space-details"
          path={ROUTE.AGENT_SPACE_DETAILS}
          element={<AgentSpaceDetailsContainer />}
        />
      )}
      <Route key="redirects" path="*" element={<Redirects />} />
    </Routes>
  );
}
