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
import { Modal, Button } from "react-bootstrap";
import { observer } from "mobx-react";
import injectStyles from "react-jss";
import Iframe from "react-iframe";

let styles = {
  frameContainer: {
    height: "100%"
  },
  greatModal: {
    "& .modal-dialog": {
      width: "60%",
      height: "95%",
    },
    "& .modal-content": {
      height: "100%",
      minHeight: "100%",
      backgroundColor: "var(--bg-color-ui-contrast3)"
    },
    "& .modal-body": {
      height: "94%"
    }
  },
  frame: {
    border: "0",
    minHeight: "100%",
    minWidth: "100%",
  }
};

@injectStyles(styles)
@observer
export default class ClientPreviewModal extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.url = `https://kg.ebrains.eu/search/live/${props.store.topInstanceId}`;
  }

  render() {
    const { show, handleClose, classes } = this.props;
    return (
      <Modal show={show} className={classes.greatModal}>
        <Modal.Body>
          <div className={classes.frameContainer}>
            <Iframe url={this.url}
              width="100%"
              height="100%"
              id="myId"
              className={classes.frame}
              display="initial"
              position="relative" />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose} variant="primary">Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
