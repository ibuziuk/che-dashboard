/*
 * Copyright (c) 2018-2023 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { createSelector } from 'reselect';
import { AppState } from '..';
import { State } from './types';

const selectState = (state: AppState) => state.gitConfig;

export const selectGitConfigIsLoading = createSelector(selectState, state => state.isLoading);

export const selectGitConfigUser = createSelector(
  selectState,
  (state: State) => state.config?.gitconfig.user,
);

export const selectGitConfigError = createSelector(selectState, state => state.error);
