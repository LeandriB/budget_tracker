// standardize different versions for indexedDB
const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;

const database = "budget_tracker"
const objectStore = "transactions"

const request = indexedDB.open(database, 1);

request.onupgradeneeded = ({ target }) => {
  let db = target.result;
  db.createObjectStore(objectStore, { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
  db = target.result;
  // check if app is online before reading from db
  if (navigator.onLine) {
    // method goes here
    checkDatabase();
  }
};

// Error handling
request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction([objectStore], "readwrite");
  const store = transaction.objectStore(objectStore);
  store.add(record);
}

/*
  INFO: When our Internet connection is restored, we need to update
  the server with any new/changed data.

  We have a route on the server which will be listening for anytime 
  we need to to a bulk upodate. This name of this route is:

  /api/transaction/bulk

  TODO: replace the string named "OBJECT_STORE" with the objectStore 
  variable.
*/
function checkDatabase() {
  const transaction = db.transaction([objectStore], "readwrite");
  const store = transaction.objectStore(objectStore);
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      
      /*
        INFO: This is a route we would create in Express (it's already done)
        to handle this kind of bulk update.
      */

      /*
        TODO: Insert the route name specified above.
      */

      fetch("INSERT_UPDATE_ROUTE_NAME_HERE", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => {        
        return response.json();
      })
      .then(() => {
        // delete indexedDB records if the update is successful
        const transaction = db.transaction([objectStore], "readwrite");
        const store = transaction.objectStore(objectStore);
        store.clear();
      });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);