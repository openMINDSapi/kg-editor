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
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ClientPreviewModal from "./ClientPreviewModal";
import ReleaseStats from "./ReleaseStats";
import releaseStore from "../../../Stores/ReleaseStore";
import ReleaseMessages from "./ReleaseMessages";

const styles = {
  container: {
    display: "grid",
    gridTemplateRows: "auto auto 1fr auto",
    gridTemplateColumns: "1fr",
    gridRowGap: "15px",
    width: "100%",
    height: "100%"
  },
  releasePnl: {
    textAlign: "center"
  },
  releaseButton: {
    fontSize: "1.5em",
    outline: "none",
    "&:focus, &:active, &:focus:active, &:hover, &[disabled], &[disabled]:focus, &[disabled]:active, &[disabled]:focus:active, &[disabled]:hover": {
      outline: "none"
    },
    "&[disabled]:focus, &[disabled]:active, &[disabled]:focus:active, &[disabled]:hover": {
      cursor: "default"
    },
    "& div": {
      display: "inline",
      marginLeft: "6px"
    },
    "@media screen and (min-height:1024px)": {
      fontWeight: "bold",
      fontSize: "2em",
      borderRadius: "50%",
      width: "200px",
      height: "200px",
      "& div": {
        display: "block",
        marginLeft: 0
      }
    },
  },
  preview: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    border: "1px solid var(--border-color-ui-contrast1)",
    padding: "0 10px",
    fontSize: "large",
    background: "var(--bg-color-ui-contrast3)"
  },
  section: {
    paddingBottom: "10px",
    "& h5": {
      fontSize: "0.8em",
      fontWeight: "bold"
    },
    "& .content": {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      "&.previewContent": {
        gridTemplateColumns: "2fr 1fr",
        "& .previewIcon": {
          fontSize: "1em",
          fontWeight: "bold",
          textAlign: "right",
          paddingRight: "4px",
          cursor: "pointer",
          "& :hover": {
            color: "lightgrey"
          }
        }
      },
      "& .type": {
        fontSize: "0.8em",
        paddingLeft: "4px",
        lineHeight: "16px"
      }
    }
  }
};

@injectStyles(styles)
@observer
export default class ReleaseAction extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
  }

  handleProceed = () => {
    if (!releaseStore.isSaving) {
      releaseStore.commitStatusChanges();
    }
  };

  handleOpenModal = () => {
    this.setState({ showModal: true });
  };

  handleCloseModal = () => {
    this.setState({ showModal: false });
  };


  render() {
    const { classes } = this.props;

    if (!releaseStore.treeStats) {
      return null;
    }

    return (
      <div className={classes.container}>
        <ReleaseStats />
        <div className={classes.preview}>
          <div className={classes.section}>
            <h5>Preview:</h5>
            <div className={"content previewContent"}>
              <div className={"type"}>Search</div>
              <div
                onClick={this.handleOpenModal}
                className={"previewIcon"}
                title="Preview in KG Search"
              >
                <FontAwesomeIcon style={{ verticalAlign: "top" }} icon="eye" />
              </div>
            </div>
          </div>
        </div>
        <ReleaseMessages />
        <div className={classes.releasePnl} >
          <Button
            onClick={this.handleProceed}
            disabled={
              releaseStore.isSaving ||
              (releaseStore.treeStats.proceed_release === 0 &&
                releaseStore.treeStats.proceed_unrelease === 0)
            }
            bsClass={`${classes.releaseButton} btn btn-primary`}
            bsStyle={"primary"}
            title={
              releaseStore.isSaving
                ? "Saving..."
                : releaseStore.treeStats.proceed_release === 0 &&
                  releaseStore.treeStats.proceed_unrelease === 0
                  ? "No pending changes to release"
                  : "Proceed"
            }
          >
            <FontAwesomeIcon
              icon={releaseStore.isSaving ? "circle-notch" : "cloud-upload-alt"}
              spin={releaseStore.isSaving}
            />
            <div>{releaseStore.isSaving ? "Saving..." : "Proceed"}</div>
          </Button>
        </div>
        <ClientPreviewModal
          store={releaseStore}
          show={this.state.showModal}
          handleClose={this.handleCloseModal}
        />
      </div>
    );
  }
}