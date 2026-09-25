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

import { Badge, Card, CardBody, CardHeader, CardTitle, Gallery } from '@patternfly/react-core';
import { RobotIcon } from '@patternfly/react-icons';
import React from 'react';

import styles from '@/pages/AgentSpace/SamplesGallery/index.module.css';
import { ISandboxSample, SANDBOX_SAMPLES } from '@/services/sandbox/samples';

export type Props = {
  onSampleClick: (sample: ISandboxSample) => void;
  selectedSampleId?: string;
};

export class SandboxSamplesGallery extends React.PureComponent<Props> {
  private handleKeyDown(event: React.KeyboardEvent, sample: ISandboxSample): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.props.onSampleClick(sample);
    }
  }

  private buildCard(sample: ISandboxSample): React.ReactElement {
    const { selectedSampleId } = this.props;
    const cardId = `sandbox-sample-card-${sample.id}`;

    return (
      <Card
        key={sample.id}
        id={cardId}
        isCompact
        isClickable
        // PF v6 highlights a clickable-only card through `isClicked`; `isSelected`
        // is only honoured on a selectable card.
        isClicked={selectedSampleId === sample.id}
        onClick={() => this.props.onSampleClick(sample)}
        onKeyDown={(event: React.KeyboardEvent) => this.handleKeyDown(event, sample)}
        tabIndex={0}
        aria-label={`Create sandbox from sample ${sample.displayName}`}
        className={styles.sampleCard}
        data-testid="sandbox-sample-card"
      >
        {/* PF v6: clickable-only cards require selectableActions with an aria label
            and must not use CardHeader.actions (use CardTitle for badges instead). */}
        <CardHeader
          selectableActions={{
            selectableActionAriaLabelledby: cardId,
            name: 'sandbox-sample-cards',
            isHidden: true,
          }}
        >
          <RobotIcon className={styles.sampleCardIcon} aria-label={sample.displayName} />
          <CardTitle>
            {sample.displayName}
            {sample.tags.length > 0 && (
              <span className={styles.tagGroup}>
                {sample.tags.map(tag => (
                  <Badge isRead key={tag} data-testid="sandbox-sample-badge">
                    {tag}
                  </Badge>
                ))}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardBody>{sample.description}</CardBody>
      </Card>
    );
  }

  public render(): React.ReactElement {
    return (
      <Gallery hasGutter data-testid="sandbox-samples-gallery">
        {SANDBOX_SAMPLES.map(sample => this.buildCard(sample))}
      </Gallery>
    );
  }
}
