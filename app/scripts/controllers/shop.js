'use strict';
/**
 * @ngdoc function
 * @name chocoholicsApp.controller:ShopCtrl
 * @description
 * # ShopCtrl
 * Controller of the chocoholicsApp
 */
angular.module('chocoholicsApp')
  .controller('ShopCtrl', function($scope, $rootScope, productService, orderService, localStorageService, accountService) {
    //variables
    var vm = this;
    var items = [];
    var orderItemId;
    var orderId;
    var totalQuantity;
    //variable definitions
    this.characters = 0;
    // to get div lenght
    this.length = 0;

    $scope.$watch('totalQuantity', function(newValue) {
      $scope.$emit('totalQuantity', newValue);
    });
    // to affix category
    $('#pillAffix').affix({
      offset: {
        top: 10,
      }
    });
    //to maintain width of category
    $(document).on('affix.bs.affix', '.content', function() {
      $(this).width($(this).width());
    });
    // to maintain position of category
    $('#pillAffix').affix('checkPosition');

    this.loadImages = function(images, index) {
      productService.getImages(images[0].objectId).then(function(image) {
          vm.products[index].image = image;
          console.log(vm.products[index]);
        })
        .catch(function(error) {
          console.error(error);
          $scope.$emit('handleError', { error: error });
        });
    };

    /**
     * Function to load the products on scroll and on page init
     * @param  {String} category Category of the product, should the user oclick on a category
     * @return {void}          
     */
    this.loadMore = function(category) {
      if (vm.busy) {
        return;
      }
      vm.busy = true;
      productService.getProducts(vm.counter, 12, null, category)
        .then(function(response) {
          // console.log(response.data);
          angular.forEach(response.data, function(element, index) {
            element.quantity = 0;
            vm.products.push(element);
            if (element.images && element.images.length) {
              vm.loadImages(element.images, index);
            }
            vm.busy = false;
          });
          if (orderId) {
            return orderService.getOrderItems(orderId);
          }
        })
        .then(function(response) {
          if (response) {
            var items = response.data;
            _.each(items, function(item) {
              _.each(vm.products, function(product) {
                if (product.id === item.itemId) {
                  product.quantity = item.quantity;
                  product.addedId = item.id;
                  console.log('itemid' + product.addedId);
                  // FOR IMAGES
                  // vm.loadImages(vm.product.images);
                }
              });
            });
          }
          // console.log(vm.products);
        })
        .catch(function(error) {
          $scope.$emit('handleError', { error: error.data });
          console.error(error);
        });
      vm.counter++;
      // console.log('entering page number ' + vm.counter);
    };

    var modifyItem = function(index) {
      if (vm.products[index].quantity !== 0) {
        //  increment the item count
        vm.products[index].quantity++;
        orderService.updateOrderItem(vm.products[index].addedId, vm.products[index].quantity, null, null, null, orderId)
          .then(function(response) {
            console.log(response);
            console.log(vm.products[index].quantity);
            $scope.totalQuantity = $scope.totalQuantity + 1;
            localStorageService.set('total', vm.total);
            vm.products[index].adding = false;
          }).catch(function(error) {
            $scope.$emit('handleError', { error: error });
            console.log(error);
            vm.products[index].adding = false;
          });
      } else {
        orderService.addOrderItem(items)
          .then(function(response) {
            // console.log(response.data);
            vm.products[index].quantity++;
            orderItemId = response.data;
            vm.products[index].addedId = orderItemId;
            return orderService.linkOrder(orderId, orderItemId);
          })
          .then(function(response) {
            console.log(response);
            $scope.totalQuantity = $scope.totalQuantity + 1;
            vm.products[index].adding = false;
            // localStorageService.set('total',vm.total);
          })
          .catch(function(error) {
            $scope.$emit('handleError', { error: error });
            console.error(error);
            vm.products[index].adding = false;
          });
      }
    };

    /**
     * Function to add item to the cart
     * @param {Integer} index Index of the product in the list
     */
    this.addItem = function(index) {
      // For the loader animation and button disabling
      vm.products[index].adding = true;

      // By default add one qty of an item, with each press, in case the product is being added for the first time
      var item = {
        itemId: vm.products[index].id,
        quantity: 1
      };

      // Array of items to be added
      items = [];

      // pushed the item in the array created above
      items.push(item);

      // Modify the item props
      modifyItem(index);

    };

    /**
     * function to get the order items if an order exists
     * @param  {String} orderId Order ID stored in the localStorage
     * @return {void}         
     */
    this.getItems = function(orderId) {
      $scope.totalQuantity = 0;
      orderService.getOrderItems(orderId)
        .then(function(response) {
          //console.log(response);
          _.each(response.data, function(orderItem) {
            $scope.totalQuantity += orderItem.quantity;
            if (orderItem.quantity === 0) {
              vm.showQuantity = false;
            } else {
              vm.showQuantity = true;
            }
          });
          $scope.$emit('totalQuantity', totalQuantity);
        }).catch(function(error) {
          $scope.$emit('handleError', { error: error });
          console.log(error);
        });
    };


    /**
     * Function to add items when user is logged out
     * @param {Integer} index Index of the product in the list
     */
    this.addItemLoggedOut = function(index) {
      vm.products[index].adding = true;
      var item = {
        itemId: vm.products[index].id,
        quantity: 1
      };
      items = [];
      items.push(item);
      console.log(vm.products[index]);
      if (orderId) {
        modifyItem(index);
      } else {
        console.log('else no order id');
        orderService.createOrder()
          .then(function(response) {
            console.log('create order');
            vm.products[index].quantity = 1;
            orderId = response.data.objectId;
            localStorageService.set('id', orderId);
            return orderService.addOrderItem(items);
          }).then(function(response) {
            console.log('add order item');
            vm.products[index].quantity++;
            orderItemId = response.data;
            vm.products[index].addedId = orderItemId;
            return orderService.linkOrder(orderId, orderItemId);
          })
          .then(function(response) {
            console.log('link order');
            console.log(response);
            $scope.totalQuantity = $scope.totalQuantity + 1;
            vm.products[index].adding = false;
            // localStorageService.set('total',vm.total);
          })
          .catch(function(error) {
            $scope.$emit('handleError', { error: error });
            console.error(error);
            vm.products[index].adding = false;
          });
      }
    };


    this.showCategory = function(category) {
      vm.products = [];
      vm.counter = 0;
      vm.loadMore(category);
    };

    this.getCategory = function() {
      vm.categories = [];
      accountService.getCategories()
        .then(function(response) {
          console.log(response);
          _.each(response.data, function(element) {
            vm.categories.push(element);
          });
        })
        .catch(function(error) {
          $scope.$emit('handleError', { error: error });
          console.error(error);
        });
    };

    // Init the page by calling products and populating them
    this.pre = function() {

      vm.imageOptions = {
        nolazy: true,
        background: true,
        imgAttrs: [{
          class: 'img-responsive animated fadeIn'
        }]
      };

      $('#navPillDiv').width($('#categoryNav').width() * 5);
      //to set tabs as active for big devices

      vm.name = localStorageService.get('name');
      // To check if user logged in
      if (vm.name) {
        vm.loggedIn = true;
      } else {
        vm.loggedIn = false;
      }
      vm.counter = 0;
      vm.busy = false;
      vm.products = [];
      $scope.totalQuantity = 0;
      if (localStorageService.get('id')) {
        orderId = localStorageService.get('id');
      }

      vm.loadMore();
      vm.getCategory();

      if (orderId) {
        vm.getItems(orderId);
      }

    };


    this.pre();

  });
