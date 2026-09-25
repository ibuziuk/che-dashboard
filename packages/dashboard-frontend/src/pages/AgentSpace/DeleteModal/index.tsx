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
  Checkbox,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import React from 'react';

export type Props = {
  isOpen: boolean;
  sandboxName: string;
  onConfirm: () => void;
  onClose: () => void;
};

export type State = {
  isConfirmed: boolean;
};

export class SandboxDeleteModal extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isConfirmed: false,
    };
  }

  private handleConfirmationChange(isConfirmed: boolean): void {
    this.setState({ isConfirmed });
  }

  private handleConfirm(): void {
    this.handleConfirmationChange(false);
    this.props.onConfirm();
    this.props.onClose();
  }

  private handleClose(): void {
    this.handleConfirmationChange(false);
    this.props.onClose();
  }

  public render(): React.ReactElement {
    const { isOpen, sandboxName } = this.props;
    const { isConfirmed } = this.state;

    return (
      <Modal
        aria-label="Delete sandbox confirmation window"
        isOpen={isOpen}
        variant={ModalVariant.small}
        onClose={() => this.handleClose()}
        elementToFocus="[data-pf-initial-focus]"
      >
        <ModalHeader title="Delete Sandbox" titleIconVariant="warning" />
        <ModalBody>
          <Content data-pf-initial-focus tabIndex={-1} style={{ outline: 'none' }}>
            <Content component="p">
              Would you like to delete sandbox &quot;{sandboxName}&quot;?
            </Content>
            <Checkbox
              style={{ margin: '0 0 0 0.4rem' }}
              data-testid="confirmation-checkbox"
              isChecked={isConfirmed}
              onChange={(_event, checked) => this.handleConfirmationChange(checked)}
              id="sandbox-delete-confirmation-checkbox"
              label="I understand, this operation cannot be reverted."
            />
          </Content>
        </ModalBody>
        <ModalFooter>
          <Button
            variant={ButtonVariant.danger}
            isDisabled={isConfirmed === false}
            data-testid="delete-sandbox-button"
            onClick={() => this.handleConfirm()}
          >
            Delete
          </Button>
          <Button
            variant={ButtonVariant.link}
            data-testid="close-button"
            onClick={() => this.handleClose()}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}
