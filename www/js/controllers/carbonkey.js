'use strict';
/* global angular, Bitcoin */
angular.module('carbonkey.controllers').controller("CarbonKeyController", 
  function($scope, $cordovaBarcodeScanner, isDevice, addressParser,
    bitIDService, onChainService, $ionicLoading, $ionicPopup) {

  this.initialise = function() {
    var keyPair = Bitcoin.ECPair.makeRandom();
    var wif = keyPair.toWIF();
    
    window.localStorage.setItem("wif", wif);
  };
  
  if(window.localStorage.getItem("wif") == null) {
    this.initialise();
  }
  
  $scope.imageData = {};
  
  $scope.processQRCode = function(data) {
    if (addressParser.isBitID(data) === true) {
      $scope.processBITID(data);
    } else if(addressParser.isOnChain(data) === true) {
      $scope.processONCHAIN(data);
    }
  };
  
  /**
   * Protocol for passing extended public keys to remote services. Can also
   * sign transactions created with that extended public key.
   */
  $scope.processONCHAIN = function(data) {
    
    onChainService.setAddress(data);
    onChainService.setWIF(window.localStorage.getItem("wif"));
    
    if(onChainService.getParsed().cmd == 'mpk') {
      
      var serviceUrl = onChainService.getParsed().service;
      
      var confirmPopup = $ionicPopup.confirm({
        title: 'Share Public Key',
        template: 'Share a public key with '+serviceUrl+'?'
      });
      
      confirmPopup.then(function(res) {
        if(res) {
          $ionicLoading.show({
            template: 'Sharing Extended Public Key with ' + serviceUrl
          });
          var req = onChainService.processMPK();
          req.then(function(data, status, headers, config) {
            alert('Extended Public Key shared');
            $ionicLoading.hide();
          }, function(data, status, headers, config) {
            alert('Error sharing Extended Public Key');
            $ionicLoading.hide();
          });
        }
      });
      
    } else if(onChainService.getParsed().cmd == 'sign') {
      _signTransaction();
    }
  }
  
  var _signTransaction = function() {
    var serviceUrl = onChainService.getParsed().service;
    confirmDialog.show('Sign the transaction with '+serviceUrl+'?', function(confirmed){
      if(confirmed) {
        self.setOngoingProcess('Signing transaction with '+serviceUrl);
        var txReq = onChainService.getTransaction();
        txReq.then(function(data, status, headers, config) {
          self.setOngoingProcess('Sending singatures');
          try {
            var sigList = onChainService.signTransaction(data.data);
            var postReq = onChainService.postSignedRequest(sigList);
            postReq.then(function(pData, pStatus, pHeaders, pConfig) {
              alert('Transaction signed');
              self.setOngoingProcess();
            }, function(pData, pStatus, pHeaders, pConfig) {
              var message = pData.message || '';
              alert('Error sending signatures. '+message);
              self.setOngoingProcess();
            });
          } catch (err) {
            alert(err);
            self.setOngoingProcess();
          }
        }, function(data, status, headers, config) {
          alert('Error getting transaction');
          self.setOngoingProcess();
        });
      }
    });
  };
  
  /**
   * BITID is a protocol for authentication.
   * https://github.com/bitid/bitid
   */
  $scope.processBITID = function(data) {
    
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
  };
  
  /**
   * Scan a bar code. If we are deployed on the ionic server, then
   * ask the user for a value. Easier for debug.
   */  
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