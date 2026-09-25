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

import { api } from '@eclipse-che/common';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { NavigateFunction, useNavigate, useParams } from 'react-router-dom';

import AgentSpaceDetails from '@/pages/AgentSpaceDetails';
import { SandboxRouteParams } from '@/Routes';
import { buildAgentSpaceLocation } from '@/services/helpers/location';
import { isSandboxTransitioning } from '@/services/sandbox';
import { RootState } from '@/store';
import { eventsActionCreators } from '@/store/Events';
import { sandboxesActionCreators } from '@/store/Sandboxes';
import {
  selectSandboxByName,
  selectSandboxesError,
  selectSandboxesIsLoading,
  selectSandboxEvents,
} from '@/store/Sandboxes/selectors';

/** How often the status of a running or transitioning sandbox is refreshed. */
export const POLLING_INTERVAL_MS = 5000;

export type OwnProps = {
  navigate: NavigateFunction;
  sandboxName: string;
};

export type Props = MappedProps & OwnProps;

export class AgentSpaceDetailsContainer extends React.PureComponent<Props> {
  private pollingId: number | undefined;

  public componentDidMount(): void {
    this.requestSandbox();

    this.props.requestEvents().catch(error => {
      console.error(error);
    });

    this.pollingId = window.setInterval(() => {
      const { sandbox } = this.props;
      if (sandbox !== undefined && isSandboxTransitioning(sandbox)) {
        this.requestSandbox(true);
      }
    }, POLLING_INTERVAL_MS);
  }

  public componentWillUnmount(): void {
    if (this.pollingId !== undefined) {
      window.clearInterval(this.pollingId);
      this.pollingId = undefined;
    }
  }

  /** The error is kept in the store and rendered by the page, so it is only logged here. */
  private requestSandbox(isPolling = false): void {
    this.props.requestSandbox(this.props.sandboxName, isPolling).catch(error => {
      console.error(error);
    });
  }

  private handleChangeOperatingMode(name: string, operatingMode: api.SandboxOperatingMode): void {
    this.props.changeSandboxOperatingMode(name, operatingMode).catch(error => {
      console.error(error);
    });
  }

  private handleDelete(name: string): void {
    this.props
      .deleteSandbox(name)
      .then(() => {
        this.props.navigate(buildAgentSpaceLocation());
      })
      .catch(error => {
        console.error(error);
      });
  }

  public render(): React.ReactElement {
    const { error, events, isLoading, sandbox, sandboxName } = this.props;

    return (
      <AgentSpaceDetails
        error={error}
        events={events}
        isLoading={isLoading}
        sandbox={sandbox}
        sandboxName={sandboxName}
        onBack={() => this.props.navigate(buildAgentSpaceLocation())}
        onChangeOperatingMode={(name, operatingMode) =>
          this.handleChangeOperatingMode(name, operatingMode)
        }
        onDelete={name => this.handleDelete(name)}
      />
    );
  }
}

const mapStateToProps = (state: RootState, ownProps: OwnProps) => ({
  error: selectSandboxesError(state),
  events: selectSandboxEvents(state, ownProps.sandboxName),
  isLoading: selectSandboxesIsLoading(state),
  sandbox: selectSandboxByName(state, ownProps.sandboxName),
});

const mapDispatchToProps = {
  ...sandboxesActionCreators,
  requestEvents: eventsActionCreators.requestEvents,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type MappedProps = ConnectedProps<typeof connector>;

const ConnectedAgentSpaceDetails = connector(AgentSpaceDetailsContainer);

export default function AgentSpaceDetailsContainerWrapper(): React.ReactElement {
  const navigate = useNavigate();
  const { sandboxName } = useParams<keyof SandboxRouteParams>();

  return <ConnectedAgentSpaceDetails navigate={navigate} sandboxName={sandboxName || ''} />;
}
