import {observable, action} from "mobx";
import PaneStore from "./PaneStore";
import instanceStore from "./InstanceStore";
import appStore from "./AppStore";

const STORED_INSTANCE_TABS_KEY = "openedTabs";

const getStoredInstanceTabs = () => {
  const value = localStorage.getItem(STORED_INSTANCE_TABS_KEY);
  if(!value) {
    return {};
  }
  try {
    const tabs = JSON.parse(value);
    if (tabs && typeof tabs === "object" && !(tabs instanceof Array)) {
      return tabs;
    }
    return {};
  } catch (e) {
    return {};
  }
};

class InstanceTabStore{
  @observable instanceTabs = new Map();

  syncStoredInstanceTabs(){
    const tabs = getStoredInstanceTabs();
    tabs[appStore.currentWorkspace] = [...this.instanceTabs].map(([id, infos])=>[id, infos.viewMode]);
    localStorage.setItem(STORED_INSTANCE_TABS_KEY, JSON.stringify(tabs));
  }

  flushStoredInstanceTabs(){
    localStorage.removeItem(STORED_INSTANCE_TABS_KEY);
  }

  getWorkspaceStoredInstanceTabs(){
    if(!appStore.currentWorkspace) {
      return [];
    }
    const tabs = getStoredInstanceTabs();
    const workspaceTabs = tabs[appStore.currentWorkspace];
    if (workspaceTabs instanceof Array) {
      return workspaceTabs;
    }
    return [];
  }

  @action
  closeInstanceTab(instanceId){
    this.instanceTabs.delete(instanceId);
    this.syncStoredInstanceTabs();
  }

  @action
  closeAllInstanceTabs(){
    this.instanceTabs.clear();
    this.syncStoredInstanceTabs();
  }

  @action
  clearInstanceTabs() {
    this.instanceTabs.clear();
  }

  @action
  openInstanceTab(instanceId, viewMode) {
    if (this.instanceTabs.has(instanceId)) {
      this.instanceTabs.get(instanceId).viewMode = viewMode;
    } else {
      this.instanceTabs.set(instanceId, {
        currentInstancePath: [],
        viewMode: viewMode,
        paneStore: new PaneStore()
      });
    }
  }

  getOpenedInstanceTabsExceptCurrent(instanceId) {
    let result = [];
    Array.from(this.instanceTabs.keys()).forEach(id => {
      if (id !== instanceId) {
        const instance = instanceStore.instances.get(id);
        const instancesToBeKept = instance.linkedIds;
        result = [...result, ...instancesToBeKept];
      }
    });
    return Array.from(new Set(result));
  }

  @action
  setCurrentInstanceId(mainInstanceId, currentInstanceId, level){
    let currentInstancePath = this.instanceTabs.get(mainInstanceId).currentInstancePath;
    currentInstancePath.splice(level, currentInstancePath.length-level, currentInstanceId);
  }

  getCurrentInstanceId(instanceId){
    let currentInstancePath = this.instanceTabs.get(instanceId).currentInstancePath;
    return currentInstancePath[currentInstancePath.length-1];
  }

}

export default new InstanceTabStore();