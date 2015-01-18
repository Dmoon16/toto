<!DOCTYPE html>
<html>
  <head>
    <META http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Welcome to Totto</title>    
    <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.0/css/bootstrap.min.css">
    <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.0/css/bootstrap-theme.min.css">
    <link rel="stylesheet" href="/static/css/screen.css">
  </head>
  <body>
    <!-- navbar -->
    <div class="navbar navbar-inverse navbar-fixed-top">
      <div class="container">
        <div class="navbar-header">
          <a class="navbar-brand" href="/">TOTTO</a>
        </div>
        <div class="navbar-collapse collapse ">
          <ul class="nav navbar-nav">
            <li class="active"><a href="/">Home</a></li>
          </ul>
        </div>
      </div>
    </div>

    <div class="container">

      <div class="jumbotron">
        <h1>Buna, eu sunt Totto</h1>
        <p>Sunt o aplicatie distribuita de lista de cumparaturi.</p>
      </div>

      <div class="row-fluid">
        <div class="span9">
          <div data-ng-app="Toto" data-ng-controller="TotoController as vm">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th colspan="2">
                    <form action="/" method="POST" onsubmit="javascript: return false" ng-submit="vm.addTodo()">
                      <div class="row">
                        <div class="col-lg-8">
                          <div class="input-group">
                            <input type="text" data-ng-model="vm.todoText" name="todo" class="form-control" placeholder="Ce cumparam?">  
                            <span class="input-group-btn">        
                              <button type="button" class="btn btn-success" data-ng-click="vm.addTodo()">Adauga</button>
                            </span>
                          </div><!-- /input-group --> 
                        </div> <!-- /col-lg-8 -->                    
                        <div class="col-lg-4">
                          <button type="button" class="btn btn-info" data-ng-click="vm.refreshList()">
                            <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span>
                          </button>
                        </div> <!-- /col-lg-4 -->
                      </div>
                    </form>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr data-ng-repeat="todo in vm.todos">
                  <td><p class="text-capitalize">{[{ todo.text }]}</p></td>
                  <td><a class="btn btn-small btn-danger" href="#" data-ng-click="vm.deleteTodo(todo.id)">Sterge</a></td>
                </tr>
              </tbody>
            </table>
            <br />
          </div>
        </div>
      </div>

    </div>

    <script src="//code.jquery.com/jquery-2.1.1.min.js" type="text/javascript"></script>
    <script src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.0/js/bootstrap.min.js"></script>
    <script src="/static/js/angular.min.js"></script>
    <script src="/static/js/ng-websocket.js"></script>
    <script src="/static/js/script.js"></script>
    <script type="text/javascript">
      var BASEURL = "{{base}}";
    </script>
  </body>
</html>
