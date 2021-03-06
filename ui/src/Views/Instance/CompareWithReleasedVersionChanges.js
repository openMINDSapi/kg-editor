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
import injectStyles from "react-jss";
import { toJS } from "mobx";
import { observer } from "mobx-react";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FormStore } from "hbp-quickfire";

import instanceStore, { createInstanceStore } from "../../Stores/InstanceStore";
import FetchingLoader from "../../Components/FetchingLoader";
import BGMessage from "../../Components/BGMessage";
import CompareFieldChanges from "./CompareFieldChanges";

const styles = {
  container: {
    padding: "12px 15px",
    "& button + button": {
      marginLeft: "20px"
    }
  }
};

@injectStyles(styles)
@observer
export default class CompareWithReleasedVersionChanges extends React.Component{
  constructor(props){
    super(props);
    this.releasedInstanceStore = createInstanceStore("RELEASED");
  }

  componentDidMount() {
    if (this.props.instanceId) {
      if (this.props.status !== "NOT_RELEASED") {
        const instance = this.releasedInstanceStore.createInstanceOrGet(this.props.instanceId);
        instance.fetch(true);
      }
      this.fetchInstance();
    }
  }

  componentDidUpdate(prevProps) {
    if(this.props.instanceId && prevProps.instanceId !== this.props.instanceId) {
      if (this.props.status !== "NOT_RELEASED") {
        const instance = this.releasedInstanceStore.createInstanceOrGet(this.props.instanceId);
        instance.fetch(true);
      }
      this.fetchInstance();
    }
  }

  fetchInstance = (forceFetch=false) => {
    const instance = instanceStore.createInstanceOrGet(this.props.instanceId);
    instance.fetch(forceFetch);
  }

  handleCloseComparison = () => {
    instanceStore.setComparedWithReleasedVersionInstance(null);
  }

  handleRetryFetchInstance = () => {
    this.fetchInstance(true);
  }

  handleRetryFetchReleasedInstance = () => {
    if (this.props.status !== "NOT_RELEASED") {
      this.releasedInstanceStore.getInstance(this.props.instanceId, true);
    }
  }

  render(){
    const { classes, instanceId, status } = this.props;

    if (!instanceId) {
      return null;
    }
    const instanceBefore = status !== "NOT_RELEASED"?this.releasedInstanceStore.instances.get(instanceId):null;
    const instanceAfter = instanceStore.instances.get(instanceId);

    if (!instanceAfter) {
      return null;
    }

    let beforeValues = {};
    let afterValues = {};

    let promotedFields = [];
    let nonPromotedFields = [];

    if ((!instanceBefore || (instanceBefore.isFetched && !instanceBefore.fetchError && instanceBefore.form && instanceBefore.form.structure && instanceBefore.form.structure.fields))
      && instanceAfter.isFetched && !instanceAfter.fetchError && instanceAfter.form && instanceAfter.form.structure && instanceAfter.form.structure.fields) {

      if (instanceBefore) {
        const formStoreBefore = new FormStore(toJS(instanceBefore.form.structure));
        formStoreBefore.toggleReadMode(true);
        beforeValues = formStoreBefore.getValues();
      }

      const formStoreAfter = new FormStore(toJS(instanceAfter.form.structure));
      formStoreAfter.toggleReadMode(true);
      afterValues = formStoreAfter.getValues();

      promotedFields = instanceAfter.promotedFields;
      nonPromotedFields = instanceAfter.nonPromotedFields;
    }

    return(
      <div className={classes.container}>
        {(instanceBefore && instanceBefore.isFetching) || instanceAfter.isFetching?
          <FetchingLoader>Fetching instance {instanceId} data...</FetchingLoader>
          :
          instanceBefore && instanceBefore.fetchError?
            <BGMessage icon={"ban"}>
              There was a network problem fetching the released instance {instanceId}.<br/>
              If the problem persists, please contact the support.<br/>
              <small>{instanceBefore.fetchError}</small><br/><br/>
              <div>
                <Button onClick={this.handleCloseComparison}><FontAwesomeIcon icon={"times"}/>&nbsp;&nbsp; Cancel</Button>
                <Button bsStyle={"primary"} onClick={this.handleRetryFetchReleasedInstance}><FontAwesomeIcon icon={"redo-alt"}/>&nbsp;&nbsp; Retry</Button>
              </div>
            </BGMessage>
            :
            instanceAfter.fetchError?
              <BGMessage icon={"ban"}>
                There was a network problem fetching the instance {instanceId}.<br/>
                If the problem persists, please contact the support.<br/>
                <small>{instanceBefore && instanceBefore.fetchError}</small><br/><br/>
                <div>
                  <Button onClick={this.handleCloseComparison}><FontAwesomeIcon icon={"times"}/>&nbsp;&nbsp; Cancel</Button>
                  <Button bsStyle={"primary"} onClick={this.handleRetryFetchInstance}><FontAwesomeIcon icon={"redo-alt"}/>&nbsp;&nbsp; Retry</Button>
                </div>
              </BGMessage>
              :
              <React.Fragment>
                {promotedFields.map(key => (
                  <CompareFieldChanges key={key} field={instanceAfter.form.structure.fields[key]} beforeValue={beforeValues[key]} afterValue={afterValues[key]} />
                ))}
                {nonPromotedFields.map(key => (
                  <CompareFieldChanges key={key} field={instanceAfter.form.structure.fields[key]} beforeValue={beforeValues[key]} afterValue={afterValues[key]} />
                ))}
              </React.Fragment>
        }
      </div>
    );
  }
}