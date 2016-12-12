var mysql = require("mysql");
var connection = null;
var config = null;
exports.createConnection = function (cfg) {
  connection = mysql.createConnection(cfg);
  config = cfg;
  return connection;
}

exports.findOne = function (tableName, conditions, callback) {


  if (typeof conditions == "function") {
    callback = conditions;
  } else {
    var sb = [];
    sb.push(setSelect(conditions, tableName));
    sb.push(setConditions(conditions));
  }

  console.log(sb.join(' '));

  return connection.query(sb.join(' '), callback);
}
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
  sb.push("select * from ");
  sb.push(tableName);
  if (conditions['fields'] && conditions['fields'].length > 1) {
    sb = [];
    sb.push("select");
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
