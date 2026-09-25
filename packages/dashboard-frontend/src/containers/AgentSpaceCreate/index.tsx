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
import { Location, NavigateFunction, useLocation, useNavigate } from 'react-router-dom';

import AgentSpaceCreate from '@/pages/AgentSpaceCreate';
import {
  buildAgentSpaceDetailsLocation,
  buildAgentSpaceLocation,
} from '@/services/helpers/location';
import { getSandboxName } from '@/services/sandbox';
import { RootState } from '@/store';
import { sandboxesActionCreators } from '@/store/Sandboxes';
import {
  selectSandboxes,
  selectSandboxesError,
  selectSandboxesIsLoading,
} from '@/store/Sandboxes/selectors';

export type Props = MappedProps & {
  location: Location;
  navigate: NavigateFunction;
};

export class AgentSpaceCreateContainer extends React.PureComponent<Props> {
  public componentDidMount(): void {
    // The list is needed to reject a name that is already taken.
    this.props.requestSandboxes().catch(error => {
      console.error(error);
    });
  }

  private get sampleId(): string | undefined {
    const sampleId = new URLSearchParams(this.props.location.search).get('sample');
    return sampleId === null ? undefined : sampleId;
  }

  private handleCreate(sandbox: api.ISandbox): void {
    this.props
      .createSandbox(sandbox)
      .then(() => {
        this.props.navigate(buildAgentSpaceDetailsLocation(getSandboxName(sandbox)));
      })
      .catch(error => {
        // The error is kept in the store and rendered by the page.
        console.error(error);
      });
  }

  public render(): React.ReactElement {
    const { error, isLoading, sandboxes } = this.props;

    return (
      <AgentSpaceCreate
        error={error}
        existingNames={sandboxes.map(sandbox => getSandboxName(sandbox))}
        isLoading={isLoading}
        sampleId={this.sampleId}
        onCancel={() => this.props.navigate(buildAgentSpaceLocation())}
        onCreate={sandbox => this.handleCreate(sandbox)}
      />
    );
  }
}

function ContainerWrapper(props: MappedProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return <AgentSpaceCreateContainer {...props} location={location} navigate={navigate} />;
}

const mapStateToProps = (state: RootState) => ({
  error: selectSandboxesError(state),
  isLoading: selectSandboxesIsLoading(state),
  sandboxes: selectSandboxes(state),
});

const mapDispatchToProps = {
  ...sandboxesActionCreators,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(ContainerWrapper);
