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

import { Location } from 'react-router-dom';

import {
  buildAgentSpaceCreateLocation,
  buildAgentSpaceDetailsLocation,
  buildAgentSpaceLocation,
  buildWorkspaceDetailsLocation,
  toHref,
} from '@/services/helpers/location';
import { constructWorkspace } from '@/services/workspace-adapter';
import { DevWorkspaceBuilder } from '@/store/__mocks__/devWorkspaceBuilder';

describe('location', () => {
  test('toHref', () => {
    const location: Location = {
      pathname: '/foo',
      search: '?bar=baz',
      hash: '',
      key: 'key',
      state: {},
    };
    expect(toHref(location)).toEqual(`${window.location.origin}/#/foo?bar=baz`);
  });

  test('buildWorkspaceDetailsLocation', () => {
    const devWorkspaceBuilder = new DevWorkspaceBuilder()
      .withName('wksp')
      .withNamespace('che-user');
    const workspace = constructWorkspace(devWorkspaceBuilder.build());
    expect(buildWorkspaceDetailsLocation(workspace).pathname).toEqual(`/workspace/che-user/wksp`);
  });

  test('buildAgentSpaceLocation', () => {
    expect(buildAgentSpaceLocation().pathname).toEqual('/agent-space');
  });

  test('buildAgentSpaceCreateLocation', () => {
    expect(buildAgentSpaceCreateLocation().pathname).toEqual('/agent-space/create');
    expect(buildAgentSpaceCreateLocation().search).toEqual('');

    const withSample = buildAgentSpaceCreateLocation('hello-world');
    expect(withSample.pathname).toEqual('/agent-space/create');
    expect(withSample.search).toEqual('?sample=hello-world');
  });

  test('buildAgentSpaceDetailsLocation', () => {
    expect(buildAgentSpaceDetailsLocation('my-sandbox').pathname).toEqual(
      '/agent-space/sandbox/my-sandbox',
    );
  });
});
