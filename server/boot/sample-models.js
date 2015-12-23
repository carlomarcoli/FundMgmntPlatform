module.exports = function(app) {
  var User = app.models.Customer;


  User.create([
    {username: 'Carlo', email: 'carlo@email.com', password: 'password', investorId: '1'},
    {username: 'Gary', email: 'gary@email.com', password: 'password', investorId: '2'},
    {username: 'James', email: 'james@email.com', password: 'password', investorId: '3'},
  ], function(err, users) {
    if (err) throw err;

    console.log('Created users:', users);

  });
};
