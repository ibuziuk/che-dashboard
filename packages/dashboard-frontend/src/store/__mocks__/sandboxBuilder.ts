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

export type SandboxBuilderOptions = {
  conditions?: api.ISandboxCondition[];
  creationTimestamp?: string;
  deletionTimestamp?: string;
  image?: string;
  name?: string;
  namespace?: string;
  nodeName?: string;
  operatingMode?: api.SandboxOperatingMode;
  podIPs?: string[];
  runtimeClassName?: string;
  serviceFQDN?: string;
};

/** Builds a Sandbox custom resource for tests. */
export function buildSandbox(options: SandboxBuilderOptions = {}): api.ISandbox {
  const sandbox: api.ISandbox = {
    apiVersion: 'agents.x-k8s.io/v1beta1',
    kind: 'Sandbox',
    metadata: {
      name: options.name || 'my-sandbox',
      namespace: options.namespace || 'user-che',
      creationTimestamp: options.creationTimestamp
        ? new Date(options.creationTimestamp)
        : undefined,
      deletionTimestamp: options.deletionTimestamp
        ? new Date(options.deletionTimestamp)
        : undefined,
    },
    spec: {
      podTemplate: {
        spec: {
          containers: [
            {
              name: 'main',
              image: options.image || 'quay.io/sandbox/hello-world:latest',
              resources: {
                limits: {
                  cpu: '500m',
                  memory: '512Mi',
                },
              },
            },
          ],
          runtimeClassName: options.runtimeClassName,
        },
      },
      operatingMode: options.operatingMode,
    },
    status: {
      conditions: options.conditions,
      nodeName: options.nodeName,
      podIPs: options.podIPs,
      serviceFQDN: options.serviceFQDN,
    },
  };

  return sandbox;
}

/** Builds a `Ready` condition with the given status and reason. */
export function buildCondition(
  type: string,
  status: 'True' | 'False' | 'Unknown',
  reason?: string,
  message?: string,
): api.ISandboxCondition {
  return {
    type,
    status,
    reason,
    message,
    lastTransitionTime: '2025-09-24T10:00:00Z',
  };
}
