//coba tambah data b
app.post('/customers/add',function(req,res){
  var id = req.body.id;
  var username = req.body.username;

    session
      .run('CREATE(n:Customers{id:{idParam}, username:{usernameParam}}) RETURN n.username',{idParam:id, usernameParam:username})
      .then(function(result){
        res.redirect('/');

        session.close();
      })

      .catch(function(err){
        console.log(err);
      });

    res.redirect('/');
});

app.post('/product/customers/add',function(req,res){
  var idprod = req.body.idprod;
  var id = req.body.id;
  var quantity = req.body.quantity;

    session
      .run('MATCH(m:Customers{id:{idParam}}),(n:Product{idprod:{idprodParam}}) MERGE(m)-[r:BUY{quantity:{quantityParam}}]-(n) RETURN m,n',{idParam:id,idprodParam:idprod,quantityParam:quantity})
      .then(function(result){
        res.redirect('/');

        session.close();
      })

      .catch(function(err){
        console.log(err);
      });

    res.redirect('/');
});
