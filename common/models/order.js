module.exports = function(Order) {

  //Start Submit Order
  function submitOrder(investorId, noOfUnits, price, product, cback) {
    //Setting up variables
    var response;
    var mockBackEnd = Order.app.dataSources.InvestorAccounts;
    var transactionType = "Order Transaction";
    var currency = "GBP";
    var todaysDate = new Date();
    var balance = 0;
    var tradingAccountId;
    var investorAccountId;

    //Chain REST CALLs using Promises to  Get Investor Accounts, Get Trading Balance, make payment, then Update Trading Account then place order
    mockBackEnd.getInvestorAccounts(investorId)
    .then(function(result){
          tradingAccountId = result.tradingAccountid;
          investorAccountId = result.id;
          result = JSON.stringify(result);
          return mockBackEnd.getTradingAccountBalance(tradingAccountId);
    }).then(function(tradingAccount){
          var oldBalance = Number(tradingAccount.balance);
          var newBalance = oldBalance - Number(price);
          if(newBalance < 0) { throw (new Error('Not enough funds - transaction was cancelled'));}
          console.log('HERE 1');
          balance = newBalance
          tradingAccount = JSON.stringify(tradingAccount);
          return mockBackEnd.makePayment(price, transactionType, currency, todaysDate)
    }).then(function(result){
          return mockBackEnd.updateTradingAccount(balance, tradingAccountId, investorAccountId);
    }).then(function(tradingAccountUpdated) {
          tradingAccountUpdated = JSON.stringify(tradingAccountUpdated);
          return mockBackEnd.postOrder(product, noOfUnits);
    }).then(function(result){
      console.log('HERE 2');
          cback(null, 'Transaction Complete: Thanks for your order of ' + noOfUnits + ' of ' + product + '. Your new balance is £' + balance);
    }).catch (function(err){
            return cback(err, null );

    });

  }; //End Submit Order


    ///Start Place Order
    Order.placeOrder = function(token, noOfUnits, price, product, cb) {

      //Setting up variables
      var response;
      var userId;
      var cust = Order.app.models.Customer;


     cust.relations.accessTokens.modelTo.findById(token)
      .then(function(accessToken){
            if ( ! accessToken)
                {throw (new Error('Invalid token, please log-on'));}
            else
                { return cust.findById(accessToken.userId);}
      }).then(function(customer){
            if ( ! customer)
                {throw (new Error('Unable to lookup profile'));}
            else
            {
              return submitOrder(customer.investorId, noOfUnits, price, product, function(err, result) {
                  if(err){
                    cb(err, null);
                  }
                  else {
                    cb(null, result);
                  }
                }
            );
              }
      }).catch (function(err){
            cb(err, null);
      });

    };//End Place Order


    //Set up remote method
    Order.remoteMethod(
        'placeOrder',
        {
          http: {path: '/placeOrder', verb: 'post'},
          accepts: [
            {arg: 'token', type: 'string'},
            {arg: 'noOfUnits', type: 'number'},
            {arg: 'price', type: 'number'},
            {arg: 'product', type: 'string'}
                  ],
          returns: {arg: 'response', type: 'string'}
        }
      );


      ///Start Get Balance
      Order.getBalance = function(token, cb) {

        //Setting up variables
        var response;
        var userId;
        var cust = Order.app.models.Customer;
        var mockBackEnd = Order.app.dataSources.InvestorAccounts;
        var balance = 0;
        var tradingAccountId;
        var investorAccountId;

       cust.relations.accessTokens.modelTo.findById(token)
        .then(function(accessToken){
              if ( ! accessToken)
                  {throw (new Error('Invalid token, please log-on'));}
              else
                  { return cust.findById(accessToken.userId);}
        }).then(function(customer){
              if ( ! customer)
                  {throw (new Error('Unable to lookup profile'));}
              else
              {
                  return mockBackEnd.getInvestorAccounts(customer.investorId)
                }
        }).then(function(result){
              tradingAccountId = result.tradingAccountid;
              investorAccountId = result.id;
              result = JSON.stringify(result);
              return mockBackEnd.getTradingAccountBalance(tradingAccountId);
        }).then(function(result){
              cb (null, result.balance);
        }).catch (function(err){
              cb(err, null);
        });

      };//End Get Balance


      //Set up remote method
      Order.remoteMethod(
          'getBalance',
          {
            http: {path: '/getBalance', verb: 'post'},
            accepts: [
              {arg: 'token', type: 'string'}
                    ],
            returns: {arg: 'balance', type: 'string'}
          }
        );


      ///Start getPastOrders
      Order.getPastOrders = function(token, cb) {

        //Setting up variables
        var mockBackEnd = Order.app.dataSources.InvestorAccounts;

       mockBackEnd.getOrders()
        .then(function(orders){
            cb(null, orders);
        }).catch (function(err){
              cb(err, null);
        });

      };//End getPastOrders


      //Set up remote method
      Order.remoteMethod(
          'getPastOrders',
          {
            http: {path: '/getPastOrders', verb: 'post'},
            accepts: [
              {arg: 'token', type: 'string'}
                    ],
            returns: {arg: 'orders', type: 'JSON'}
          }
        );



};//End
