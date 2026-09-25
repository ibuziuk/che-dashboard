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
import { Button, ButtonVariant } from '@patternfly/react-core';
import { ActionsColumn, IAction, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import React from 'react';

import { SandboxStatusLabel } from '@/pages/AgentSpace/SandboxStatusLabel';
import { getFormattedDate } from '@/services/helpers/dates';
import { getSandboxLifecycleActions, getSandboxName, SandboxAction } from '@/services/sandbox';

export type Props = {
  sandboxes: api.ISandbox[];
  onAction: (sandbox: api.ISandbox, action: SandboxAction) => void;
  onSandboxClick: (sandbox: api.ISandbox) => void;
};

export class SandboxesTable extends React.PureComponent<Props> {
  private buildActionItems(sandbox: api.ISandbox): IAction[] {
    const lifecycleActions = getSandboxLifecycleActions(sandbox);

    const items: IAction[] = lifecycleActions.map(action => ({
      title: action,
      onClick: () => this.props.onAction(sandbox, action),
    }));

    if (items.length > 0) {
      items.push({ isSeparator: true });
    }

    items.push({
      title: SandboxAction.DELETE,
      onClick: () => this.props.onAction(sandbox, SandboxAction.DELETE),
    });

    return items;
  }

  private buildRow(sandbox: api.ISandbox): React.ReactElement {
    const name = getSandboxName(sandbox);
    const runtimeClassName = sandbox.spec?.podTemplate?.spec?.runtimeClassName;
    const creationTimestamp = sandbox.metadata?.creationTimestamp;

    return (
      <Tr key={name} data-testid={`sandbox-row-${name}`}>
        <Td dataLabel="Name">
          <Button
            variant={ButtonVariant.link}
            isInline
            onClick={() => this.props.onSandboxClick(sandbox)}
            data-testid="sandbox-name-link"
          >
            {name}
          </Button>
        </Td>
        <Td dataLabel="Status">
          <SandboxStatusLabel sandbox={sandbox} />
        </Td>
        <Td dataLabel="Runtime Class">{runtimeClassName || '-'}</Td>
        <Td dataLabel="Created">
          {creationTimestamp ? getFormattedDate(new Date(creationTimestamp)) : '-'}
        </Td>
        <Td dataLabel="Actions" isActionCell>
          <ActionsColumn items={this.buildActionItems(sandbox)} />
        </Td>
      </Tr>
    );
  }

  public render(): React.ReactElement {
    const { sandboxes } = this.props;

    return (
      <Table aria-label="Sandboxes" variant="compact" data-testid="sandboxes-table">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Status</Th>
            <Th>Runtime Class</Th>
            <Th>Created</Th>
            <Th screenReaderText="Actions" />
          </Tr>
        </Thead>
        <Tbody>{sandboxes.map(sandbox => this.buildRow(sandbox))}</Tbody>
      </Table>
    );
  }
}
