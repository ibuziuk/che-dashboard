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

/**
 * Starter Agent Space samples.
 *
 * Adapted from the examples published by the upstream kubernetes-sigs/agent-sandbox
 * project (Apache License 2.0), which is compatible with EPL-2.0:
 * https://github.com/kubernetes-sigs/agent-sandbox/tree/main/examples
 *
 * Upstream manifests that build their image locally use an `${IMAGE}` placeholder.
 * Those samples are reproduced here with a publicly pullable image so they can be
 * started from the dashboard without any extra setup.
 */

export interface ISandboxSample {
  /** Stable identifier, also used as the default Sandbox name. */
  id: string;
  displayName: string;
  description: string;
  /** Link to the upstream example this sample is based on. */
  sourceUrl: string;
  tags: string[];
  spec: api.ISandboxSpec;
}

const UPSTREAM_EXAMPLES_URL = 'https://github.com/kubernetes-sigs/agent-sandbox/tree/main/examples';

export const SANDBOX_SAMPLES: ISandboxSample[] = [
  {
    id: 'hello-world',
    displayName: 'Hello World',
    description:
      'A minimal single-container sandbox. Use it to check that the Agent Space is wired up correctly.',
    sourceUrl: `${UPSTREAM_EXAMPLES_URL}/hello-world-sandbox`,
    tags: ['Minimal'],
    spec: {
      podTemplate: {
        spec: {
          containers: [
            {
              name: 'main',
              image: 'registry.access.redhat.com/ubi9/ubi-minimal:latest',
              command: ['/bin/sh', '-c', 'sleep infinity'],
              resources: {
                requests: { cpu: '100m', memory: '128Mi' },
                limits: { cpu: '500m', memory: '512Mi' },
              },
            },
          ],
        },
      },
    },
  },
  {
    id: 'python-runtime',
    displayName: 'Python Runtime',
    description: 'A Python 3.12 sandbox that an agent can use to execute code. Exposes port 8888.',
    sourceUrl: `${UPSTREAM_EXAMPLES_URL}/python-runtime-sandbox`,
    tags: ['Python', 'Code execution'],
    spec: {
      podTemplate: {
        spec: {
          containers: [
            {
              name: 'python-sandbox',
              image: 'docker.io/library/python:3.12-slim',
              command: ['/bin/sh', '-c', 'sleep infinity'],
              ports: [{ containerPort: 8888 }],
              resources: {
                requests: { cpu: '250m', memory: '512Mi' },
                limits: { cpu: '1', memory: '2Gi' },
              },
            },
          ],
        },
      },
      service: true,
    },
  },
  {
    id: 'jupyterlab',
    displayName: 'JupyterLab',
    description:
      'A JupyterLab notebook server with a persistent workspace volume. Exposes port 8888.',
    sourceUrl: `${UPSTREAM_EXAMPLES_URL}/jupyterlab`,
    tags: ['Notebook', 'Persistent storage'],
    spec: {
      podTemplate: {
        metadata: {
          labels: {
            app: 'jupyterlab',
          },
        },
        spec: {
          securityContext: {
            fsGroup: 100,
          },
          containers: [
            {
              name: 'jupyterlab',
              image: 'jupyterhub/k8s-singleuser-sample:4.2.0',
              ports: [{ containerPort: 8888, name: 'notebook', protocol: 'TCP' }],
              volumeMounts: [{ name: 'workspace', mountPath: '/home/jovyan' }],
              resources: {
                requests: { cpu: '500m', memory: '1Gi' },
                limits: { cpu: '2', memory: '4Gi' },
              },
              securityContext: {
                runAsUser: 1000,
                runAsGroup: 100,
                allowPrivilegeEscalation: false,
              },
            },
          ],
        },
      },
      volumeClaimTemplates: [
        {
          metadata: { name: 'workspace' },
          spec: {
            accessModes: ['ReadWriteOnce'],
            resources: {
              requests: { storage: '10Gi' },
            },
          },
        },
      ],
      service: true,
    },
  },
  {
    id: 'aio-sandbox',
    displayName: 'All-in-One Agent Sandbox',
    description:
      'The agent-infra all-in-one sandbox, bundling a browser, a shell and a file service. Exposes port 8080.',
    sourceUrl: `${UPSTREAM_EXAMPLES_URL}/aio-sandbox`,
    tags: ['Browser', 'Shell'],
    spec: {
      podTemplate: {
        metadata: {
          labels: {
            sandbox: 'aio-sandbox',
          },
        },
        spec: {
          containers: [
            {
              name: 'aio-sandbox',
              image: 'ghcr.io/agent-infra/sandbox:1.0.0.152',
              ports: [{ containerPort: 8080 }],
              securityContext: {
                allowPrivilegeEscalation: false,
              },
              resources: {
                requests: { cpu: '500m', memory: '1Gi' },
                limits: { cpu: '2', memory: '4Gi' },
              },
            },
          ],
        },
      },
      service: true,
    },
  },
];

export function getSandboxSampleById(id: string): ISandboxSample | undefined {
  return SANDBOX_SAMPLES.find(sample => sample.id === id);
}
