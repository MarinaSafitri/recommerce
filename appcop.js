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


//View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j','neo4jneo4j'));
var session = driver.session();




// fix render home.ejs
app.get('/home', function (req, res){
  res.render('home')
})
app.get('/login', function (req, res){
  res.render('login')
})
app.get('/register', function (req, res){
  res.render('register')
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
//register new member
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

//login member
app.post('/member/match',function(req,res){
  var email = req.body.email;
  var password = req.body.password;
  var memberArr = [];

    session
      .run('MATCH(n:Member{email:{emailParam}, password:{passwordParam}}) RETURN n',{ emailParam:email, passwordParam:password})
      .then(function(result){

       result.records.forEach(function (record){
        memberArr.push({
          membername: record._fields[0].properties.membername
        });
      });
      //console.log(memberArr[0]['cs']);
      res.redirect('/shop?membername='+memberArr[0]['membername']);

      //
    })
    .catch(function(err){
      console.log(err);
    });

});

//register the shop
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

      //
    })
    .catch(function(err){
      console.log(err);
    });

});





//menampilkan produk dalam bentuk json dari neo4j
app.get('/json', function (req, res){
  session
    .run('MATCH(n:Products) RETURN n')
    .then(function(result){
      var productArr = [];
      result.records.forEach(function (record){
        productArr.push({
          idprod: record._fields[0].identity.low,
          name: record._fields[0].properties.name
        });
      });
       res.json(productArr);
    });

});


//get customer id yang login
app.get('/wooapi/getcust',function(req,res){
  var id = req.query.id;
  console.log(id);
});

//get recom start here
//format recom get dari localhost:3000/wooapi/getrecom?token=vx1U727gkSsMoJuM&idcust=8
app.get('/wooapi/getrecom',function(req,res){

  function checkshop(req, res){
  var token = req.query.token;
  var idcust = req.query.idcust;
  var shopArr = [];
  session
  .run('MATCH (c:Customers)-[r:BUY]->(p:Products) WHERE c.token = {tokenParam} AND p.token = {tokenParam} WITH SUM(r.quantity) as p MATCH (n:Shop { token:{tokenParam}}) SET n.totalorder = p RETURN n',{tokenParam:token})
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
          res.redirect('/wooapi/getdatacust?cs='+shopArr[0]['cs']+'&ck='+shopArr[0]['ck']+'&url='+shopArr[0]['urlshop']+'&token='+token+'&idcust='+idcust+'&tp='+shopArr[0]['totalproduk'].low+'&tc='+shopArr[0]['totalcust'].low+'&to='+shopArr[0]['totalorder'].low)
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
}
        });



//fix display product and customer
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
              id: record._fields[0].identity.low,
              username: record._fields[0].properties.username
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


// fix initial registration
app.post('/user/add',function(req,res){
  var urlshop = req.body.urlshop;
  var email = req.body.email;
  var password = req.body.password;
  var ck = req.body.ck;
  var cs = req.body.cs;
  var token =req.body.randomfield;

    session
      .run('CREATE(n:Shop{urlshop:{urlshopParam}, email:{emailParam}, password:{passwordParam}, ck:{ckParam}, cs:{csParam}, updaterow:0, token:{tokenParam}}) RETURN n.email',{urlshopParam:urlshop, emailParam:email, passwordParam:password, ckParam:ck, csParam:cs, tokenParam:token})
      .then(function(result){
        res.redirect('/');

        session.close();
      })

      .catch(function(err){
        console.log(err);
      });

    res.redirect('/home');
});

//ambil data dari woocommerce via url api
app.post('/recom',function(req,res){
  res.send(req.body.url);
  //res.redirect('http://localhost:80/ta/wordpress');
});





app.get('/wooapi/recom',function(req,res){
      var file = req.query.file;
      session
      .run('WITH "http://localhost/ta/nodemovies/'+file+'.json" AS url CALL apoc.load.json(url) YIELD value UNWIND value.customers AS q MERGE (customer:Customers {idcust:q.id}) ON CREATE SET customer.name = q.username')

      .then(function(result){
        res.redirect('/');

        session.close();
      })

      .catch(function(err){
        console.log(err);
  });

});

app.get('/wooapi/addProduk',function(req,res){

      session
      .run('WITH "http://localhost/wordpress/produk.json" AS url CALL apoc.load.json(url) YIELD value MERGE (product:Products {idprod:value.id}) ON CREATE SET product.name = value.title')
      .then(function(result){
        res.redirect('/wooapi/addRel');

        session.close();
      })

      .catch(function(err){
        console.log(err);
  });

});


app.get('/wooapi/addRel',function(req,res){

      session
      .run('WITH "http://localhost/wordpress/order.json" AS url CALL apoc.load.json(url) YIELD value UNWIND value.line_items AS q UNWIND value.customer AS c match (a:Customers {idcust:c.id}) match (b:Products {idprod:q.product_id}) MERGE (a)-[:BUY{quantity:q.quantity}]->(b)')
      .then(function(result){
        res.redirect('/wooapi/addSimil');

        session.close();
      })

      .catch(function(err){
        console.log(err);
  });

});


app.get('/wooapi/addSimil',function(req,res){

      session
      .run('MATCH (u1:Customers)-[x:BUY]-> (p:Products)<-[y:BUY]-(u2:Customers) WITH count(p) AS kuantitas, u1.name AS user1, u2.name AS user2, u1, u2, collect((x.buy-y.buy)^2) AS buy, collect(p.name) AS product WITH kuantitas, product, u1, u2, buy MERGE (u1)-[s:Similarity]->(u2) SET s.similarity =1-(SQRT(reduce(total=0.0, k in extract(i in buy | i/kuantitas) | total+k))/4)')
      .then(function(result){
        res.redirect('/');

        session.close();
      })

      .catch(function(err){
        console.log(err);
  });

});






//woocommerce customer json link default



//get jsonnya customers
var WooCommerceAPI = require('woocommerce-api');
app.get('/wooapi/getdatacust',function (req,res){
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
    dataCustomer(WooCommerce, data.headers["x-wp-total"], data.headers["x-wp-totalpages"],"tes123");
    res.end('It worked!');
  });

});

function dataCustomer(WooCommerce, total, pages, token){
  var x = 30;
  //var x = 20;
  var total2 = parseInt(total, 10);
  var offset = 958; //nanti diambil banyak data terakhir
  for (var i = offset; i < total2; i+=10) {
    console.log(i);
    WooCommerce.get("customers?orderby=id&order=asc&offset="+i, function(err, data, response) {

      var file = token+".json";
      fs.stat( file, function(err, stat) {
        if ( err && err.code == 'ENOENT' ) {
          fs.writeFile( file, "\n" );
        }
      } );

      var obj_baru = JSON.parse(response);
      var isi = fs.readFileSync(file).toString( 'utf-8' );
      var arr = isi.length ? JSON.parse( isi ) : {customers:[]};
      for (i=0;i<obj_baru.length;i++){

      arr['customers'].push( obj_baru [i] );
      }

      jsonfile.writeFileSync( file, arr );//write json

    } );

  }

}

//get jsonnya product
app.get('/wooapi/listprod',function(req,res){
  var WooCommerce = new WooCommerceAPI({
    url: 'http://localhost/wordpress',
    consumerKey: 'ck_23ede9377f475e69b343eb4a33455c5ee6f70438',
    //consumerKey: req.query.ck,
    //consumerSecret: req.query.cs,
    consumerSecret: 'cs_be343b8fdd9d29f89ffeeaa954c25c0a8a08cb95',
    wpAPI: true,
    version: 'wc/v1'
  });

  // WooCommerce.get('products?[created_at_min]=2017-03-17', function(err, data, response) {
  //  res.contentType('application/json');
  //   res.send(response);
  // });
   WooCommerce.get('customers?per_page=100&orderby=id&order=desc', function(err, data, response) {

   res.contentType('application/json');
    res.send(response);
  });

});


app.listen(3000);
console.log('Server started on port 3000');

module.exports = app;
