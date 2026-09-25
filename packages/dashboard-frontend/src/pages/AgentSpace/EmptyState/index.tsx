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

import {
  Button,
  ButtonVariant,
  Content,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateVariant,
  PageSection,
  PageSectionVariants,
} from '@patternfly/react-core';
import { PlusCircleIcon, RobotIcon } from '@patternfly/react-icons';
import React from 'react';

import { SandboxSamplesGallery } from '@/pages/AgentSpace/SamplesGallery';
import { ISandboxSample } from '@/services/sandbox/samples';

export type Props = {
  onSampleClick: (sample: ISandboxSample) => void;
  onCreateClick: () => void;
};

export class AgentSpaceEmptyState extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    const { onCreateClick, onSampleClick } = this.props;

    return (
      <React.Fragment>
        <EmptyState
          variant={EmptyStateVariant.sm}
          icon={RobotIcon}
          titleText="No sandboxes yet"
          data-testid="agent-space-empty-state"
        >
          <EmptyStateBody>
            A sandbox is an isolated environment where an agent can run code, browse and keep its
            files. Pick one of the samples below, or configure your own.
          </EmptyStateBody>
          <EmptyStateActions>
            <Button
              icon={<PlusCircleIcon />}
              iconPosition="left"
              variant={ButtonVariant.link}
              onClick={() => onCreateClick()}
              data-testid="empty-state-create-sandbox-button"
            >
              Create Sandbox
            </Button>
          </EmptyStateActions>
        </EmptyState>
        <PageSection variant={PageSectionVariants.default}>
          <Content>
            <Content component="h2">Getting Started</Content>
          </Content>
          <SandboxSamplesGallery onSampleClick={onSampleClick} />
        </PageSection>
      </React.Fragment>
    );
  }
}
