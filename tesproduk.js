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


//checkshop ==============================
app.get('/wooapi/updatedataprodonly',function(req,res){

  var token = req.query.token;
  var shopArr = [];
  session
  .run('MATCH (c:Customers)-[r:BUY]->(p:Products) WHERE c.token = {tokenParam} AND p.token = {tokenParam} WITH SUM(r.rec_order) as p MATCH (n:Shop { token:{tokenParam}}) SET n.totalorder = p RETURN n',{tokenParam:token})
  .then(function(result){

      session
      .run('MATCH (n:Products{token:{tokenParam}}) WITH count(n) as p MATCH (n:Shop { token:{tokenParam}}) SET n.totalproduk = p RETURN n',{tokenParam:token})
      .then(function(result){

        session
        .run('MATCH (n:Customers{token:{tokenParam}}) WITH count(n) as p MATCH (n:Shop { token:{tokenParam}}) SET n.totalcust = p RETURN n',{tokenParam:token})
        .then(function(result){

          session
            .run('MATCH(n:Shop{token:{tokenParam}}) RETURN n',{tokenParam:token})
            .then(function(result){

              result.records.forEach(function (record){
                shopArr.push({
                  cs: record._fields[0].properties.cs,
                  ck: record._fields[0].properties.ck,
                  urlshop: record._fields[0].properties.urlshop,
                  totalproduk: record._fields[0].properties.totalproduk,
                  totalcust: record._fields[0].properties.totalcust,
                  totalorder: record._fields[0].properties.totalorder
                            });

                  });
                  console.log(shopArr[0]['cs']);
                  console.log(shopArr[0]['ck']);
                  console.log(shopArr[0]['urlshop']);
                  console.log(token);
                //  console.log(idcust);
                 console.log(shopArr[0]['totalproduk'].low);
                 console.log(shopArr[0]['totalcust'].low);
                 console.log(shopArr[0]['totalorder'].low);

          session.close();
       res.redirect('/wooapi/getdataprodonly?cs='+shopArr[0]['cs']+'&ck='+shopArr[0]['ck']+'&url='+shopArr[0]['urlshop']+'&token='+token+'&tp='+shopArr[0]['totalproduk'].low+'&tc='+shopArr[0]['totalcust'].low+'&to='+shopArr[0]['totalorder'].low)
          })

          .catch(function(err){
            console.log(err);
              });

                })

                .catch(function(err){
                  console.log(err);
            });

              })

              .catch(function(err){
                console.log(err);
          });
            })
            .catch(function(err){
              console.log(err);
            });

        });





//step1

app.get('/wooapi/getdataprodonly',function (req,res){

  var WooCommerce = new WooCommerceAPI({
  url: 'http://localhost/wordpress',
  //  url: req.query.url,
    consumerKey: 'ck_23ede9377f475e69b343eb4a33455c5ee6f70438',
    //consumerKey: req.query.ck,
    //consumerSecret: req.query.cs,
    consumerSecret: 'cs_be343b8fdd9d29f89ffeeaa954c25c0a8a08cb95',
    wpAPI: true,
    version: 'wc/v1'

  });
  WooCommerce.get('products', function(err, data, response) {
    // console.log(response);
    dataProducts(WooCommerce, data.headers["x-wp-total"], data.headers["x-wp-totalpages"], req, res);
  //res.end('It worked!');
  });

});

//step2
function dataProducts(WooCommerce, total, pages, req, res){
  var token = req.query.token+"_prod";
  //var token = "suatufile"
  var tp = req.query.tp;
  var total2 = parseInt(total,10);
  var offset = parseInt(tp); //nanti diambil banyak data terakhir
  for (var i = offset; i < total2 ; i+=10) {
    console.log(i);
    WooCommerce.get("products?orderby=id&order=asc&offset="+i, function(err, data, response) {

      var file = token+".json";

      fs.stat( file, function(err, stat) {
        if ( err && err.code == 'ENOENT' ) {
          fs.writeFileSync( file, "\n" );
        //  console.log( 'hi' );

        }

        var obj_baru = JSON.parse(response);
        var isi = fs.readFileSync(file).toString( 'utf-8' );

        var arr = isi.length > 1 ? JSON.parse( isi ) : {products:[]};
        //var arr = isi.length > 1 ? JSON.parse( isi ):[];
        //var arr = JSON.parse(isi);
        for (i=0;i<obj_baru.length;i++){

          arr['products'].push( obj_baru [i] );
          //arr.push( obj_baru [i] );
        }
        jsonfile.writeFileSync( file, arr );//write json
        addProducts(WooCommerce, token, req, res);
      } );



    } );

  }
  // console.log(token);
  //get data produk
}

//step3
function addProducts(WooCommerce,file,req, res){
  var token = req.query.token;
  session
  .run('WITH "http://localhost/ta/nodemovies/'+file+'.json" AS url CALL apoc.load.json(url) YIELD value UNWIND value.products AS p MERGE (product:Products {idprod:p.id}) ON CREATE SET product.name = p.name, product.price=p.price, product.token={tokenParam}',{tokenParam:token})

    .then(function(result){
      res.send('It worked!');
      //res.redirect('/wooapi/getdataordersmw?cs='+req.query.cs+'&ck='+req.query.ck+'&url='+req.query.urlshop+'&token='+req.query.token+'&tp='+req.query.tp+'&tc='+req.query.tc+'&to='+req.query.to)
      session.close();
  })
    .catch(function(err){
    console.log(err);
  });
}


app.listen(3000);
console.log('Server started on port 3000');
