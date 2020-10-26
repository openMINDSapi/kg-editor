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

import { observable, computed, action, runInAction, makeObservable } from "mobx";
import API from "../Services/API";

class BookmarkStore {
  list = [];
  isFetching = false;
  listFilter = "";
  fetchError = null;
  updateError = null;
  saveError = null;
  deleteError = null;

  newBookmarkName = null;
  isCreatingBookmark = false;
  bookmarkCreationError = null;

  currentlyEditedBookmark = null;

  constructor() {
    makeObservable(this, {
      list: observable,
      isFetching: observable,
      listFilter: observable,
      fetchError: observable,
      updateError: observable,
      saveError: observable,
      deleteError: observable,
      newBookmarkName: observable,
      isCreatingBookmark: observable,
      bookmarkCreationError: observable,
      currentlyEditedBookmark: observable,
      hasFetchError: computed,
      cancelBookmarkDeletion: action,
      setCurrentlyEditedBookmark: action,
      cancelCurrentlyEditedBookmark: action,
      dismissBookmarkCreationError: action,
      revertBookmarkChanges: action,
      deleteBookmark: action,
      fetch: action,
      createBookmark: action,
      updateBookmark: action
    });
  }

  get hasFetchError() {
    return this.fetchError !== null;
  }

  filteredList(term) {
    term = typeof term === "string" && term.trim().toLowerCase();
    if(term) {
      return this.list.filter(bookmark => bookmark && typeof bookmark.label === "string" && bookmark.label.toLowerCase().includes(term));
    }
    return this.list;
  }

  cancelBookmarkDeletion(bookmark) {
    if (!bookmark) { return; }
    bookmark.deleteError = null;
  }

  setCurrentlyEditedBookmark(bookmark) {
    if (bookmark && !bookmark.isUpdating && !bookmark.isDeleting) {
      if (!bookmark.updateError) {
        bookmark.editName = bookmark.label;
      }
      bookmark.updateError = null;
      this.currentlyEditedBookmark = bookmark;
    }
  }

  cancelCurrentlyEditedBookmark(bookmark) {
    if (!bookmark || this.currentlyEditedBookmark === bookmark) {
      this.currentlyEditedBookmark = null;
    }
  }

  dismissBookmarkCreationError() {
    this.bookmarkCreationError = null;
    this.newBookmarkName = null;
  }


  revertBookmarkChanges(bookmark) {
    if (!bookmark) { return; }
    bookmark.editName = null;
    bookmark.updateError = null;
    this.cancelCurrentlyEditedBookmark(bookmark);
  }

  async deleteBookmark(bookmark) {
    if (!bookmark) { return false; }
    bookmark.deleteError = null;
    bookmark.isDeleting = true;
    try {
      await API.axios.delete(API.endpoints.bookmarkList(bookmark.id));
      runInAction(() => {
        bookmark.isDeleting = false;
        const index = this.list.findIndex(item => item.id === bookmark.id);
        if (index !== -1) {
          this.list.splice(index, 1);
        }
      });
    } catch (e) {
      runInAction(() => {
        bookmark.deleteError = e.message?e.message:e;
        bookmark.isDeleting = false;
      });
    }
  }

  async fetch() {
    if (this.isFetching) {
      return null;
    }
    try {
      this.isFetching = true;
      this.fetchError = null;
      const { data } = await API.axios.get(API.endpoints.bookmarks());
      runInAction(() => {
        this.list = data.data;
        this.isFetching = false;
      });
    } catch (e) {
      runInAction(() => {
        this.fetchError = e.message ? e.message : e;
        this.isFetching = false;
      });
    }
  }

  async createBookmark(name, instanceIds) {
    this.newBookmarkName = name;
    this.bookmarkCreationError = null;
    this.isCreatingBookmark = true;
    try {
      const { data } = await API.axios.post(API.endpoints.bookmarkList(), { name: name, list: instanceIds || [] });
      runInAction(() => {
        const bookmarkData = data && data.data;
        this.list.push({
          id: bookmarkData.id,
          name: bookmarkData.name ? bookmarkData.name : name,
          isUpdating: false,
          updateError: null,
          isDeleting: false,
          deleteError: null
        });
        this.isCreatingBookmark = false;
        this.newBookmarkName = null;
      });
    } catch (e) {
      runInAction(() => {
        this.isCreatingBookmark = false;
        this.bookmarkCreationError = e.message ? e.message : e;
      });
    }
  }

  async updateBookmark(bookmark, newProps) {
    if (!bookmark) { return false; }
    bookmark.editName = newProps.name;
    bookmark.updateError = null;
    bookmark.isUpdating = true;
    try {
      const { data } = await API.axios.put(API.endpoints.bookmarkList(bookmark.id), { name: newProps.name });
      runInAction(() => {
        bookmark.label = data && data.data ? data.data.label : null;
        bookmark.isUpdating = false;
      });
    } catch (e) {
      runInAction(() => {
        bookmark.updateError = e.message ? e.message : e;
        bookmark.isUpdating = false;
        return false;
      });
    }
  }
}
export default new BookmarkStore();