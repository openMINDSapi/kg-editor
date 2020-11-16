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
import { observer } from "mobx-react-lite";
import Dropdown from "react-bootstrap/Dropdown";
import { createUseStyles } from "react-jss";

import { useStores } from "../Hooks/UseStores";

import CustomDropdownToggle from "./CustomDropdownToggle";
import CustomDropdownMenu from "./CustomDropdownMenu";

const useStyles = createUseStyles({
  container: {
    height: "50px",
    lineHeight: "50px",
    color: "var(--ft-color-normal)",
    background: "var(--bg-color-ui-contrast2)",
    padding: "0 20px 0 20px",
    border: "1px solid var(--border-color-ui-contrast2)",
    borderLeft: "none",
    cursor: "pointer",
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    "& .btn-group": {
      margin: "-2px"
    }
  }
});

const WorkspaceSelector = observer(() => {
  const classes = useStyles();

  const { appStore, authStore } = useStores();

  const handleSelectWorkspace = eventKey => appStore.setCurrentWorkspace(eventKey);

  return (
    <div className={classes.container} title={`${appStore.currentWorkspaceName} workspace`}>
      {authStore.workspaces.length > 1 ?
        <Dropdown>
          <Dropdown.Toggle as={CustomDropdownToggle}>
            {appStore.currentWorkspaceName}
          </Dropdown.Toggle>
          <Dropdown.Menu as={CustomDropdownMenu}>
            {authStore.workspaces.map(workspace =>
              <Dropdown.Item
                key={workspace.id}
                eventKey={workspace.id}
                onSelect={handleSelectWorkspace}>
                {workspace.name||workspace.id}
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
        : appStore.currentWorkspaceName}
    </div>
  );
});
WorkspaceSelector.displayName = "WorkspaceSelector";

export default WorkspaceSelector;