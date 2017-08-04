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
var session = driver.session();


//awal======================
app.get('/wooapi/getdata',function (req,res){

  var WooCommerce = new WooCommerceAPI({
    url: 'http://localhost/wordpress',
    consumerKey: 'ck_23ede9377f475e69b343eb4a33455c5ee6f70438',
    //consumerKey: req.query.ck,
    //consumerSecret: req.query.cs,
    consumerSecret: 'cs_be343b8fdd9d29f89ffeeaa954c25c0a8a08cb95',
    wpAPI: true,
    version: 'wc/v1'
  });

  WooCommerce.get('customers', function(err, data, response) {
    // console.log(response);
    dataCustomer(WooCommerce, data.headers["x-wp-total"], data.headers["x-wp-totalpages"], req);
    res.end('It worked!');
  });

});

//==================================
function dataCustomer(WooCommerce, total, pages, req){
  var token = req.query.token+"_cust";
  var tc = req.query.tc;
  var total2 = parseInt(total, 10);
  // console.log(total2);
  var offset = tc; //nanti diambil banyak data terakhir
  for (var i = offset; i < total2; i+=10) {
    // console.log(i);
    WooCommerce.get("customers?orderby=id&order=asc&offset="+i, function(err, data, response) {
      // console.log(response);
      var file = token+".json";

      fs.stat( file, function(err, stat) {
        if ( err && err.code == 'ENOENT' ) {
          fs.writeFile( file, "\n" );
        }
      } );

      var obj_baru = JSON.parse(response);
      // console.log(obj_baru);
      var isi = fs.readFileSync(file).toString( 'utf-8' );
      // console.log(isi);
      var arr = isi.length ? JSON.parse( isi ) : {customers:[]};

      for (i=0;i<obj_baru.length;i++){

        arr['customers'].push( obj_baru [i] );
      }
      // console.log(arr);
      jsonfile.writeFileSync( file, arr );//write json
      addCustomer(token);

    } );

  }
  // console.log(token);


  //get data produk
}

//======================================
function addCustomer(file){
  // console.log(file);
  session
  .run('WITH "http://localhost/ta/nodemovies/'+file+'.json" AS url CALL apoc.load.json(url) YIELD value UNWIND value.customers AS q MERGE (customer:Customers {idcust:q.id}) ON CREATE SET customer.name = q.username')

  .then(function(result){
    getProduk(WooCommerce, req);
    session.close();
  })
  .catch(function(err){
    console.log(err);
  });
}

//======================================
function getProduk(WooCommerce, req){
  WooCommerce.get('products', function(err, data, response) {
    // console.log(response);
    dataProducts(WooCommerce, data.headers["x-wp-total"], data.headers["x-wp-totalpages"], req);
  });
}

//======================================
function dataProducts(WooCommerce, total, pages, req){
  var token = req.query.token+"_prod";
  var tp = req.query.tp;
  var total2 = parseInt(total, 10);
  // console.log(total2);
  var offset = tp; //nanti diambil banyak data terakhir
  for (var i = offset; i < total2; i+=10) {
    // console.log(i);
    WooCommerce.get("products?orderby=id&order=asc&offset="+i, function(err, data, response) {
      // console.log(response);
      var file = token+".json";

      fs.stat( file, function(err, stat) {
        if ( err && err.code == 'ENOENT' ) {
          fs.writeFile( file, "\n" );
        }
      } );

      var obj_baru = JSON.parse(response);
      // console.log(obj_baru);
      var isi = fs.readFileSync(file).toString( 'utf-8' );
      // console.log(isi);
      var arr = isi.length ? JSON.parse( isi ) : {products:[]};

      for (i=0;i<obj_baru.length;i++){

        arr['products'].push( obj_baru [i] );
      }
      // console.log(arr);
      jsonfile.writeFileSync( file, arr );//write json


    } );

  }
  addProducts(token);
}

//======================================
function addProducts(file){
  session
  .run('WITH "http://localhost/ta/nodemovies/'+file+'.json" AS url CALL apoc.load.json(url) YIELD value UNWIND value.products AS p MERGE (product:Products {idprod:p.id}) ON CREATE SET product.name = p.title')
  .then(function(result){
    getOrders(WooCommerce, req);
    session.close();
  })

  .catch(function(err){
    console.log(err);
  });
}

//======================================
function dataOrders(WooCommerce, total, pages, req){
  var token = req.query.token+"_ord";
  var to = req.query.to;
  var total2 = parseInt(total, 10);
  // console.log(total2);
  var offset = to; //nanti diambil banyak data terakhir
  for (var i = offset; i < total2; i+=10) {
    // console.log(i);
    WooCommerce.get("orders?orderby=id&order=asc&offset="+i, function(err, data, response) {
      // console.log(response);
      var file = token+".json";

      fs.stat( file, function(err, stat) {
        if ( err && err.code == 'ENOENT' ) {
          fs.writeFile( file, "\n" );
        }
      } );

      var obj_baru = JSON.parse(response);
      // console.log(obj_baru);
      var isi = fs.readFileSync(file).toString( 'utf-8' );
      // console.log(isi);
      var arr = isi.length ? JSON.parse( isi ) : {orders:[]};

      for (i=0;i<obj_baru.length;i++){

        arr['orders'].push( obj_baru [i] );
      }
      // console.log(arr);
      jsonfile.writeFileSync( file, arr );//write json
      addRel(token);
      addSimil(req.query.token);
    } );

  }


}
function getOrders(WooCommerce, req){
  WooCommerce.get('orders', function(err, data, response) {
    // console.log(response);
    dataOrders(WooCommerce, data.headers["x-wp-total"], data.headers["x-wp-totalpages"], req);
  });
}

//=======================
function addSimil(token){
  session
  .run('MATCH (u1:Customers)-[x:BUY]-> (p:Products{token:{tokenParam}})<-[y:BUY]-(u2:Customers{token:{tokenParam}}) WITH count(p) AS kuantitas, u1.name AS user1, u2.name AS user2, u1, u2, collect((x.buy-y.buy)^2) AS buy, collect(p.name) AS product WITH kuantitas, product, u1, u2, buy MERGE (u1)-[s:Similarity]->(u2) SET s.similarity =1-(SQRT(reduce(total=0.0, k in extract(i in buy | i/kuantitas) | total+k))/4)',{tokenParam:token})
  .then(function(result){

    session.close();
  })

  .catch(function(err){
    console.log(err);
  });
}
//=============================
function addRel(file){
  session
  .run('WITH "http://localhost/ta/nodemovies/'+file+'.json" AS url CALL apoc.load.json(url) YIELD value UNWIND value.products.line_items AS q UNWIND value.customers.customer AS c match (a:Customers {idcust:c.id}) match (b:Products {idprod:q.product_id}) MERGE (a)-[:BUY{quantity:q.quantity}]->(b)')
  .then(function(result){

    session.close();
  })

  .catch(function(err){
    console.log(err);
  });

}



app.listen(3000);
console.log('Server started on port 3000');

//module.exports = tes;
