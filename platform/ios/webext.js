/*******************************************************************************

    uBlock Origin - a comprehensive, efficient content blocker
    Copyright (C) 2019-present Raymond Hill

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/gorhill/uBlock
*/

'use strict';

export default browser;



// Browser Storage API Polyfill using IndexedDB
(function(global) {
  if (global.browser && global.browser.storage) {
    return; // Browser storage API already exists
  }

  const dbName = 'BrowserStoragePolyfill';
  const dbVersion = 1;

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        ['local', 'sync', 'managed'].forEach(area => {
          if (!db.objectStoreNames.contains(area)) {
            db.createObjectStore(area);
          }
        });
      };
    });
  }

  function createStorageArea(areaName) {
    const storage = {
      get(keys) {
        return openDB().then(db => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction([areaName], 'readonly');
            const store = transaction.objectStore(areaName);
            const result = {};

            function getNext(keys) {
              if (keys.length === 0) {
                resolve(result);
                return;
              }
              const key = keys.shift();
              const request = store.get(key);
              request.onsuccess = () => {
                if (request.result !== undefined) {
                  result[key] = request.result;
                }
                getNext(keys);
              };
            }

            if (typeof keys === 'string') {
              keys = [keys];
            } else if (typeof keys === 'object' && !Array.isArray(keys)) {
              const keyArray = Object.keys(keys);
              keyArray.forEach(key => {
                result[key] = keys[key]; // Set default values
              });
              keys = keyArray;
            } else if (keys === null) {
              keys = [];
              store.getAllKeys().onsuccess = (event) => {
                keys = event.target.result;
                getNext(keys);
              };
              return;
            }

            getNext(keys);
          });
        });
      },

      set(items) {
        return openDB().then(db => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction([areaName], 'readwrite');
            const store = transaction.objectStore(areaName);

            for (let key in items) {
              store.put(items[key], key);
            }

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
          });
        });
      },

      remove(keys) {
        return openDB().then(db => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction([areaName], 'readwrite');
            const store = transaction.objectStore(areaName);

            if (typeof keys === 'string') {
              keys = [keys];
            }

            keys.forEach(key => {
              store.delete(key);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
          });
        });
      },

      clear() {
        return openDB().then(db => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction([areaName], 'readwrite');
            const store = transaction.objectStore(areaName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        });
      },

      getBytesInUse(keys) {
        return this.get(keys).then(items => {
          const jsonString = JSON.stringify(items);
          return new Blob([jsonString]).size;
        });
      },
    };

    if (areaName === 'managed') {
      storage.get = () => Promise.resolve({});
      storage.set = () => Promise.reject(new Error("Managed storage cannot be modified"));
      storage.remove = () => Promise.reject(new Error("Managed storage cannot be modified"));
      storage.clear = () => Promise.reject(new Error("Managed storage cannot be modified"));
    }

    return storage;
  }

  global.browser = global.browser || {};
  global.browser.storage = {
    local: createStorageArea('local'),
    sync: createStorageArea('sync'),
    managed: createStorageArea('managed'),

    onChanged: {
      addListener: function(callback) {
        // This is a simplified implementation and won't catch all changes
        document.addEventListener('storage', (event) => {
          const [area, key] = event.key.split(':');
          const changes = {
            [key]: {
              oldValue: JSON.parse(event.oldValue),
              newValue: JSON.parse(event.newValue)
            }
          };
          callback(changes, area);
        });
      },
      removeListener: function(callback) {
        // Implementation of removeListener would go here
      },
      hasListener: function(callback) {
        // Implementation of hasListener would go here
        return false;
      }
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis :
   typeof window !== 'undefined' ? window :
   typeof global !== 'undefined' ? global :
   typeof self !== 'undefined' ? self : this);
