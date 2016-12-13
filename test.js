var mysqllib = require('mysql-lib');
var config = {
  "port": 3306,
  "host": "localhost",
  "user": "root",
  "password": "123456",
  "database": "nodeapi"
};

mysqllib.createConnection(config);
mysqllib.findOne('user', {where: [{field: 'account', value: 'admin'}]}, function (err, rows, fields) {
  if (err) throw err;
  //console.log(rows);
});

/*mysqllib.findOne('user', function (err, rows, fields) {
 if (err) throw err;
 console.log(rows);
 });*/

/**
 * mysqllib.findAll by pager test
 */
mysqllib.findAll('user', {pager: {length: 10, page: 1}}, function (err, rows, fields) {
  if (err) throw err;
  //console.log(rows);
});

mysqllib.findAll('user', {pager: {length: 10, page: 2}}, function (err, rows, fields) {
  if (err) throw err;
  //console.log(rows);
});

/**
 * mysqllib.findAll by order test
 */
mysqllib.findAll('user', {pager: {length: 10, page: 2}, orders: [{field: 'userid'}]}, function (err, rows, fields) {
  if (err) throw err;
  //console.log(rows);
});

/**
 * mysqllib.delete
 */
mysqllib.delete("user", [{field: 'userid', value: 'create1'}]);

/**
 * mysqllib.create
 */
mysqllib.create("user", {userid: 'create1', account: 'create1', password: {'value': '1', func: 'md5'}});

/**
 * mysqllib.update
 */
mysqllib.update("user", {
  values: {account: 'create2'},
  where: [{field: 'userid', value: 'create1'}]
});