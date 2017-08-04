var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var r=require("request");
var neo4j = require('neo4j-driver').v1;
var fs = require('fs');
var WooCommerceAPI = require('woocommerce-api');
var request = require( 'request' );

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


// fix render page.ejs
app.get('/home', function (req, res){
  res.render('home')
})
app.get('/login', function (req, res){
  res.render('login')
})
app.get('/loginshop', function (req, res){
  res.render('loginshop')
})
app.get('/register', function (req, res){
  res.render('register')
})
app.get('/register2', function (req, res){
  res.render('register2')
})

app.get('/shop', function (req, res){
  res.render('shop', {req: req})
})

app.get('/dashboard', function (req, res){
  res.render('./dashboard/dashboard',{req: req})
})

app.get('/user', function (req, res){
  res.render('./dashboard/user',{req: req})
})

app.get('/table', function (req, res){
  request.get( {
    url: 'http://localhost:3000/json',
    json: true,
    headers: { 'User-Agent': 'request' }
  }, ( err, res2, data ) => {
    //console.log(data.Product[0].nameprod);
    res.render('./dashboard/table', { req: req, data: data } )
  } )
})



//=========================================================================register new member=============================================

app.post('/member/add',function(req,res){
  var membername = req.body.membername;
  var email = req.body.email;
  var password = req.body.password;


    session
      .run('CREATE(n:Member{membername:{membernameParam}, email:{emailParam}, password:{passwordParam}}) RETURN n.email',{membernameParam:membername, emailParam:email, passwordParam:password})
      .then(function(result){
        res.redirect('/');

        session.close();
      })

      .catch(function(err){
        console.log(err);
      });

    res.redirect('/login');
});

//=========================================================================login member=============================================
app.post('/member/match',function(req,res){
  var email = req.body.email;
  var password = req.body.password;
  var memberArr = [];
 console.log(email);
 console.log(password);

    session
      .run('MATCH(n:Member{email:{emailParam}, password:{passwordParam}}) RETURN n',{ emailParam:email, passwordParam:password})
      .then(function(result){

       result.records.forEach(function (record){
        memberArr.push({
          membername: record._fields[0].properties.membername
        });
      });

      if ( typeof memberArr[0] !== 'undefined' ) res.redirect('/loginshop?membername='+memberArr[0]['membername']);
      else res.end( 'user / password salah' );
      // console.log(memberArr[0]['cs']);

    })
    .catch(function(err){
      console.log(err);
    });

});

//=========================================================================login shop=============================================
app.post('/member/matchshop',function(req,res){
  var token = req.body.token;
  var shopArr = [];

    session
      .run('MATCH(n:Shop{token:{tokenParam}})<-[r:OWN]-(m:Member) RETURN m,n',{ tokenParam:token})
      .then(function(result){

       result.records.forEach(function (record){
        shopArr.push({
          token: record._fields[1].properties.token,
          urlshop: record._fields[1].properties.urlshop,
          totalproduk: record._fields[1].properties.totalproduk,
          totalcust: record._fields[1].properties.totalcust,
          totalorder: record._fields[1].properties.totalorder,
          membername: record._fields[0].properties.membername
        });
      });
      //console.log(memberArr[0]['cs']);
      res.redirect('/dashboard?token='+shopArr[0]['token']+'&membername='+shopArr[0]['membername']+'&url='+shopArr[0]['urlshop']+'&tp='+shopArr[0]['totalproduk']+'&tc='+shopArr[0]['totalcust']+'&to='+shopArr[0]['totalorder']);

    })
    .catch(function(err){
      console.log(err);
    });

});

//=========================================================================register shop=============================================
app.post('/shop/add',function(req,res){
  var membername = req.body.membername;
  var urlshop = req.body.urlshop;
  var ck = req.body.ck;
  var cs = req.body.cs;
  var token =req.body.randomfield;
  var type = 'woocommerce';
  var myshopArr = [];

    session
      .run('CREATE(n:Shop{urlshop:{urlshopParam}, ck:{ckParam}, cs:{csParam}, token:{tokenParam}, type:1}) RETURN n',{urlshopParam:urlshop, ckParam:ck, csParam:cs, tokenParam:token})
      .then(function(result){

        result.records.forEach(function (record){
        myshopArr.push({
          token: record._fields[0].properties.token
        });
      });

      session
      .run('MATCH (a:Member),(b:Shop) WHERE a.membername ={membernameParam} AND b.token = {tokenParam} CREATE (a)-[r:OWN]->(b) RETURN r',{membernameParam:membername, tokenParam:token})
      .then(function(result){

        session.close();
      })

      .catch(function(err){
        console.log(err);
  });
      //console.log(myshopArr[0]['cs']);
      res.redirect('/dashboard?token='+myshopArr[0]['token']+'&membername='+membername);


    })
    .catch(function(err){
      console.log(err);
    });

});


//=========================================================================display json product=============================================
app.get('/json2', function (req, res){
  session
    .run('MATCH(n:Products) RETURN n order by id(n)desc LIMIT 10')
    .then(function(result){
      var productArr = [];
      result.records.forEach(function (record){
        productArr.push({
          idprod: record._fields[0].identity.low,
          name: record._fields[0].properties.name,
          price: record._fields[0].properties.price
        });
      });
       res.json(productArr);
    });

});
//
//
// app.get('/jsoncust', function (req, res){
//   session
//     .run('MATCH(n:Customers) RETURN n order by id(n)desc LIMIT 10')
//     .then(function(result){
//       var customerArr = [];
//       result.records.forEach(function (record){
//         customerArr.push({
//           idcust: record._fields[0].identity.low,
//           name: record._fields[0].properties.name
//         });
//       });
//        res.json(customerArr);
//     });
//
// });

app.get('/json', function (req, res){
  session
    .run('MATCH(n:Products) RETURN n order by id(n)desc LIMIT 10')
    .then(function(result){
      var productArr = [];
      result.records.forEach(function (record){
        productArr.push({
          idprod: record._fields[0].identity.low,
          nameprod: record._fields[0].properties.name,
          price: record._fields[0].properties.price
        });
      });

      session
        .run('MATCH(n:Customers) RETURN n order by id(n)desc LIMIT 10')
        .then(function(result2){
          var customersArr = [];
          result2.records.forEach(function(record){
            customersArr.push({
              idcust: record._fields[0].identity.low,
              namecust: record._fields[0].properties.name
            });
          });
          res.json({
            Product: productArr,
            Customers: customersArr
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


//=========================================================================diplay product & customer in index=============================================

app.get('/', function (req, res){
  session
    .run('MATCH(n:Products) RETURN n')
    .then(function(result){
      var productArr = [];
      result.records.forEach(function (record){
        productArr.push({
          idprod: record._fields[0].identity.low,
          name: record._fields[0].properties.name,
          price: record._fields[0].properties.price
        });
      });

      session
        .run('MATCH(n:Customers) RETURN n')
        .then(function(result2){
          var customersArr = [];
          result2.records.forEach(function(record){
            customersArr.push({
              idcust: record._fields[0].identity.low,
              name: record._fields[0].properties.name
            });
          });
          res.render('index', {
            product: productArr,
            Customers: customersArr
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

//=============================================================get recommendation =================================================
app.get('/wooapi/getrecom',function(req,res){
  var start = new Date().getTime();
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
        var end = new Date().getTime();
        console.log(end - start);

        //session.close();
      })

      .catch(function(err){
        console.log(err);
      });


});


//==================================================================update on fly customer======================================================================
app.get('/wooapi/updatedatacustomeronly',function(req,res){

  var token = req.query.token;
  //var idcust = req.query.idcust;
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
                  //console.log(idcust);
                 console.log(shopArr[0]['totalproduk'].low);
                 console.log(shopArr[0]['totalcust'].low);
                 console.log(shopArr[0]['totalorder'].low);

          session.close();
       res.redirect('/wooapi/getdatacustonly?cs='+shopArr[0]['cs']+'&ck='+shopArr[0]['ck']+'&url='+shopArr[0]['urlshop']+'&token='+token+'&tp='+shopArr[0]['totalproduk'].low+'&tc='+shopArr[0]['totalcust'].low+'&to='+shopArr[0]['totalorder'].low)
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




//step 1
app.get('/wooapi/getdatacustonly',function (req,res){

  var WooCommerce = new WooCommerceAPI({
    url: 'http://localhost/wordpress',
    //url : req.query.url,
    consumerKey: 'ck_23ede9377f475e69b343eb4a33455c5ee6f70438',
    //consumerKey: req.query.ck,
    //consumerSecret: req.query.cs,
    consumerSecret: 'cs_be343b8fdd9d29f89ffeeaa954c25c0a8a08cb95',
    wpAPI: true,
    version: 'wc/v1'

  });
  WooCommerce.get('customers', function(err, data, response) {
    // console.log(response);
    dataCustomer(WooCommerce, data.headers["x-wp-total"], data.headers["x-wp-totalpages"], req,res);

  });

});

//step 2
function dataCustomer(WooCommerce, total, pages, req, res){
  var token = req.query.token+"_cust";
  //var token = "suatufile"
  var tc = req.query.tc;
  var total2 = parseInt(total,10);
  var offset = parseInt(tc); //nanti diambil banyak data terakhir
  for (var i = offset; i < total ; i+=10) {
    console.log(i);
    WooCommerce.get("customers?orderby=id&order=asc&offset="+i, function(err, data, response) {

      var file = token+".json";

      fs.stat( file, function(err, stat) {
        if ( err && err.code == 'ENOENT' ) {
          fs.writeFileSync( file, "\n" );
          console.log( 'hi' );

        }

        var obj_baru = JSON.parse(response);
        var isi = fs.readFileSync(file).toString( 'utf-8' );

        var arr = isi.length > 1 ? JSON.parse( isi ) : {customers:[]};
        //var arr = isi.length > 1 ? JSON.parse( isi ):[];
        //var arr = JSON.parse(isi);
        for (i=0;i<obj_baru.length;i++){

          arr['customers'].push( obj_baru [i] );
          //arr.push( obj_baru [i] );
        }
        jsonfile.writeFileSync( file, arr );//write json
        addCustomer(WooCommerce, token, req, res);
      } );



    } );

  }

}

//step 3
function addCustomer(WooCommerce,file,req, res){
  var token = req.query.token;
  session
    .run('WITH "http://localhost/ta/nodemovies/'+file+'.json" AS url CALL apoc.load.json(url) YIELD value UNWIND value.customers AS q MERGE (customer:Customers {idcust:q.id}) ON CREATE SET customer.name = q.username, customer.token={tokenParam}',{tokenParam:token})

    .then(function(result){
    res.send('it worked');
    session.close();
  })
    .catch(function(err){
    console.log(err);
  });
}



//==================================================================update on fly product======================================================================
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

}

//step3
function addProducts(WooCommerce,file,req, res){
  var token = req.query.token;
  session
  .run('WITH "http://localhost/ta/nodemovies/'+file+'.json" AS url CALL apoc.load.json(url) YIELD value UNWIND value.products AS p MERGE (product:Products {idprod:p.id}) ON CREATE SET product.name = p.name, product.price=p.price, product.token={tokenParam}',{tokenParam:token})

    .then(function(result){
      res.send('Product updated!');
      //res.redirect('/wooapi/getdataordersmw?cs='+req.query.cs+'&ck='+req.query.ck+'&url='+req.query.urlshop+'&token='+req.query.token+'&tp='+req.query.tp+'&tc='+req.query.tc+'&to='+req.query.to)
      session.close();
  })
    .catch(function(err){
    console.log(err);
  });
}

//==================================================================update on fly order======================================================================

app.get('/wooapi/updatedataorderonly',function(req,res){

  var token = req.query.token;
  var idcust = req.query.idcust;
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
                  console.log(idcust);
                 console.log(shopArr[0]['totalproduk'].low);
                 console.log(shopArr[0]['totalcust'].low);
                 console.log(shopArr[0]['totalorder'].low);

          session.close();
       res.redirect('/wooapi/getdataorderonly?cs='+shopArr[0]['cs']+'&ck='+shopArr[0]['ck']+'&url='+shopArr[0]['urlshop']+'&token='+token+'&idcust='+idcust+'&tp='+shopArr[0]['totalproduk'].low+'&tc='+shopArr[0]['totalcust'].low+'&to='+shopArr[0]['totalorder'].low)
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
// link nya misal ini http://localhost:3000/wooapi/getdataorder?cs=cs_be343b8fdd9d29f89ffeeaa954c25c0a8a08cb95&ck=ck_23ede9377f475e69b343eb4a33455c5ee6f70438&url=www.forbento.com&token=vx1U727gkSsMoJuM
app.get('/wooapi/getdataorderonly',function (req,res){

  var WooCommerce = new WooCommerceAPI({
    url: 'http://localhost/wordpress',
    consumerKey: 'ck_23ede9377f475e69b343eb4a33455c5ee6f70438',
    //consumerKey: req.query.ck,
    //consumerSecret: req.query.cs,
    consumerSecret: 'cs_be343b8fdd9d29f89ffeeaa954c25c0a8a08cb95',
    wpAPI: true,
    version: 'wc/v1'

  });
  WooCommerce.get('orders', function(err, data, response) {
    // console.log(response);
    dataOrders(WooCommerce, data.headers["x-wp-total"], data.headers["x-wp-totalpages"], req, res);
    //res.end('It worked!');
  });

});

//step2
function dataOrders(WooCommerce, total, pages, req, res){
  var token = req.query.token+"_ord";
  //var token = "suatufile"
  //var to = req.query.to;
  var to = parseInt( total, 10 )-1;
  var total2 = parseInt(total);
  var offset = to; //nanti diambil banyak data terakhir
  console.log(total2);
  console.log(to);
  for (var i = offset; i < total2 ; i+=10) {
    //console.log(i);
    WooCommerce.get("orders?orderby=date&order=asc&offset="+i, function(err, data, response) {

      var file = token+".json";

      fs.stat( file, function(err, stat) {
        if ( err && err.code == 'ENOENT' ) {
          fs.writeFileSync( file, "\n" );

        }

        var obj_baru = JSON.parse(response);
        var isi = fs.readFileSync(file).toString( 'utf-8' );

        //var arr = isi.length > 1 ? JSON.parse( isi ) : {orders:[]};
        var arr = isi.length > 1 ? JSON.parse( isi ):[];
        //var arr = JSON.parse(isi);
        for (i=0;i<obj_baru.length;i++){

          //arr['orders'].push( obj_baru [i] );
          arr.push( obj_baru [i] );
        }
        jsonfile.writeFileSync( file, arr );//write json
        addOrders(WooCommerce, token, req, res);
        //addSimil(WooCommerce, token, req, res);
      } );

    } );
  }
}
//step3
function addOrders(WooCommerce,file,req, res){
  session
  //console.log(file)
  .run('WITH "http://localhost/ta/nodemovies/'+file+'.json" AS url CALL apoc.load.json(url) YIELD value UNWIND value.line_items AS q match (a:Customers {idcust:value.customer_id}) match (b:Products {idprod:q.product_id}) MERGE (a)-[:BUY{quantity:q.quantity}]->(b)')
    .then(function(result){

      session
      .run('MATCH (u1:Customers)-[x:BUY]->(p:Products)<-[y:BUY]-(u2:Customers) WITH SUM(x.rec_order * y.rec_order) AS DotProduct, SQRT(REDUCE(xDot = 0, i IN COLLECT(x.rec_order) | xDot + toInt(i^2))) AS xLength, SQRT(REDUCE(yDot = 0, j IN COLLECT(y.rec_order) | yDot + toInt(j^2))) AS yLength, u1, u2 CREATE UNIQUE (u1)-[s:SIMILARITY]-(u2) SET s.value = DotProduct / (xLength * yLength)')
      .then(function(result){
      res.send('it worked');
        session.close();
      })

      .catch(function(err){
        console.log(err);
      });

    session.close();
  })
    .catch(function(err){
    console.log(err);
  });
}


//step4
// function addSimil(WooCommerce,file,req, res){
//   session
//   .run('MATCH (u1:Customers)-[x:BUY]->(p:Products)<-[y:BUY]-(u2:Customers) WITH SUM(x.rec_order * y.rec_order) AS DotProduct, SQRT(REDUCE(xDot = 0, i IN COLLECT(x.rec_order) | xDot + toInt(i^2))) AS xLength, SQRT(REDUCE(yDot = 0, j IN COLLECT(y.rec_order) | yDot + toInt(j^2))) AS yLength, u1, u2 CREATE UNIQUE (u1)-[s:SIMILARITY]-(u2) SET s.value = DotProduct / (xLength * yLength)')
//   .then(function(result){
//   res.send('it worked');
//     session.close();
//   })
//
//   .catch(function(err){
//     console.log(err);
//   });
// }



app.listen(3000);
console.log('Server started on port 3000');

module.exports = app;
