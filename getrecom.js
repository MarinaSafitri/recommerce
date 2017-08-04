var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var r=require("request");
var neo4j = require('neo4j-driver').v1;
var fs = require('fs');
var WooCommerceAPI = require('woocommerce-api');

var jsonfile = require('jsonfile');
var app = express();
var urlcommerce = "http://localhost/wordpress/";


//View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j','neo4jneo4j'));
// var driver = neo4j.driver('localhost:7474', neo4j.auth.basic('neo4j','neo4jneo4j'));
var session = driver.session();


// fix initial registration
app.get('/wooapi/getrecom',function(req,res){
  var token = req.query.token;
  var idcust = req.query.idcust;
  var idcust2= parseInt(idcust, 10);
var productArr = [];
    session
      .run('MATCH (u2:Customers{token:{tokenParam}})-[r:BUY]->(p:Products{token:{tokenParam}}), (u2:Customers)-[s:SIMILARITY]-(u1:Customers {idcust:'+idcust+'}) WHERE NOT((u1)-[:BUY]->(p)) WITH p, u2, s.value AS similarity ORDER BY similarity,r.ordervalue DESC return distinct p LIMIT 6',{tokenParam:token})
      .then(function(result){
      //  res.send(result);
        result.records.forEach(function (record){
        productArr.push({
            idprod: record._fields[0].properties.idprod,
            name: record._fields[0].properties.name,
            token:record._fields[0].properties.token


          });
          //console.log (productArr);

        });
        res.send(productArr);

        //session.close();
      })

      .catch(function(err){
        console.log(err);
      });


});





app.listen(3000);
console.log('Server started on port 3000');

module.exports = app;
