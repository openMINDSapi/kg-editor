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

import axios from "axios";
import authStore from "../Stores/AuthStore";

const endpoints = {
  "user": () => "/editor/api/user",
  "userInfo": user => `/editor/api/review/user/${user}`,
  "reviewUsers": (from, size, search) => `/editor/api/review/users?from=${from}&size=${size}&search=${search}`,
  "instanceReviews": instance => `/editor/api/scopes/${instance}`,
  "instanceReviewsByUser": (instance, user) => `/editor/api/scopes/${instance}/${user}`,
  "features": () => `${window.rootPath}/data/features.json`,
  "structureStatistics": () => "/statistics/structure.json",
  "perWeekDatasetsStatistics": () => `${window.rootPath}/data/mockups/perWeekDatasetsStatistics.json`,
  "globalDatasetsStatistics": () => `${window.rootPath}/data/mockups/globalDatasetsStatistics.json`,
  "bookmarkListFolders": mockup => mockup?`${window.rootPath}/data/mockups/lists.json`:"/editor/api/bookmarkListFolders",
  "listedInstances": (allFields=false, databaseScope=null) => `/editor/api/instances?allFields=${allFields}${databaseScope?("&databaseScope=" + databaseScope):""}`,
  "listInstances": (entity, from, size, search) => `/editor/api/bookmarkListInstances/${entity}?from=${from}&size=${size}&search=${search}`,
  "suggestions": (entity, field, type, start, size, search) => `/editor/api/suggestions/${entity}/fields?field=${encodeURIComponent(field)}&fieldType=${encodeURIComponent(type)}&start=${start}&size=${size}&search=${search}`,
  "instanceData": (instance, databaseScope=null) => `/editor/api/instance/${instance}${databaseScope?("?databaseScope=" + databaseScope):""}`,
  "releaseData": instance => `/editor/api/instance/${instance}/release`,
  "messages": () => "/editor/api/directives/messages",
  "doRelease": instance => `/editor/api/release/${instance}`,
  "releaseStatusTopInstance": () => "/editor/api/releases?releaseTreeScope=TOP_INSTANCE_ONLY",
  "releaseStatusChildren": () => "/editor/api/releases?releaseTreeScope=CHILDREN_ONLY",
  "createBookmarkList": () => "/editor/api/bookmarkList",
  "updateBookmarkList": id => `/editor/api/bookmarkList/${id}`,
  "deleteBookmarkList": id => `/editor/api/bookmarkList/${id}`,
  "listInstancesBookmarkLists": () => "/editor/api/bookmarks",
  "setInstanceBookmarkLists": instance => `/editor/api/instance/${instance}/bookmarks`,
  "graph": instance => `/editor/api/instance/${instance}/graph`,
  "structure": () => "/editor/api/structure?withLinks=true",
  "performQuery": function(instancePath, vocab, size, start, databaseScope){
    return `/editor/api/query/${instancePath}/instances${arguments.length > 1?"?":""}${
      ""}${vocab!==undefined && vocab!==null?`vocab=${encodeURIComponent(vocab)}&`:""}${
      ""}${size!==undefined && size!==null?`size=${encodeURIComponent(size)}&`:""}${
      ""}${start!==undefined && start!==null?`start=${encodeURIComponent(start)}&`:""}${
      ""}${databaseScope?`databaseScope=${databaseScope}`:"" }`;},
  "query": (instancePath, queryId) => `/editor/api/query/${instancePath}/${encodeURIComponent(queryId)}`,
  "listQueries": () => "/editor/api/query"
};

class API {
  constructor() {
    this._axios = axios.create({});
    this._axios.interceptors.response.use(null, (error) => {
      if (error.response && error.response.status === 401 && !error.config._isRetry) {
        return authStore.logout(true).then(()=>{
          error.config.headers.Authorization = "Bearer " + authStore.accessToken;
          error.config._isRetry = true;
          return this.axios.request(error.config);
        });
      } else {
        return Promise.reject(error);
      }
    });
  }

  get axios() {
    this.reloadToken();
    return this._axios;
  }

  get endpoints() {
    return endpoints;
  }

  reloadToken() {
    Object.assign(this._axios.defaults, {
      headers: { Authorization: "Bearer " + authStore.accessToken },
      withCredentials: true
    });
  }
}

export default new API();