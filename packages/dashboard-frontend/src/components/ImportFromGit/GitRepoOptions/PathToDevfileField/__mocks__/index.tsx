/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
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

import { Props } from '@/components/ImportFromGit/GitRepoOptions/PathToDevfileField';

export class PathToDevfileField extends React.PureComponent<Props> {
  public render() {
    const { devfilePath, onChange } = this.props;

    return (
      <div>
        <div>Devfile Path</div>
        <div data-testid="devfile-path">{devfilePath}</div>
        <button onClick={() => onChange('new-devfile-path')}>Devfile Path Change</button>
      </div>
    );
  }
}
