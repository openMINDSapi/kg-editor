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
import {observer} from "mobx-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "react-bootstrap";

import queryBuilderStore from "../../Stores/QueryBuilderStore";
import PopOverButton from "../../Components/PopOverButton";
import User from "../User";

let styles = {
  container:{
    position:"relative",
    cursor:"pointer",
    margin:"1px",
    padding:"10px",
    background:"var(--bg-color-ui-contrast1)",
    color:"var(--ft-color-normal)",
    "&:hover": {
      background:"var(--bg-color-ui-contrast4)",
      "& $deleteButton": {
        color: "var(--ft-color-normal)",
        "&:hover, &:active, &:focus": {
          color: "var(--ft-color-louder)"
        }
      }
    },
    "&.is-deleting": {
      cursor: "default"
    }
  },
  name: {
    position: "relative",
    width: "100%",
    display: "inline-block",
    color:"var(--ft-color-louder)",
    textTransform: "capitalize",
    "& small":{
      color:"var(--ft-color-quiet)",
      fontStyle:"italic",
      textTransform: "none"
    },
    "& .author": {
      position: "absolute",
      right: 0,
      color: "var(--ft-color-normal)",
      textTransform: "none",
      "&.extra-padding":{
        right: "20px"
      }
    }
  },
  deleteButton: {
    position: "absolute",
    top: "50%",
    right: "-5px",
    transform: "translateY(-50%)",
    color: "transparent",
    margin: 0,
    border: 0,
    background: "none",
    "&:hover, &:active, &:focus": {
      color: "var(--ft-color-louder)"
    }
  },
  deleteDialog: {
    position: "absolute",
    top: "-5px",
    right: "-200px",
    transition: "right .2s ease",
    "&.show": {
      right: "-5px"
    }
  },
  deleting:{
    position:" absolute",
    top: "-5px",
    right: "-10px",
    height: "100%",
    padding: "5px 10px",
    display: "block",
    color: "var(--ft-color-normal)",
  },
  error: {
    position:"absolute",
    top:"-5px",
    right:"-5px",
  },
  errorButton: {
    color: "var(--ft-color-error)"
  },
  textError: {
    margin: 0,
    wordBreak: "keep-all"
  },
  description: {
    overflow:"hidden",
    marginTop:"5px",
    whiteSpace:"nowrap",
    textOverflow:"ellipsis",
    fontSize:"0.9em",
  }
};

@injectStyles(styles)
@observer
export default class SavedQuery extends React.Component{
  constructor(props){
    super(props);
    this.editBookmarkNameRef = React.createRef();
    this.state = {showDeleteDialog: false};
  }

  handleSelect(event) {
    const { query } = this.props;
    event && event.stopPropagation();
    if (!query.deleteError && !query.isDeleting) {
      queryBuilderStore.selectQuery(query);
    }
  }

  handleConfirmDelete(event) {
    event && event.stopPropagation();
    this.setState({ showDeleteDialog: true });
  }

  handleDelete(event) {
    const { query } = this.props;
    event && event.stopPropagation();
    this.setState({ showDeleteDialog: false });
    queryBuilderStore.deleteQuery(query);
  }

  handleCloseDeleteDialog(event) {
    event && event.stopPropagation();
    this.setState({ showDeleteDialog: false });
  }

  handleCancelDelete(event) {
    const { query } = this.props;
    event && event.stopPropagation();
    queryBuilderStore.cancelDeleteQuery(query);
  }

  render(){
    const {classes, query, showUser, enableDelete } = this.props;

    return (
      <div className={`${classes.container} ${query.isDeleting?"is-deleting":""}`} key={query.id} onClick={this.handleSelect.bind(this)} onMouseLeave={this.handleCloseDeleteDialog.bind(this)} ref={ref=>this.wrapperRef = ref} >
        <div className={classes.name}>
          <span>{query.label?query.label:query.id} - <small title="queryId">{query.id}</small></span>
          {showUser && query.user && query.org && (
            <span className={`author ${enableDelete?"extra-padding":""}`}>by user<User org={query.org} userId={query.user} /></span>
          )}
          {enableDelete && !query.deleteError && !query.isDeleting && !this.state.showDeleteDialog && (
            <button className={classes.deleteButton} title="delete" onClick={this.handleConfirmDelete.bind(this)}><FontAwesomeIcon icon="times"/></button>
          )}
          {enableDelete && !query.deleteError && !query.isDeleting && (
            <div className={`${classes.deleteDialog} ${this.state.showDeleteDialog?"show":""}`}>
              <Button bsStyle="danger" bsSize="small" onClick={this.handleDelete.bind(this)}><FontAwesomeIcon icon="trash-alt"/>&nbsp;Delete</Button>
            </div>
          )}
          {enableDelete && !query.deleteError && query.isDeleting && (
            <div className={classes.deleting} title={`deleting query ${query.id}...`}>
              <FontAwesomeIcon icon={"circle-notch"} spin/>
            </div>
          )}
          {enableDelete && query.deleteError && (
            <PopOverButton
              className={classes.error}
              buttonClassName={classes.errorButton}
              buttonTitle={query.deleteError}
              iconComponent={FontAwesomeIcon}
              iconProps={{icon: "exclamation-triangle"}}
              okComponent={() => (
                <React.Fragment>
                  <FontAwesomeIcon icon="redo-alt"/>&nbsp;Retry
                </React.Fragment>
              )}
              onOk={this.handleDelete.bind(this)}
              cancelComponent={() => (
                <React.Fragment>
                  <FontAwesomeIcon icon="undo-alt"/>&nbsp;Cancel
                </React.Fragment>
              )}
              onCancel={this.handleCancelDelete.bind(this)}
            >
              <h5 className={classes.textError}>{query.deleteError}</h5>
            </PopOverButton>
          )}
        </div>
        {query.description && (
          <div className={classes.description} title={query.description}>{query.description}</div>
        )}
      </div>
    );
  }
}