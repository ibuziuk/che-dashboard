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
import {
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  Content,
  Divider,
  PageSection,
  PageSectionVariants,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon, PlusCircleIcon, SyncAltIcon } from '@patternfly/react-icons';
import React from 'react';

import Head from '@/components/Head';
import { SandboxDeleteModal } from '@/pages/AgentSpace/DeleteModal';
import { AgentSpaceEmptyState } from '@/pages/AgentSpace/EmptyState';
import { SandboxesTable } from '@/pages/AgentSpace/SandboxesTable';
import { getOperatingModeForAction, getSandboxName, SandboxAction } from '@/services/sandbox';
import { ISandboxSample } from '@/services/sandbox/samples';

export const AGENT_SANDBOX_DOCS_URL = 'https://agent-sandbox.sigs.k8s.io/';

export type Props = {
  error: string | undefined;
  isLoading: boolean;
  sandboxes: api.ISandbox[];
  onChangeOperatingMode: (name: string, operatingMode: api.SandboxOperatingMode) => void;
  onCreateClick: () => void;
  onDelete: (name: string) => void;
  onRefresh: () => void;
  onSampleClick: (sample: ISandboxSample) => void;
  onSandboxClick: (sandbox: api.ISandbox) => void;
};

export type State = {
  sandboxToDelete: string | undefined;
};

export class AgentSpace extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      sandboxToDelete: undefined,
    };
  }

  private handleAction(sandbox: api.ISandbox, action: SandboxAction): void {
    const name = getSandboxName(sandbox);

    if (action === SandboxAction.DELETE) {
      this.setState({ sandboxToDelete: name });
      return;
    }

    const operatingMode = getOperatingModeForAction(action);
    if (operatingMode !== undefined) {
      this.props.onChangeOperatingMode(name, operatingMode);
    }
  }

  private handleDeleteConfirm(): void {
    const { sandboxToDelete } = this.state;
    if (sandboxToDelete !== undefined) {
      this.props.onDelete(sandboxToDelete);
    }
  }

  private renderToolbar(): React.ReactElement {
    return (
      <Toolbar data-testid="agent-space-toolbar">
        <ToolbarContent>
          <ToolbarItem>
            <Button
              variant={ButtonVariant.primary}
              icon={<PlusCircleIcon />}
              iconPosition="left"
              onClick={() => this.props.onCreateClick()}
              data-testid="create-sandbox-button"
            >
              Create Sandbox
            </Button>
          </ToolbarItem>
          <ToolbarItem>
            <Button
              variant={ButtonVariant.secondary}
              icon={<SyncAltIcon />}
              iconPosition="left"
              onClick={() => this.props.onRefresh()}
              data-testid="refresh-sandboxes-button"
            >
              Refresh
            </Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    );
  }

  private renderContent(): React.ReactElement {
    const { isLoading, sandboxes } = this.props;

    if (isLoading && sandboxes.length === 0) {
      return (
        <PageSection
          variant={PageSectionVariants.default}
          isFilled={true}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <Spinner
            size="xl"
            data-testid="sandboxes-loading-spinner"
            aria-label="Loading sandboxes"
          />
        </PageSection>
      );
    }

    if (sandboxes.length === 0) {
      return (
        <AgentSpaceEmptyState
          onCreateClick={() => this.props.onCreateClick()}
          onSampleClick={sample => this.props.onSampleClick(sample)}
        />
      );
    }

    return (
      <PageSection variant={PageSectionVariants.default}>
        {this.renderToolbar()}
        <SandboxesTable
          sandboxes={sandboxes}
          onAction={(sandbox, action) => this.handleAction(sandbox, action)}
          onSandboxClick={sandbox => this.props.onSandboxClick(sandbox)}
        />
      </PageSection>
    );
  }

  public render(): React.ReactElement {
    const { error } = this.props;
    const { sandboxToDelete } = this.state;

    return (
      <React.Fragment>
        <Head pageName="Agent Space" />
        <PageSection variant={PageSectionVariants.default}>
          <Content>
            <Content component="h1">Agent Space</Content>
            <Content component="p">
              A sandbox is an isolated, Kubernetes-native environment that an AI agent can use to
              run code and keep its files.&emsp;
              <a href={AGENT_SANDBOX_DOCS_URL} target="_blank" rel="noopener noreferrer">
                Learn&nbsp;more&nbsp;
                <ExternalLinkAltIcon />
              </a>
            </Content>
          </Content>
        </PageSection>
        <Divider component="div" />
        {error !== undefined && (
          <PageSection variant={PageSectionVariants.default}>
            <Alert
              variant={AlertVariant.danger}
              isInline
              title="Failed to load sandboxes"
              data-testid="sandboxes-error"
            >
              {error}
            </Alert>
          </PageSection>
        )}
        {this.renderContent()}
        <SandboxDeleteModal
          isOpen={sandboxToDelete !== undefined}
          sandboxName={sandboxToDelete || ''}
          onConfirm={() => this.handleDeleteConfirm()}
          onClose={() => this.setState({ sandboxToDelete: undefined })}
        />
      </React.Fragment>
    );
  }
}

export default AgentSpace;
