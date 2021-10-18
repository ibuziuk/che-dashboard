/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { Container } from 'inversify';
import { CheServerDevfileServiceImpl } from '@eclipse-che/theia-remote-impl-che-server/lib/node/che-server-devfile-service-impl';
import { Devfile } from '@eclipse-che/theia-remote-api/lib/common/devfile-service';
import { CheServerWorkspaceServiceImpl } from '@eclipse-che/theia-remote-impl-che-server/lib/node/che-server-workspace-service-impl';
import { WorkspaceService } from '@eclipse-che/theia-remote-api/lib/common/workspace-service';
import { CheServerRemoteApiImpl } from '@eclipse-che/theia-remote-impl-che-server/lib/node/che-server-remote-api-impl';
import devfileApi from '../../services/devfileApi';
import { che as cheApi } from '@eclipse-che/api';

const container = new Container();
container.bind(CheServerDevfileServiceImpl).toSelf().inSingletonScope();
container.bind(WorkspaceService).to(CheServerWorkspaceServiceImpl).inSingletonScope();
container.bind(CheServerRemoteApiImpl).to(CheServerRemoteApiImpl).inSingletonScope();
const devfileService = container.get(CheServerDevfileServiceImpl);

export function devfileV2toDevfileV1(devfile: devfileApi.Devfile): cheApi.workspace.devfile.Devfile {

  // the converter function expects each project entry has `attributes` field
  devfile.projects?.forEach(project => {
    if (project.attributes === undefined) {
      project.attributes = {};
    }
  });

  const convertedDevfile = devfileService.devfileV2toDevfileV1(devfile as unknown as Devfile);

  // get rid of empty component entries
  const nonEmptyComponents = convertedDevfile.components?.filter(component => Object.keys(component).length !== 0);
  convertedDevfile.components = nonEmptyComponents;

  // get rid of attributes that values that are not a string
  if (convertedDevfile.attributes && Object.keys(convertedDevfile.attributes).length !== 0) {
    Object.keys(convertedDevfile.attributes).forEach(attr => {
      if (typeof convertedDevfile.attributes?.[attr] !== 'string') {
        delete devfile.metadata.attributes?.[attr];
      }
    });
  }

  return convertedDevfile;
}
