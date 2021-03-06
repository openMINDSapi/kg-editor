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
import MultiToggle from "../../../Components/MultiToggle";
import releaseStore from "../../../Stores/ReleaseStore";

const styles = {
  container: {
    display: "flex",
    flexDirection: "row"
  },
  toggle: {
    height: "24px",
    background: "var(--bg-color-ui-contrast4)",
    borderRadius: "20px"
  },
  text: {
    display: "inline-block",
    marginLeft: "4px",
    lineHeight: "1.7em"
  }
};

@injectStyles(styles)
@observer
export default class HideReleasedInstancesToggle extends React.Component {

  handleClick = showAll => {
    releaseStore.toggleHideReleasedInstances(!!showAll);
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.container}>
        <div className={classes.toggle}>
          <MultiToggle selectedValue={releaseStore.hideReleasedInstances} onChange={this.handleClick}>
            <MultiToggle.Toggle color={"var(--ft-color-loud)"} icon={"times"} value={false} />
            <MultiToggle.Toggle color={"var(--ft-color-loud)"} icon={"check"} value={true} />
          </MultiToggle>
        </div>
        <span className={classes.text}>Hide released instances</span>
      </div>
    );
  }
}