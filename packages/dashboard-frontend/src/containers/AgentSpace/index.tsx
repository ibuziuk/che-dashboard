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
import { NavigateFunction, useNavigate } from 'react-router-dom';

import AgentSpace from '@/pages/AgentSpace';
import {
  buildAgentSpaceCreateLocation,
  buildAgentSpaceDetailsLocation,
} from '@/services/helpers/location';
import { getSandboxName } from '@/services/sandbox';
import { ISandboxSample } from '@/services/sandbox/samples';
import { RootState } from '@/store';
import { sandboxesActionCreators } from '@/store/Sandboxes';
import {
  selectHasTransitioningSandboxes,
  selectSandboxes,
  selectSandboxesError,
  selectSandboxesIsLoading,
} from '@/store/Sandboxes/selectors';

/** How often the status of the running and transitioning sandboxes is refreshed. */
export const POLLING_INTERVAL_MS = 5000;

export type Props = MappedProps & {
  navigate: NavigateFunction;
};

export class AgentSpaceContainer extends React.PureComponent<Props> {
  private pollingId: number | undefined;

  public componentDidMount(): void {
    this.requestSandboxes();

    this.pollingId = window.setInterval(() => {
      if (this.props.hasTransitioningSandboxes) {
        this.requestSandboxes(true);
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
  private requestSandboxes(isPolling = false): void {
    this.props.requestSandboxes(isPolling).catch(error => {
      console.error(error);
    });
  }

  private handleChangeOperatingMode(name: string, operatingMode: api.SandboxOperatingMode): void {
    this.props.changeSandboxOperatingMode(name, operatingMode).catch(error => {
      console.error(error);
    });
  }

  private handleDelete(name: string): void {
    this.props.deleteSandbox(name).catch(error => {
      console.error(error);
    });
  }

  private handleSampleClick(sample: ISandboxSample): void {
    this.props.navigate(buildAgentSpaceCreateLocation(sample.id));
  }

  private handleSandboxClick(sandbox: api.ISandbox): void {
    this.props.navigate(buildAgentSpaceDetailsLocation(getSandboxName(sandbox)));
  }

  public render(): React.ReactElement {
    const { error, isLoading, sandboxes } = this.props;

    return (
      <AgentSpace
        error={error}
        isLoading={isLoading}
        sandboxes={sandboxes}
        onChangeOperatingMode={(name, operatingMode) =>
          this.handleChangeOperatingMode(name, operatingMode)
        }
        onCreateClick={() => this.props.navigate(buildAgentSpaceCreateLocation())}
        onDelete={name => this.handleDelete(name)}
        onRefresh={() => this.requestSandboxes()}
        onSampleClick={sample => this.handleSampleClick(sample)}
        onSandboxClick={sandbox => this.handleSandboxClick(sandbox)}
      />
    );
  }
}

function ContainerWrapper(props: MappedProps) {
  const navigate = useNavigate();

  return <AgentSpaceContainer {...props} navigate={navigate} />;
}

const mapStateToProps = (state: RootState) => ({
  error: selectSandboxesError(state),
  hasTransitioningSandboxes: selectHasTransitioningSandboxes(state),
  isLoading: selectSandboxesIsLoading(state),
  sandboxes: selectSandboxes(state),
});

const mapDispatchToProps = {
  ...sandboxesActionCreators,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(ContainerWrapper);
