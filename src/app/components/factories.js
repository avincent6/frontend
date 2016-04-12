'use strict';
angular.module('app')
.factory('ApiRest', function(Restangular,urls,$localStorage,Auth) {
  return Restangular.withConfig(function(RestangularConfigurer) {
    RestangularConfigurer.setBaseUrl(urls.BASE_API);
    var auth_header = 'Bearer '+$localStorage.token;
    RestangularConfigurer.setDefaultHeaders({Authorization: auth_header});

    // RestangularConfigurer.addResponseInterceptor(function(data, operation, what, url, response, deferred) {
    //   var extractedData;
    //   extractedData = data.data;
    //   return extractedData;
    // });
  });
})

.factory('Bulk', ['$http', '$localStorage', 'urls','ApiRest',
 function ($http, $localStorage, urls, ApiRest) {
    
  function clear() {
    $localStorage.bulk = [];
    return [];
  }
  function init() {
    if($localStorage.bulk === undefined)
      $localStorage.bulk = [];
  }
  function get()
  {
    init();
    return $localStorage.bulk;
  }
  function add(h)
  {
    if($localStorage.bulk.indexOf(h) == -1)
      $localStorage.bulk.push(h);
    return $localStorage.bulk;
  }
  function remove(h)
  {
    var index = $localStorage.bulk.indexOf(h);
    $localStorage.bulk.splice(index,1);
    return $localStorage.bulk;
  }
  function refreshHackers()
  {
    init();
    var ids = $localStorage.bulk.map(function(a) {return a.id;});
    ApiRest.all('execs/hackers/bulk').customPOST(ids).then(function(data) {
      $localStorage.bulk = data;
    });
    return $localStorage.bulk;
  }
  function updateHackers(newDecision)
  {
    init();
    var ids = $localStorage.bulk.map(function(a) {return a.id;});
    ApiRest.all('execs/hackers/bulk').customPUT({hackers: ids, decision: newDecision})
    .then(function(data) {
      $localStorage.bulk = data;
      });
    return refreshHackers();
  }
  return {
    clear: clear,
    refresh: refreshHackers,
    updateHackers: updateHackers,
    get: get,
    add: add,
    remove: remove
  };

 }])


.factory('Auth', ['$http', '$localStorage', 'urls', function ($http, $localStorage, urls) {
      function urlBase64Decode(str) {
          var output = str.replace('-', '+').replace('_', '/');
          switch (output.length % 4) {
              case 0:
                  break;
              case 2:
                  output += '==';
                  break;
              case 3:
                  output += '=';
                  break;
              default:
                  throw 'Illegal base64url string!';
          }
          return window.atob(output);
      }

      function getClaimsFromToken() {
          var token = $localStorage.token;
          var user = {};
          if (typeof token !== 'undefined') {
              var encoded = token.split('.')[1];
              user = JSON.parse(urlBase64Decode(encoded));
          }
          return user;
      }
      var tokenClaims = getClaimsFromToken();

    function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
    }
  
      return {
          signup: function (data, success, error) {
            //#todo: test
            $http({
              method: 'POST',
              url: urls.BASE_API + '/users',
              data: $.param(data),
              headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(success).error(error);
          },
          signin: function (data, success, error) {
            $http({
              method: 'POST',
              url: urls.BASE_API + '/auth',
              data: $.param(data),
              headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(success).error(error);
          },
          logout: function (success) {
              tokenClaims = {};
              $localStorage.$reset();
              console.log('loggin out');
              success();
          },
          getTokenClaims: function () {
              return tokenClaims;
          },
        getRoles: function () {
          return tokenClaims.roles;
        },
        hasRole: function(roleName)
        {
          if($localStorage.me === undefined) { return false;}
          //console.log(Auth.getRoles());
          //if(true){return true;}//debug

					tokenClaims = getClaimsFromToken();

          return tokenClaims.roles.indexOf(roleName) !== -1;
        }
      };
  }
  ])
/**
 * Filter to show pretty dates
 */
.filter('prettyDateFull', function ()
{
  return function (timestring)
  {
    var UtcDate = moment.utc(timestring);
    return moment(UtcDate).local().format('dddd MMMM Do YYYY, h:mm:ss a');
  };
})
.filter('prettyDateShort', function ()
{
  return function (timestring)
  {
    var UtcDate = moment.utc(timestring);
    return moment(UtcDate).local().format('MM/DD/YY, h:mm');
  };
})
  .filter('prettyDate', function ()
  {
    return function (timestring)
    {
      var UtcDate = moment.utc(timestring);
      return moment(UtcDate).local().format('ddd MMM D, h:mm a');
    };
  })
  .filter('prettyTime', function ()
  {
    return function (timestring)
    {
      var UtcDate = moment.utc(timestring);
      return moment(UtcDate).local().format('h:mm a');
    };
  })
  .filter('jsonParse', function ()
  {
    return function (jsonstring)
    {
      return JSON.parse(jsonstring);
    };
  })
  .filter('decision', function ()
  {
    return function (d)
    {
      d = parseInt(d);
      switch(d) {
      case 1:
          return "reject";
      case 2:
          return "waitlist";
      case 3:
          return "accept";
      default:
        return d;
    }
    };
  })
/**
 * Configures ngToast
 */
.config(['ngToastProvider', function(ngToast) {
  ngToast.configure({
    verticalPosition: 'top',
    horizontalPosition: 'center',
    maxNumber: 3,
		className:'info'
  });
}])
.directive('capitalize', function() {
   return {
     require: 'ngModel',
     link: function(scope, element, attrs, modelCtrl) {
        var capitalize = function(inputValue) {
           if(inputValue == undefined) inputValue = '';
           var capitalized = inputValue.toUpperCase();
           if(capitalized !== inputValue) {
              modelCtrl.$setViewValue(capitalized);
              modelCtrl.$render();
            }
            return capitalized;
         }
         modelCtrl.$parsers.push(capitalize);
         capitalize(scope[attrs.ngModel]);  // capitalize initial value
     }
   };
})

/**
 * Access Control for routes
 */
.run(['$rootScope', '$window','Auth','$state','$location', '$localStorage', function($rootScope, $window, Auth,$state,$location, $localStorage) {
  $rootScope.$on('$stateChangeStart', function(e, toState) {
    //toParams, fromState, fromParams are useable
    var permissions;
    permissions = toState && toState.data ? toState.data.roles : null;
    var canAccess;

    if(permissions===null)
    {
      canAccess=true;
    }
    else
    {
      canAccess=Auth.hasRole(permissions);
      if(Auth.hasRole('admin'))
      {
        canAccess=true;
      }
    }
    if(!canAccess)
    {
      e.preventDefault();
      $state.go('unauthorized');
    }

  });
}]);
