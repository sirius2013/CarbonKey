'use strict';
/* global angular */

angular.module('carbonkey').config(function($stateProvider, $urlRouterProvider) {
  
  $urlRouterProvider.otherwise('/')

  $stateProvider.state('home', {
    url: '/',
    templateUrl: 'views/home.html'
  })
})