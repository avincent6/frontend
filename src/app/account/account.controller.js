'use strict';
angular.module('app')
  .controller('AccountDetailController', ['$rootScope', '$scope', 'ApiRest','ngToast', 'urls','Auth', function ($rootScope, $scope,  ApiRest,ngToast, urls, Auth) {

    $scope.roles = Auth.getRoles();
    ApiRest.one('users/me').get().then(function(data) {
      $scope.me = data;
    });
    $scope.updateMe = function()
    {
      //TODO
      ApiRest.all('users/me')
        .customPUT($scope.me)
        .then(function(data)  {
          console.log(data);
          ngToast.create({
            className: 'success',
            content: '<a>Account details updated!</a>'
          });
        })
    }
  }])
  .controller('ApplicationController', ['$rootScope', '$scope', 'ApiRest','ngToast', 'urls','$timeout','$http','Upload',
   function ($rootScope, $scope,  ApiRest,ngToast, urls, $timeout, $http, Upload) {
    $scope.pageLoaded = false;
    var fetchData = function()
    {
      ApiRest.one('users/me').get().then(function(data) {
      $scope.me = data;
      ApiRest.one('users/me/application').get().then(function(data) {
        $scope.pageLoaded = true;
        $scope.me.application = data.application;
        $scope.phase= data.phase;
        $scope.teamsEnabled= data.teamsEnabled;
        $scope.validation = data.validation;
      });
    });
    }
    fetchData();
    $scope.isSaved = true;
    $scope.lastSaved = new Date();
    var timeout = null;

     $scope.schoolSearch = function(name) {
    return ApiRest.one('schools').get({filter: name}).then(function(data) {
      console.log(data);
      return data;
    });
  };


    var saveApplication = function(reload)
    {
      ApiRest.all('users/me').customPUT($scope.me).then(function(data)
      {
        $scope.validation = data.validation;
        $scope.lastSaved = new Date();
        if(reload)
          fetchData();
        $scope.isSaved=true;
      });
    }

  var debounceSaveUpdates = function(newVal, oldVal) {
    if($scope.me===undefined)
      return;
    if($scope.me.application===undefined)
      return;
    $scope.isSaved=false;
    if (newVal != oldVal) {
      if (timeout) {
        $timeout.cancel(timeout)
      }
      timeout = $timeout(function () {
        if(newVal.application.team_code!=undefined && oldVal.application.team_code!=undefined)
        {
          if(!(newVal.application.team_code != oldVal.application.team_code))
            saveApplication(false);
        }
        saveApplication(false);
      }, 1000);  // 1000 = 1 second
    }
  };
  $scope.$watch('me', debounceSaveUpdates, true);

    //$scope.me.application.isTravellingFromSchool =1;
    $scope.changeTravellingFrom = function(mode)
    {
      $scope.me.application.isTravellingFromSchool = mode;
    };

    $scope.updateApplication = function(reload)
    {
      saveApplication(reload);
    }
    $scope.leaveTeam = function()
    {
      ApiRest.all('users/me/leaveteam').customPUT().then(function(data)
      {
        console.log(data);
        saveApplication(true);
      });
    }

    ApiRest.one('users/me/resumePUT').get().then(function(data) {
      $scope.resume_PUT=data;
    });
    $scope.dynamic=0;
    $scope.isUploading=false;
    $scope.upload = function (file) {
      if(file==null)
        {
          ngToast.create({
          className: 'warning',
          content: 'Error with file upload! Make sure it is a pdf!'
          });
          return;
        }
       $scope.isUploading=true;
      Upload.upload({
          url: $scope.resume_PUT,
          data: {file: file},
          method: 'PUT'
      }).then(function (resp) {
          console.log('Success');
          $scope.me.application.resume_uploaded=true;
          $scope.me.application.resume_filename=file.name;
          $scope.isUploading=false;
          saveApplication(false);
      }, function (resp) {
          console.log('Error status: ' + resp.status);
      }, function (evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          $scope.dynamic=progressPercentage;
          console.log('progress: ' + progressPercentage + '% ');
      });
    };
  }]);
