'use strict';
angular.module('app')
.controller('ExecHackersController', 
['$rootScope', '$scope', 'ApiRest','ngToast', 'urls','$state','$localStorage','Bulk',
 function ($rootScope, $scope,  ApiRest,ngToast, urls, $state, $localStorage, Bulk) {
  ApiRest.one('execs/hackers').get().then(function(data) {
      $scope.hackers = data;
    });
  $scope.rateApplications = function()
  {
  	ApiRest.one('execs/applications/next').get().then(function(data) {
      if(data)
        	$state.go('exec-application-detail', {id:data});
        else
        	$state.go('exec');
    });
  };

  $scope.bulk = Bulk.refresh();
  $scope.addToBulk = function(h)
  {
    $scope.bulk = Bulk.add(h);
  };
  $scope.removeFromBulk = function(h)
  {
    $scope.bulk = Bulk.remove(h);
  };
  $scope.clearBulk = function()
  {
    $scope.bulk = Bulk.clear();
  };
  $scope.refreshBulk = function()
  {
    $scope.bulk = Bulk.refresh();
  };
  $scope.acceptBulk = function()
  {
    $scope.bulk = Bulk.updateHackers(3);
  };
  $scope.waitlistBulk = function()
  {
    $scope.bulk = Bulk.updateHackers(2);
  };
  $scope.denyBulk = function()
  {
    $scope.bulk = Bulk.updateHackers(1);
  };
  }]);
