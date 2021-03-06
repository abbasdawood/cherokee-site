'use strict';
/**
 * @ngdoc service
 * @name chocoholicsApp.orderServices
 * @description
 * # orderServices
 * Factory in the chocoholicsApp.
 */
angular.module('chocoholicsApp')
  .factory('orderService', function($q, $http, ENV, commonService, localStorageService) {
    // Service logic
    // ...
    const ENDPOINT = '/order/';
    var vendor = ENV.vendorKey;
    // Public API here
    return {
      createOrder: function() {
        var body = {
          mode: ENV.mode,
          style: ENV.style,
          type: 'food & beverage',
          owner: ENV.owner
        };
        console.log('creating online order');
        return $http.post(ENV.serverURL + ENDPOINT + 'order/' + vendor, body);
      },
      addOrderItem: function(items) {
        return $http.post(ENV.serverURL + ENDPOINT + 'add', { items: items });
      },
      linkOrder: function(orderId, itemId) {
        return $http.post(ENV.serverURL + ENDPOINT + 'linkOrder', {
          orderId: orderId,
          orderItemId: itemId
        });
      },
      getOrderItems: function(orderId) {
        return $http.get(ENV.serverURL + ENDPOINT + 'items/' + orderId);
      },
      removeOrderItem: function(id) {
        return $http.delete(ENV.serverURL + ENDPOINT + 'item/' + id); /*** need help ***/
      },
      updateOrderItem: function(itemId, quantity, discount, discountCode, remarks, orderId) {
        var body = {
          quantity: parseInt(quantity),
          discount: parseFloat(discount),
          discountCode: discountCode,
          remarks: remarks,
          orderId: orderId
        };
        return $http.put(ENV.serverURL + ENDPOINT + 'item/' + itemId, body);
      },
      generateLink: function(data) {
        /*** What is payPath ***/
        return $http.post(ENV.serverURL + ENV.payPath + '/generate', data, {
          headers: {
            'x-access-token': localStorageService.get('token')
          }
        });
      },
      getOrders: function(skip, limit, user, sort, state) {
        var url = ENV.serverURL + ENDPOINT + 'orders/' + ENV.vendorKey;
        var queryParams = {};
        if (skip) {
          queryParams.skip = parseInt(skip);
        }
        if (limit) {
          queryParams.limit = parseInt(limit);
        }
        if (user) {
          queryParams.user = user;
        }
        if (sort) {
          queryParams.sortBy = sort;
        }
        if (state) {
          queryParams.state = state;
        }
        var queryData = commonService.serialize(queryParams);

        console.log(queryData);
        if (queryData) {
          url = url + '?' + queryData;
          console.log(url);
        }
        return $http.get(url);
      },
      getOrder: function(orderId) {
        return $http.get(ENV.serverURL + ENDPOINT + 'order/' + orderId);
      },
      updateInfo: function(info) {
        var url = ENV.serverURL + ENDPOINT + 'updateInfo/';

        return $http.post(url, info);
      },
      getDeliveryCharge: function() {
        var deferred = $q.defer();
        var query = new Parse.Query('UserKeys');
        query.equalTo('brand', ENV.brand);
        query.first().then(function(key) {
          if (key) {
            deferred.resolve(key.get('deliveryCharge'));
          } else {
            deferred.resolve(100);
          }
        }, function(error) {
          deferred.reject(error);
        });
        return deferred.promise;
      },
      updateCost: function(cost) {
        return $http.post(ENV.serverURL + ENDPOINT + 'updateCost', cost);
      },
      changeQuantity: function(mode, quantity) {
        var localCart = parseFloat(localStorageService.get('cart'));
        console.log('Mode is ' + mode + ' Quantity is ' + quantity);
        var newQuantity = 0;
        if (localCart) {
          newQuantity = localCart + quantity;
        } else {
          newQuantity = quantity;
        }

        switch (mode) {
          case 'new':
            localStorageService.set('cart', quantity);
            break;
          case 'add':
            localStorageService.set('cart', newQuantity);
            break;
        }

      }
    };
  });
