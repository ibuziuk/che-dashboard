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
import { FastifyInstance } from 'fastify';

import { baseApiPath } from '@/constants/config';
import { stubSandbox, stubSandboxList } from '@/routes/api/helpers/__mocks__/getDevWorkspaceClient';
import { setup, teardown } from '@/utils/appBuilder';

jest.mock('../helpers/getDevWorkspaceClient.ts');
jest.mock('../helpers/getToken.ts');
jest.mock('../helpers/getServiceAccountToken.ts');

describe('Sandboxes Route', () => {
  let app: FastifyInstance;
  const namespace = 'user-che';
  const sandboxName = 'my-sandbox';

  beforeAll(async () => {
    app = await setup();
  });

  afterAll(() => {
    teardown(app);
  });

  test(`GET ${baseApiPath}/namespace/${namespace}/sandboxes`, async () => {
    const res = await app.inject().get(`${baseApiPath}/namespace/${namespace}/sandboxes`);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubSandboxList);
  });

  test(`GET ${baseApiPath}/namespace/${namespace}/sandboxes/${sandboxName}`, async () => {
    const res = await app
      .inject()
      .get(`${baseApiPath}/namespace/${namespace}/sandboxes/${sandboxName}`);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubSandbox);
  });

  test(`POST ${baseApiPath}/namespace/${namespace}/sandboxes`, async () => {
    const res = await app
      .inject()
      .post(`${baseApiPath}/namespace/${namespace}/sandboxes`)
      .payload(stubSandbox as unknown as Record<string, unknown>);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubSandbox);
  });

  test(`POST ${baseApiPath}/namespace/${namespace}/sandboxes - invalid body`, async () => {
    const res = await app
      .inject()
      .post(`${baseApiPath}/namespace/${namespace}/sandboxes`)
      .payload({ metadata: { name: 'Invalid Name' }, spec: { podTemplate: {} } });

    expect(res.statusCode).toEqual(400);
  });

  test(`PATCH ${baseApiPath}/namespace/${namespace}/sandboxes/${sandboxName}`, async () => {
    const patches: api.IPatch[] = [
      {
        op: 'add',
        path: '/spec/operatingMode',
        value: 'Suspended',
      },
    ];
    const res = await app
      .inject()
      .patch(`${baseApiPath}/namespace/${namespace}/sandboxes/${sandboxName}`)
      .payload(patches);

    expect(res.statusCode).toEqual(200);
    expect(res.json()).toEqual(stubSandbox);
  });

  test(`DELETE ${baseApiPath}/namespace/${namespace}/sandboxes/${sandboxName}`, async () => {
    const res = await app
      .inject()
      .delete(`${baseApiPath}/namespace/${namespace}/sandboxes/${sandboxName}`);

    expect(res.statusCode).toEqual(204);
  });
});
