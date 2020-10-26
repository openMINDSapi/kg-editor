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

import { observable, action, computed, toJS, makeObservable } from "mobx";

import FieldStore from "./FieldStore";

class InputTextStore extends FieldStore {
  value = "";
  returnAsNull = false;
  initialValue = "";

  constructor(definition, options, instance) {
    super(definition, options, instance);

    makeObservable(this, {
      value: observable,
      returnAsNull: observable,
      initialValue: observable,
      returnValue: computed,
      cloneWithInitialValue: computed,
      updateValue: action,
      reset: action,
      hasChanged: computed,
      setValue: action
    });
  }

  get returnValue() {
    if (this.value === "" && this.returnAsNull) {
      return null;
    }
    return toJS(this.value);
  }

  get cloneWithInitialValue() {
    return {
      ...this.definition,
      value: toJS(this.initialValue)
    };
  }

  updateValue(value) {
    this.returnAsNull = false;
    this.initialValue = (value !== null && value !== undefined)?value:"";
    this.value = this.initialValue;
  }

  reset() {
    this.returnAsNull = false;
    this.value = this.initialValue;
  }

  get hasChanged() {
    if (typeof this.initialValue  === "object") {
      return typeof this.returnValue !== "object"; // user did not change the value
    }
    return this.returnValue !== this.initialValue;
  }

  setValue(value) {
    if (value !== null && value !== undefined) {
      if (value !== "" || !this.returnAsNull) {
        this.returnAsNull = false;
        this.value = value;
      }
    } else  {
      this.returnAsNull = true;
      this.value = "";
    }
  }
}

export default InputTextStore;