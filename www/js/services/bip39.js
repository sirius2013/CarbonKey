'use strict';
/* global angular, Mnemonic, Bitcoin */

angular.module('carbonkey.services')

.factory('bip39', function() {

  var service = {};

  service.generateBip39 = function() {
    
    var bip39 = new Mnemonic('english');
    return bip39.generate();
  };

  service.toSeed = function(words) {
    
    var bip39 = new Mnemonic('english');
    var seed = bip39.toSeed(words);
    return seed;
  };

  service.toWIF = function(words) {
    var hd = Bitcoin.HDNode.fromSeedHex(service.toSeed(words));
    return hd.keyPair.toWIF();
  };

  service.toECKey = function(words) {
    var hd = Bitcoin.HDNode.fromSeedHex(service.toSeed(words));
    return hd.keyPair;
  };

  return service;

});
