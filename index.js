var mysql = require("mysql");
var extend = require('extend');

var connection = null;
var config = null;

exports.createConnection = function (cfg) {
  cfg = extend({multipleStatements: true}, cfg);
  connection = mysql.createConnection(cfg);
  config = cfg;
  return connection;
};

exports.findOne = function (tableName, conditions, callback) {

  var sb = [];
  if (typeof conditions == "function") {
    callback = conditions;
    conditions = {};
  }

  sb.push(setSelect(conditions, tableName));
  sb.push(setConditions(conditions));
  console.log('find one: ' + sb.join(' '));

  return connection.query(sb.join(' '), function (err, rows, fields) {
    if (rows.length > 1) {
      throw 'more than one found';
    }
    callback.call(this, err, rows, fields);
  });
};

exports.findAll = function (tableName, conditions, callback) {
  var sb = [];
  if (typeof conditions == "function") {
    callback = conditions;
    conditions = {};
  }

  sb.push(setSelect(conditions, tableName));
  sb.push(setConditions(conditions));
  if (conditions['orders'] && conditions['orders'].length > 0) {
    var order = [];
    order.push("select * from (");
    order.push(sb.join(' '));
    order.push(") temp_order");
    order.push(setOrders(conditions));
    sb = order;
  }
  sb.push(setPager(conditions));
  if (conditions.pager && conditions.pager.length > 0) {
    sb.push("; select found_rows() total;");
  }
  console.log('find all: ' + sb.join(' '));
  return connection.query(sb.join(' '), function (err, rows, fields) {
    callback(err, rows, fields);
  });
};

/**
 *
 * @param tableName
 * @param object
 * @param callback
 * @returns
 */
exports.create = function (tableName, object, callback) {
  var sb = [];
  if (object === undefined || object == '') {
    throw "the object must not be null";
  }
  sb.push("insert into");
  sb.push(tableName);
  sb.push("set");
  sb.push(setCreate(object));
  console.log('create : ' + sb.join(' '));

  return connection.query(sb.join(' '), callback);
};

exports.delete = function (tableName, conditions, callback) {
  var sb = [];
  if (conditions === undefined || conditions == '') {
    throw "the conditions must not be null";
  }
  sb.push("delete from");
  sb.push(tableName);
  conditions = {where: conditions};
  sb.push(setConditions(conditions));
  console.log('delete : ' + sb.join(' '));

  return connection.query(sb.join(' '), callback);
};

exports.update = function (tableName, conditions, callback) {
  var sb = [];
  if (conditions === undefined || conditions == '') {
    throw "the conditions must not be null";
  }
  sb.push("update");
  sb.push(tableName);
  sb.push("set");
  sb.push(setCreate(conditions.values));
  sb.push(setConditions(conditions));
  console.log('updaet : ' + sb.join(' '));

  return connection.query(sb.join(' '), callback);
};

/**
 * sql select fields
 *
 * @param conditions
 *  fields: Array
 *    field: String
 *    alias: String
 *
 *  example:
 *    {
 *      fields:[
 *        {field:'user'},
 *        {field:'password',alias:'pwd'}
 *      ]
 *    }
 *    select user, password 'pwd' from table_name
 *
 *
 *    {
 *      fields:{}
 *    }
 *
 *    select * from table_name
 *
 * @param tableName
 * @returns {string}
 */
function setSelect(conditions, tableName) {
  var sb = [];
  sb.push("select");
  if (conditions.pager && conditions.pager.length > 0) {
    sb.push("sql_calc_found_rows");
  }
  sb.push("* from");
  sb.push(tableName);

  if (conditions['fields'] && conditions['fields'].length > 0) {
    sb = [];
    sb.push("select");
    if (conditions.pager && conditions.pager.length > 0) {
      sb.push("sql_calc_found_rows");
    }
    for (var item in conditions['fields']) {
      var item = conditions['fields'][item];
      sb.push(item.field);
      sb.push(item.alias);
      sb.push(",")
    }
    sb.pop(sb.length - 1);
    sb.push("from");
    sb.push(tableName);
  }

  return sb.join(' ');
}

/**
 * sql condtions
 * @param conditions
 *  where:
 *    field: the column name in database
 *    value: the real value of the column
 *    oprator: =, [=,like, >, <, <>]
 *      the oprator for the column statement,
 *
 *    func: null, [md5, sum ...]
 *    logical: or, [and, or]
 *
 *  example:
 *    {
 *      'where':[
 *        {field:'user',value:'admin'},
 *        {field:'password',value:'admin',func:'md5', logical:'and'},
 *        {field:'password',value:'admin',logical:'or'}
 *      ]
 *    }
 *
 *    select * from table_name where 1 = 0 or user = 'admin' and password = md5('admin') or password = 'admin'
 *
 *    {
 *      'where':[]
 *    }
 *
 *    select from table_name 1 = 0
 *
 * @returns {string}
 *
 * example:
 *
 */
function setConditions(conditions) {
  var sb = [];

  if (conditions['where']) {
    sb.push('where 1 = 0')
    for (var item in conditions['where']) {
      var item = conditions['where'][item];
      if (undefined == item.logical) {
        item.logical = 'or';
      }
      sb.push(item.logical);

      sb.push('`' + item.field + '`');

      if (undefined == item.oprator) {
        item.oprator = '='
      }
      sb.push(item.oprator);

      if (item.func) {
        sb.push(item.func);
        sb.push('("' + item.value + '")');
      } else {
        sb.push('"' + item.value + '"');
      }
    }
  }

  return sb.join(' ');
}

/**
 *
 * @param conditions
 *
 *  {
 *    pager:{
 *      page: 1,// by default
 *      length: 10000, // by default
 *    }
 *  }
 *
 */
function setPager(conditions) {
  var sb = [];
  if (conditions.pager && conditions.pager.length > 0) {
    var pager = extend({page: 1, length: 10000}, conditions.pager);
    sb.push("limit");
    sb.push((pager.page - 1) * pager.length);
    sb.push(",");
    sb.push(pager.length);
  }
  return sb.join(" ");
}

/**
 *
 * @param conditions
 * @returns {string}
 */
function setOrders(conditions) {
  var sb = [];
  if (conditions['orders'] && conditions['orders'].length > 0) {
    sb.push("order by");
    for (var item in conditions['orders']) {
      var item = conditions['orders'][item];
      item = extend({direction: 'asc'}, item);
      if (item.field === undefined || item.field === '') {
        throw "the order filed can not be null";
        continue;
      }
      sb.push(item.field);
      sb.push(item.direction);
      sb.push(",")
    }
    sb.pop(sb.length - 1);
  }

  return sb.join(' ');
}


function setCreate(object) {
  var sb = [];
  for (var item in object) {
    var value = object[item];
    sb.push(item);
    sb.push("=");
    if (typeof value === 'object') {
      if (value.func) {
        sb.push(value.func);
        sb.push("(");
        sb.push('"' + value.value + '"');
        sb.push(")");
      }
    } else {
      sb.push('"' + value + '"');
    }
    sb.push(",");
  }
  sb.pop(sb.length - 1);
  return sb.join(" ");
}