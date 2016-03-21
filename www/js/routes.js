'use strict';
/* global angular */

angular.module('carbonkey').config(function($stateProvider, $urlRouterProvider) {
  
  $stateProvider
    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "views/side-menu.html",
      controller : "AppController"
    })
    .state('app.home', {
      url: "/home",
      views: {
        'menuContent' :{
          templateUrl: "views/home.html",
          controller : "CarbonKeyController"
        }
      }
    })

  $urlRouterProvider.otherwise('/app/home')

  $stateProvider.state('home', {
    url: '/',
    templateUrl: 'views/home.html'
  })
})