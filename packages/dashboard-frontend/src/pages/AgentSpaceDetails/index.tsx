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
import { CoreV1Event } from '@kubernetes/client-node';
import {
  Alert,
  AlertVariant,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  ButtonVariant,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Flex,
  FlexItem,
  PageSection,
  PageSectionVariants,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import React from 'react';

import Head from '@/components/Head';
import { SandboxDeleteModal } from '@/pages/AgentSpace/DeleteModal';
import { SandboxStatusLabel } from '@/pages/AgentSpace/SandboxStatusLabel';
import { getFormattedDate } from '@/services/helpers/dates';
import {
  getOperatingModeForAction,
  getSandboxErrorMessage,
  getSandboxLifecycleActions,
  SandboxAction,
} from '@/services/sandbox';

export type Props = {
  error: string | undefined;
  events: CoreV1Event[];
  isLoading: boolean;
  sandbox: api.ISandbox | undefined;
  sandboxName: string;
  onBack: () => void;
  onChangeOperatingMode: (name: string, operatingMode: api.SandboxOperatingMode) => void;
  onDelete: (name: string) => void;
};

export type State = {
  isDeleteModalOpen: boolean;
};

export class AgentSpaceDetails extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isDeleteModalOpen: false,
    };
  }

  private handleAction(action: SandboxAction): void {
    const { sandboxName } = this.props;

    if (action === SandboxAction.DELETE) {
      this.setState({ isDeleteModalOpen: true });
      return;
    }

    const operatingMode = getOperatingModeForAction(action);
    if (operatingMode !== undefined) {
      this.props.onChangeOperatingMode(sandboxName, operatingMode);
    }
  }

  private renderActions(sandbox: api.ISandbox): React.ReactElement {
    const lifecycleActions = getSandboxLifecycleActions(sandbox);

    return (
      <Flex data-testid="sandbox-details-actions">
        {lifecycleActions.map(action => (
          <FlexItem key={action}>
            <Button
              variant={ButtonVariant.secondary}
              onClick={() => this.handleAction(action)}
              data-testid={`sandbox-action-${action.toLowerCase()}`}
            >
              {action}
            </Button>
          </FlexItem>
        ))}
        <FlexItem>
          <Button
            variant={ButtonVariant.danger}
            onClick={() => this.handleAction(SandboxAction.DELETE)}
            data-testid="sandbox-action-delete"
          >
            {SandboxAction.DELETE}
          </Button>
        </FlexItem>
      </Flex>
    );
  }

  private renderSpec(sandbox: api.ISandbox): React.ReactElement {
    const container = sandbox.spec?.podTemplate?.spec?.containers?.[0];
    const limits = container?.resources?.limits;
    const creationTimestamp = sandbox.metadata?.creationTimestamp;

    return (
      <DescriptionList isHorizontal data-testid="sandbox-spec">
        <DescriptionListGroup>
          <DescriptionListTerm>Namespace</DescriptionListTerm>
          <DescriptionListDescription>
            {sandbox.metadata?.namespace || '-'}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Created</DescriptionListTerm>
          <DescriptionListDescription>
            {creationTimestamp ? getFormattedDate(new Date(creationTimestamp)) : '-'}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Operating mode</DescriptionListTerm>
          <DescriptionListDescription>
            {sandbox.spec?.operatingMode || 'Running'}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Container image</DescriptionListTerm>
          <DescriptionListDescription>{container?.image || '-'}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Runtime class</DescriptionListTerm>
          <DescriptionListDescription>
            {sandbox.spec?.podTemplate?.spec?.runtimeClassName || '-'}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Resource limits</DescriptionListTerm>
          <DescriptionListDescription>
            {limits ? `CPU: ${limits.cpu || '-'}, Memory: ${limits.memory || '-'}` : '-'}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Service FQDN</DescriptionListTerm>
          <DescriptionListDescription>
            {sandbox.status?.serviceFQDN || '-'}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Pod IPs</DescriptionListTerm>
          <DescriptionListDescription>
            {sandbox.status?.podIPs?.join(', ') || '-'}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Node</DescriptionListTerm>
          <DescriptionListDescription>{sandbox.status?.nodeName || '-'}</DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    );
  }

  private renderConditions(sandbox: api.ISandbox): React.ReactElement {
    const conditions = sandbox.status?.conditions || [];

    if (conditions.length === 0) {
      return (
        <Content component="p" data-testid="sandbox-no-conditions">
          The controller has not reported any condition yet.
        </Content>
      );
    }

    return (
      <Table aria-label="Sandbox conditions" variant="compact" data-testid="sandbox-conditions">
        <Thead>
          <Tr>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th>Reason</Th>
            <Th>Message</Th>
            <Th>Last transition</Th>
          </Tr>
        </Thead>
        <Tbody>
          {conditions.map(condition => (
            <Tr key={condition.type}>
              <Td dataLabel="Type">{condition.type}</Td>
              <Td dataLabel="Status">{condition.status}</Td>
              <Td dataLabel="Reason">{condition.reason || '-'}</Td>
              <Td dataLabel="Message">{condition.message || '-'}</Td>
              <Td dataLabel="Last transition">
                {condition.lastTransitionTime
                  ? getFormattedDate(new Date(condition.lastTransitionTime))
                  : '-'}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
  }

  private renderEvents(): React.ReactElement {
    const { events } = this.props;

    if (events.length === 0) {
      return (
        <Content component="p" data-testid="sandbox-no-events">
          No events have been recorded for this sandbox.
        </Content>
      );
    }

    return (
      <Table aria-label="Sandbox events" variant="compact" data-testid="sandbox-events">
        <Thead>
          <Tr>
            <Th>Type</Th>
            <Th>Reason</Th>
            <Th>Message</Th>
            <Th>Count</Th>
            <Th>Last seen</Th>
          </Tr>
        </Thead>
        <Tbody>
          {events.map(event => (
            <Tr key={event.metadata.uid || event.metadata.name}>
              <Td dataLabel="Type">{event.type || '-'}</Td>
              <Td dataLabel="Reason">{event.reason || '-'}</Td>
              <Td dataLabel="Message">{event.message || '-'}</Td>
              <Td dataLabel="Count">{event.count ?? 1}</Td>
              <Td dataLabel="Last seen">
                {event.lastTimestamp ? getFormattedDate(new Date(event.lastTimestamp)) : '-'}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
  }

  private renderBody(): React.ReactElement {
    const { error, isLoading, sandbox, sandboxName } = this.props;

    if (sandbox === undefined) {
      if (isLoading) {
        return (
          <PageSection
            variant={PageSectionVariants.default}
            isFilled={true}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <Spinner size="xl" data-testid="sandbox-loading-spinner" aria-label="Loading sandbox" />
          </PageSection>
        );
      }

      return (
        <PageSection variant={PageSectionVariants.default}>
          <EmptyState
            variant={EmptyStateVariant.sm}
            icon={SearchIcon}
            titleText="Sandbox not found"
            data-testid="sandbox-not-found"
          >
            <EmptyStateBody>
              {error !== undefined
                ? error
                : `The sandbox "${sandboxName}" does not exist, or it has been deleted.`}
            </EmptyStateBody>
          </EmptyState>
        </PageSection>
      );
    }

    const errorMessage = getSandboxErrorMessage(sandbox);

    return (
      <React.Fragment>
        <PageSection variant={PageSectionVariants.default}>
          <Flex
            justifyContent={{ default: 'justifyContentSpaceBetween' }}
            alignItems={{ default: 'alignItemsCenter' }}
          >
            <FlexItem>
              <Flex alignItems={{ default: 'alignItemsCenter' }}>
                <FlexItem>
                  <Title headingLevel="h1">{sandboxName}</Title>
                </FlexItem>
                <FlexItem>
                  <SandboxStatusLabel sandbox={sandbox} />
                </FlexItem>
              </Flex>
            </FlexItem>
            <FlexItem>{this.renderActions(sandbox)}</FlexItem>
          </Flex>
        </PageSection>
        {errorMessage !== undefined && (
          <PageSection variant={PageSectionVariants.default}>
            <Alert
              variant={AlertVariant.danger}
              isInline
              title="The sandbox is not running"
              data-testid="sandbox-condition-error"
            >
              {errorMessage}
            </Alert>
          </PageSection>
        )}
        <PageSection variant={PageSectionVariants.default}>
          <Content>
            <Content component="h2">Details</Content>
          </Content>
          {this.renderSpec(sandbox)}
        </PageSection>
        <PageSection variant={PageSectionVariants.default}>
          <Content>
            <Content component="h2">Conditions</Content>
          </Content>
          {this.renderConditions(sandbox)}
        </PageSection>
        <PageSection variant={PageSectionVariants.default}>
          <Content>
            <Content component="h2">Events</Content>
          </Content>
          {this.renderEvents()}
        </PageSection>
      </React.Fragment>
    );
  }

  public render(): React.ReactElement {
    const { error, onBack, sandbox, sandboxName } = this.props;
    const { isDeleteModalOpen } = this.state;

    return (
      <React.Fragment>
        <Head pageName={`Sandbox ${sandboxName}`} />
        <PageSection variant={PageSectionVariants.default}>
          <Breadcrumb>
            <BreadcrumbItem
              to="#"
              onClick={event => {
                event.preventDefault();
                onBack();
              }}
              data-testid="agent-space-breadcrumb"
            >
              Agent Space
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{sandboxName}</BreadcrumbItem>
          </Breadcrumb>
        </PageSection>
        <Divider component="div" />
        {error !== undefined && sandbox !== undefined && (
          <PageSection variant={PageSectionVariants.default}>
            <Alert
              variant={AlertVariant.danger}
              isInline
              title="The last operation has failed"
              data-testid="sandbox-details-error"
            >
              {error}
            </Alert>
          </PageSection>
        )}
        {this.renderBody()}
        <SandboxDeleteModal
          isOpen={isDeleteModalOpen}
          sandboxName={sandboxName}
          onConfirm={() => this.props.onDelete(sandboxName)}
          onClose={() => this.setState({ isDeleteModalOpen: false })}
        />
      </React.Fragment>
    );
  }
}

export default AgentSpaceDetails;
