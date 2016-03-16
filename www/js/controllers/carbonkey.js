'use strict';
/* global angular, Bitcoin */

angular.module('carbonkey.controllers').controller("CarbonKeyController", 
  function($scope, $cordovaBarcodeScanner, isDevice, addressParser,
    bitIDService, $ionicLoading, $ionicPopup) {

  this.initialise = function() {
    var keyPair = Bitcoin.ECPair.makeRandom();
    var wif = keyPair.toWIF();
    
    window.localStorage.setItem("wif", wif);
  }
  
  if(window.localStorage.getItem("wif") == null) {
    this.initialise();
  }
  
  $scope.imageData = {};
  
  $scope.processQRCode = function(data) {
    
    if (addressParser.isBitID(data) === true) {
      
      bitIDService.setAddress(data);
      
      $scope.site = bitIDService.getSiteAddress();
      
      var bitIDPopup = $ionicPopup.show({
        template: '<p>Do you want to sign in?</p>',
        title: $scope.site + ' is requesting that you identify yourself',
        scope: $scope,
        buttons: [
          { text: 'No' },
          {
            text: '<b>Yes</b>',
            type: 'button-positive',
            onTap: function(e) {
              return true;
            }
          }
        ]
      });
      bitIDPopup.then(function(res) {
        
        if(res != null && res == true) {
          var msg = bitIDService.generateSignatureMessage(
            window.localStorage.getItem("wif"));
            
          $ionicLoading.show({
            template: 'Authenticating...'
          });
          
          bitIDService.postMessage(msg).then(function(resp) {
            $ionicLoading.hide();
            alert('Authentication successful');
          }, function(err) {
            $ionicLoading.hide();
            alert('Authentication failed, try again. ' + err.status);
          });
        }
        return;
      });
    } else {
      // Here we do OnChain transaction signing.
    }
  };
    
  $scope.scanBarcode = function() {
    
    // If we are not on a device with a QR code reader then get the text
    // from the user. Useful for debug purposes.
    if(! isDevice) {
      var noQRReaderPopup = $ionicPopup.show({
        template: '<input type="text" ng-model="imageData.text">',
        title: 'Enter QR data',
        scope: $scope,
        buttons: [
          { text: 'Cancel' },
          {
            text: '<b>OK</b>',
            type: 'button-positive',
            onTap: function(e) {
              return $scope.imageData;
            }
          }
        ]
      });
      noQRReaderPopup.then(function(res) {
        // Wait for it to finish.
        if($scope.imageData.text)
          $scope.processQRCode($scope.imageData.text);
        return;
      });
    } else {
    
      $cordovaBarcodeScanner.scan().then(function(imageData) {
        $scope.imageData = imageData;
        if(!imageData.cancelled) {
          $scope.processQRCode($scope.imageData.text);
        }
      }, function(error) {
        alert("An error happened -> " + error);
      });
    }
  };
});