import React from "react";
import { observer } from "mobx-react";
import { Dropdown, MenuItem } from "react-bootstrap";
import injectStyles from "react-jss";
import authStore from "../Stores/AuthStore";
import CustomDropdownToggle from "./CustomDropdownToggle";
import routerStore from "../Stores/RouterStore";
import appStore from "../Stores/AppStore";


const styles = {
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
  },
  dropdownMenu: {
    background: "var(--ft-color-loud)",
    margin: "0 0 0 -20px",
    fontSize: "0.9em"
  }
};

@injectStyles(styles)
@observer
class WorkspaceSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentLocation: routerStore.history.location.pathname
    };
    routerStore.history.listen(location => {
      this.setState({ currentLocation: location.pathname });
    });
  }

  selectWorkspace = eventKey => {
    appStore.setCurrentWorkspace(eventKey);
  }

  render() {
    const { classes } = this.props;

    return (
      <div className={classes.container} title={`${appStore.currentWorkspace} workspace`}>
        {authStore.workspaces.length > 1 ?
          <Dropdown id="dropdown-custom-1">
            <CustomDropdownToggle bsRole="toggle">{appStore.currentWorkspace}</CustomDropdownToggle>
            <Dropdown.Menu className={classes.dropdownMenu}>
              {authStore.workspaces.map(workspace =>
                <MenuItem key={workspace}
                  eventKey={workspace}
                  onSelect={this.selectWorkspace}>
                  {workspace}</MenuItem>
              )}
            </Dropdown.Menu>
          </Dropdown>
          : appStore.currentWorkspace}
      </div>
    );
  }
}

export default WorkspaceSelector;