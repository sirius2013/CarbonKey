'use strict';
/* global angular, Bitcoin */
angular.module('carbonkey.controllers').controller('AppController', 
  function($scope, $ionicSideMenuDelegate) {
    
  $scope.toggleLeft = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };
    
  $scope.toggleRight = function() {
    $ionicSideMenuDelegate.toggleRight();
  };
  
})