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

import { observer } from "mobx-react";
import InfiniteScroll from "react-infinite-scroller";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "react-bootstrap";
import { Scrollbars } from "react-custom-scrollbars";

import browseStore from "../../Stores/BrowseStore";
import routerStore from "../../Stores/RouterStore";
import FetchingLoader from "../../Components/FetchingLoader";
import instanceStore from "../../Stores/InstanceStore";
import Preview from "../Preview";
import BGMessage from "../../Components/BGMessage";
import InstanceRow from "../Instance/InstanceRow";

const styles = {
  container:{
    color: "var(--ft-color-loud)",
    overflow:"hidden",
    position:"relative",
    display:"grid",
    gridTemplateColumns:"1fr 33%",
    gridTemplateRows:"auto 1fr"
  },
  search:{
    borderRadius: "2px",
    backgroundColor: "var(--bg-color-blend-contrast1)",
    color: "var(--ft-color-loud)",
    width:"100%",
    border:"1px solid transparent",
    paddingLeft:"30px",
    "&:focus":{
      borderColor: "rgba(64, 169, 243, 0.5)"
    },
    "&.disabled,&:disabled":{
      backgroundColor: "var(--bg-color-blend-contrast1)",
    }
  },
  preview:{
    position:"relative",
    gridRow:"1 / span 2",
    gridColumn:"2",
    background:"var(--bg-color-ui-contrast2)",
    borderLeft:"1px solid var(--border-color-ui-contrast1)",
    overflow:"auto",
    color:"var(--ft-color-loud)"
  },
  loader:{
    textAlign:"center",
    margin:"20px 0 30px",
    fontSize:"1.25em",
    fontWeight:"300"
  },
  list:{
    "& ul": {
      listStyleType: "none",
      padding:"1px 11px 1px 11px"
    }
  },
  header:{
    display:"grid",
    gridTemplateColumns:"1fr auto",
    gridGap:"10px",
    padding:"10px",
    position:"relative"
  },
  searchIcon:{
    position:"absolute",
    top:"20px",
    left:"20px",
    color: "var(--ft-color-normal)",
  },
  instanceCount:{
    color: "var(--ft-color-normal)",
    lineHeight:"34px",
    background:"var(--bg-color-ui-contrast2)",
    padding:"0 10px"
  }
};

@injectStyles(styles)
@observer
export default class Instances extends React.Component{
  handleFilterChange = event => {
    browseStore.setInstancesFilter(event.target.value);
  }

  handleInstanceClick(instance){
    browseStore.selectInstance(instance);
  }

  handleInstanceCtrlClick(instance){
    if (instance && instance.id) {
      instanceStore.openInstance(instance.id);
    }
  }

  handleInstanceActionClick(instance, mode){
    if (instance && instance.id) {
      routerStore.history.push(`/instance/${mode}/${instance.id}`);
    }
  }

  handleLoadMore = () => {
    browseStore.fetchInstances(true);
  }

  handleRetry = () => {
    browseStore.fetchInstances();
  }

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.container}>
        <div className={classes.header}>
          {browseStore.selectedList !== null &&
            <input ref={ref => this.inputRef = ref}
              disabled={browseStore.selectedList === null}
              className={`form-control ${classes.search}`}
              placeholder={`Filter instances of ${browseStore.selectedList.name}`}
              type="text"
              value={browseStore.instancesFilter}
              onChange={this.handleFilterChange} />}
          {browseStore.selectedList !== null &&
            <div className={classes.instanceCount}>
              {browseStore.totalInstances} Result{`${browseStore.totalInstances !== 0?"s":""}`}
            </div>}
          {browseStore.selectedList !== null && <FontAwesomeIcon icon="search" className={classes.searchIcon}/>}
        </div>
        <Scrollbars autoHide>
          {browseStore.selectedList ?
            !browseStore.fetchError.instances ?
              !browseStore.isFetching.instances ?
                browseStore.instances.length ?
                  <InfiniteScroll
                    threshold={400}
                    pageStart={0}
                    loadMore={this.handleLoadMore}
                    hasMore={browseStore.canLoadMoreInstances}
                    loader={<div className={classes.loader} key={0}><FontAwesomeIcon icon={"circle-notch"} spin/>&nbsp;&nbsp;<span>Loading more instances...</span></div>}
                    useWindow={false}>
                    <div className={classes.list}>
                      <ul>
                        {browseStore.instances.map(instance => (
                          <li key={instance.id}><InstanceRow instance={instance} selected={instance === browseStore.selectedInstance} onClick={this.handleInstanceClick}  onCtrlClick={this.handleInstanceCtrlClick}  onActionClick={this.handleInstanceActionClick} /></li>
                        ))}
                      </ul>
                    </div>
                  </InfiniteScroll>
                  :
                  <BGMessage icon={"unlink"}>
                    No instances could be found in this list
                    {browseStore.instancesFilter && <div>with the search term {`"${browseStore.instancesFilter}"`}</div>}
                  </BGMessage>
                :
                <FetchingLoader>
                  <span>Fetching instances...</span>
                </FetchingLoader>
              :
              <BGMessage icon={"ban"}>
                There was a network problem retrieving the list of instances.<br/>
                If the problem persists, please contact the support.<br/><br/>
                <Button bsStyle={"primary"} onClick={this.handleRetry}>
                  <FontAwesomeIcon icon={"redo-alt"}/> &nbsp; Retry
                </Button>
              </BGMessage>
            :
            <BGMessage icon={"code-branch"} transform={"flip-h rotate--90"}>
              Select a list of instances in the left panel
            </BGMessage>
          }
        </Scrollbars>
        <div className={classes.preview}>
          {browseStore.selectedInstance?
            <Preview instanceId={browseStore.selectedInstance.id} instanceName={browseStore.selectedInstance.name}/>
            :
            <BGMessage icon={"money-check"}>
              Select an instance to display its preview here.
            </BGMessage>
          }
        </div>
      </div>
    );
  }
}
