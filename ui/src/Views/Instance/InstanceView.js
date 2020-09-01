/*
*   Copyright (c) 2020, EPFL/Human Brain Project PCO
*
*   Licensed under the Apache License, Version 2.0 (the "License");
*   you may not use this file except in compliance with the License.
*   You may obtain a copy of the License at
*
*       http://www.apache.org/licenses/LICENSE-2.0
*
*   Unless required by applicable law or agreed to in writing, software
*   distributed under the License is distributed on an "AS IS" BASIS,
*   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*   See the License for the specific language governing permissions and
*   limitations under the License.
*/

import React from "react";
import {observer} from "mobx-react";

import InstanceForm from "./InstanceForm";
import Pane from "./Pane";
import Links from "./Links";
import PaneContainer from "./PaneContainer";

@observer
class InstanceView extends React.Component {

  render() {
    const { instance, paneStore } = this.props;
    const { id:instanceId } = instance;

    return (

      <PaneContainer key={instanceId} paneStore={paneStore}>
        <React.Fragment>
          <Pane paneId={instanceId} key={instance.id}>
            <InstanceForm level={0} id={instanceId} mainInstanceId={instanceId} />
          </Pane>
          {!instance.hasFetchError?
            <Links level={1} id={instanceId} mainInstanceId={instanceId} />
            :null}
        </React.Fragment>
      </PaneContainer>
    );
  }
}

export default InstanceView;