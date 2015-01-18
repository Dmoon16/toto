var app = angular.module('Toto', ['ngWebsocket']);

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

  var replaceTodos = function(todos){
    var deferred = $q.defer();
    
    if(db === null){
      deferred.reject("IndexDB is not opened yet!");
    }
    else{
      var trans = db.transaction(["todo"], "readwrite");
      var store = trans.objectStore("todo");
      lastIndex++;
      var request = store.clear();    
      request.onsuccess = function(e) {
        _.each(todos, function (todo) {
          addTodo(todo);
        });
        deferred.resolve();
      };
    
      request.onerror = function(e) {
        console.log(e.value);
        deferred.reject("Todos couldn't be replaced!");
      };
    }
    return deferred.promise;
  };
  
  return {
    open: open,
    getTodos: getTodos,
    addTodo: addTodo,
    deleteTodo: deleteTodo,
    replaceTodos: replaceTodos
  };
  
});

app.config(function($interpolateProvider) {  
  $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
});

app.controller('TotoController', function($window, TotoSvc, $websocket){
  var vm = this;
  vm.ws = null;
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
      vm.syncUp();
    }, function(err){
      $window.alert(err);
    });
  };
  
  vm.deleteTodo = function(id){
    TotoSvc.deleteTodo(id).then(function(){
      vm.refreshList();
      vm.syncUp();
    }, function(err){
      $window.alert(err);
    });
  };

  vm.syncUp = function () {
    console.debug('Socket opened');
    TotoSvc.open()
    .then( function () {
      TotoSvc.getTodos().then(
        function (data) {  
          var toSend = _.pluck(data, "text");
          console.debug('Sending info', toSend);      
          vm.ws.$emit('syncup', toSend);
        });
      vm.refreshList();
    });
  }
  
  function init(){
    vm.ws = $websocket.$new({
      url: "ws://" + BASEURL + "/sync"
    });
    vm.ws.$on('syncup', function (received) {
      TotoSvc.open().then(function (){
        TotoSvc.replaceTodos(received);
      });
      console.info("Received data: ", received);
    })
    .$on('$close', function () {
      console.info('Connection closed');
    })
    .$on('$open', function () {
      vm.syncUp();
    });
  }
  
  init();
});