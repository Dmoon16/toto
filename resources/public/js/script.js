var app = angular.module('Toto', []);

app.factory('TotoSvc', function($window, $q){
  var indexedDB = $window.indexedDB;
  var db=null;
  var lastIndex=0;
  
  var open = function(){
    var deferred = $q.defer();
    var version = 1;
    var request = indexedDB.open("todoData", version);
  
    request.onupgradeneeded = function(e) {
      db = e.target.result;
  
      e.target.transaction.onerror = indexedDB.onerror;
  
      if(db.objectStoreNames.contains("todo")) {
        db.deleteObjectStore("todo");
      }
  
      var store = db.createObjectStore("todo",
        {keyPath: "id"});
    };
  
    request.onsuccess = function(e) {
      db = e.target.result;
      deferred.resolve();
    };
  
    request.onerror = function(){
      deferred.reject();
    };
    
    return deferred.promise;
  };
  
  var getTodos = function(){
    var deferred = $q.defer();
    
    if(db === null){
      deferred.reject("IndexDB is not opened yet!");
    }
    else{
      var trans = db.transaction(["todo"], "readwrite");
      var store = trans.objectStore("todo");
      var todos = [];
    
      // Get everything in the store;
      var keyRange = IDBKeyRange.lowerBound(0);
      var cursorRequest = store.openCursor(keyRange);
    
      cursorRequest.onsuccess = function(e) {
        var result = e.target.result;
        if(result === null || result === undefined)
        {
          deferred.resolve(todos);
        }
        else{
          todos.push(result.value);
          if(result.value.id > lastIndex){
            lastIndex=result.value.id;
          }
          result.continue();
        }
      };
    
      cursorRequest.onerror = function(e){
        console.log(e.value);
        deferred.reject("Something went wrong!!!");
      };
    }
    
    return deferred.promise;
  };
  
  var deleteTodo = function(id){
    var deferred = $q.defer();
    
    if(db === null){
      deferred.reject("IndexDB is not opened yet!");
    }
    else{
      var trans = db.transaction(["todo"], "readwrite");
      var store = trans.objectStore("todo");
    
      var request = store.delete(id);
    
      request.onsuccess = function(e) {
        deferred.resolve();
      };
    
      request.onerror = function(e) {
        console.log(e.value);
        deferred.reject("Todo item couldn't be deleted");
      };
    }
    
    return deferred.promise;
  };
  
  var addTodo = function(todoText){
    var deferred = $q.defer();
    
    if(db === null){
      deferred.reject("IndexDB is not opened yet!");
    }
    else{
      var trans = db.transaction(["todo"], "readwrite");
      var store = trans.objectStore("todo");
      lastIndex++;
      var request = store.put({
        "id": lastIndex,
        "text": todoText
      });
    
      request.onsuccess = function(e) {
        deferred.resolve();
      };
    
      request.onerror = function(e) {
        console.log(e.value);
        deferred.reject("Todo item couldn't be added!");
      };
    }
    return deferred.promise;
  };
  
  return {
    open: open,
    getTodos: getTodos,
    addTodo: addTodo,
    deleteTodo: deleteTodo
  };
  
});

app.factory('TotoWs', function(TotoSvc, $q) {
  var ws;

  /**
   * Opens a websocket connection
   */
  function open() {
    var defer = $q.defer();
    if (!ws || ws.readyState != 1) {
      ws = new WebSocket("ws://" + BASEURL + "/sync/");
      ws.onerror = function (error) {
        defer.reject('Could not open websocket');
      };

      ws.onclose = function (e) {
        console.error("Reason: ", e.reason);
        defer.reject('Websocket closed');
      };       
    
      ws.onopen = function(e){  
          console.log("Socket has been opened!"); 
          ws = e.target.result;
          defer.resolve(); 
      };
    }

    ws.onmessage = function(message) {
        syncDown(JSON.parse(message.data));
    };

    return defer.promise;
  }

  function syncUp() {
    var defer = $q.defer();
    if (!ws || ws.readyState != 1) {
      defer.reject('Connection not opened');
      return defer.promise;
    }
    TotoSvc.getTodos().then(function (data) {
      ws.send(JSON.stringify(data));
      defer.resolve();
    });
    return defer.promise;
  }

  function syncDown(data) {
    var messageObj = data;
    console.log("Received data from websocket: ", messageObj);
  }

  return {
    open: open,
    syncUp: syncUp
  }
  
});

app.config(function($interpolateProvider) {  
  $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
});

app.controller('TotoController', function($window, TotoSvc, TotoWs){
  var vm = this;
  vm.todos=[];
  
  vm.refreshList = function(){
    TotoSvc.getTodos().then(function(data){
      vm.todos=data;
    }, function(err){
      $window.alert(err);
    });
  };
  
  vm.addTodo = function(){
    TotoSvc.addTodo(vm.todoText).then(function(){
      vm.refreshList();
      vm.todoText="";
    }, function(err){
      $window.alert(err);
    });
  };
  
  vm.deleteTodo = function(id){
    TotoSvc.deleteTodo(id).then(function(){
      vm.refreshList();
    }, function(err){
      $window.alert(err);
    });
  };
  
  function init(){
    TotoSvc.open().then(function () {
      TotoWs.open().then(TotoWs.syncUp());
    })
    .then(function(){
      vm.refreshList();
    });
  }
  
  init();
});