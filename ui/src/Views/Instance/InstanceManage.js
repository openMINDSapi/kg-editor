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
import { observer } from "mobx-react";
import injectStyles from "react-jss";
import { Scrollbars } from "react-custom-scrollbars";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "react-bootstrap";
import { Form, Field } from "hbp-quickfire";

import instanceStore from "../../Stores/InstanceStore";
import routerStore from "../../Stores/RouterStore";
import statusStore from "../../Stores/StatusStore";

import FetchingLoader from "../../Components/FetchingLoader";
import BGMessage from "../../Components/BGMessage";
import GlobalFieldErrors from "../../Components/GlobalFieldErrors";

const rootPath = window.rootPath || "";

const styles = {
  container: {
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundImage: `url('${window.location.protocol}//${window.location.host}${rootPath}/assets/graph.png')`,
    backgroundPosition: "50% 50%",
    color: "var(--ft-color-loud)"
  },
  panel: {
    position: "relative",
    width: "60%",
    height: "calc(100% - 40px)",
    margin:"20px 20%"
  },
  content: {
    backgroundColor: "var(--bg-color-ui-contrast2)",
    color: "var(--ft-color-normal)",
    border: "1px solid var(--bg-color-blend-contrast1)",
    marginBottom: "15px",
    padding: "15px",
    "& h4": {
      marginBottom: "15px"
    },
    "& p": {
      marginBottom: "15px"
    },
    "& ul": {
      marginBottom: "15px"
    },
    "& strong": {
      color: "var(--ft-color-louder)"
    }
  },
  id:{
    fontSize:"0.75em",
    color:"var(--ft-color-normal)",
    marginTop:"20px",
    marginBottom:"20px"
  },
  field:{
    marginBottom:"10px",
    wordBreak:"break-word"
  },
  error: {
    color: "var(--ft-color-error)"
  }
};

@injectStyles(styles)
@observer
export default class InstanceManage extends React.Component{
  componentDidMount() {
    if (this.props.id) {
      this.fetchInstance();
      this.fetchStatus();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.id && this.props.id !== prevProps.id) {
      this.fetchInstance();
      this.fetchStatus();
    }
  }

  fetchInstance = (forceFetch = false) => {
    const instance = instanceStore.createInstanceOrGet(this.props.id);
    instance.fetch(forceFetch);
  }

  fetchStatus = () => {
    statusStore.fetchStatus(this.props.id);
  }

  handleDuplicateInstance = async () => {
    let newInstanceId = await instanceStore.duplicateInstance(this.props.id);
    routerStore.history.push("/instance/edit/"+newInstanceId);
  }

  handleDeleteInstance = async () => {
    instanceStore.deleteInstance(this.props.id);
  }

  render(){
    const { classes } = this.props;

    const instance = instanceStore.instances.get(this.props.id);
    const promotedFields = instance && instance.promotedFields;
    const status = instance &&  statusStore.getInstance(this.props.id);
    return (
      instance && instance.data ?
        <div className={classes.container}>
          <Scrollbars autoHide>
            <div className={classes.panel}>
              {instance.isFetching?
                <FetchingLoader>
                  <span>Fetching instance information...</span>
                </FetchingLoader>
                :!instance.hasFetchError?
                  <React.Fragment>
                    <div className={classes.content}>
                      <h4>{instance.data.label}</h4>
                      <div className={classes.id}>
                        Nexus ID: {this.props.id}
                      </div>
                      {instance.hasFieldErrors ? <GlobalFieldErrors instance={instance} />:
                        <Form store={instance.readModeFormStore} key={this.props.id}>
                          {promotedFields.map(fieldKey => {
                            return(
                              <div key={this.props.id+fieldKey} className={classes.field}>
                                <Field name={fieldKey}/>
                              </div>
                            );
                          })}
                        </Form>}
                    </div>
                    <div className={classes.content}>
                      <h4>Duplicate this instance</h4>
                      <ul>
                        <li>Be careful. After duplication both instances will look the same.</li>
                        <li>After dupplication you should update the name &amp; description fields.</li>
                      </ul>
                      <Button bsStyle={"warning"} onClick={this.handleDuplicateInstance}>
                        <FontAwesomeIcon icon={"copy"}/> &nbsp; Duplicate this instance
                      </Button>
                    </div>
                    <div className={classes.content}>
                      <h4>Delete this instance</h4>
                      {status && status.hasFetchError?
                        <div className={classes.error}>
                          <FontAwesomeIcon icon={"exclamation-triangle"}/>&nbsp;&nbsp;{status.fetchError}&nbsp;&nbsp;
                          <Button bsStyle="primary" onClick={this.fetchStatus}><FontAwesomeIcon icon="redo-alt"/>&nbsp;Retry</Button>
                        </div>
                        :!status || !status.isFetched?
                          <React.Fragment>
                            <FontAwesomeIcon icon={"circle-notch"} spin/>&nbsp;&nbsp;Fetching instance release status
                          </React.Fragment>
                          :
                          <React.Fragment>
                            {status.data.status !== "NOT_RELEASED"?
                              <ul>
                                <li>This instance has been released and therefore cannot be deleted.</li>
                                <li>If you still want to delete it you first have to unrelease it.</li>
                              </ul>
                              :
                              <p>
                                <strong>Be careful. Removed instances cannot be restored!</strong>
                              </p>
                            }
                            <Button bsStyle={"danger"} onClick={this.handleDeleteInstance} disabled={status.data.status !== "NOT_RELEASED"} >
                              <FontAwesomeIcon icon={"trash-alt"}/>&nbsp;&nbsp; Delete this instance
                            </Button>
                          </React.Fragment>
                      }
                    </div>
                  </React.Fragment>
                  :
                  <BGMessage icon={"ban"}>
                    There was a network problem fetching the instance.<br/>
                    If the problem persists, please contact the support.<br/>
                    <small>{instance.fetchError}</small><br/><br/>
                    <Button bsStyle={"primary"} onClick={this.fetchInstance.bind(this, true)}>
                      <FontAwesomeIcon icon={"redo-alt"}/>&nbsp;&nbsp; Retry
                    </Button>
                  </BGMessage>
              }
            </div>
          </Scrollbars>
        </div>:null
    );
  }
}