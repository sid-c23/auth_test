var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user');

var port = process.env.PORT || 8080;
mongoose.connect(config.database);
app.set('secret', config.secret);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

//routes

app.get('/', (req, res) => {
  res.send('Hello! The API is at http://localhost:' + port + '/api');
});

//api routes

app.get('/setup', (req, res) => {
  var nick = new User({
    name: 'Nick',
    password: 'password',
    admin: true
  })
  nick.save( (err) => {
    if (err) throw err;
    console.log('User saved successfully!');
    res.json({ success: true });
  })
});

var apiRoutes = express.Router();

apiRoutes.post('/authenticate', (req, res) => {

  User.findOne({
    name: req.body.name
  }, (err, user) => {
    if (err) throw err;
    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found. ' });
    }  else if (user) {
      if (user.password != req.body.password) {

        res.json({ success: false, message: 'Authentication failed. Wrong Password.' });
      } else {

       const payload = {
         admin: user.admin
       } 
       var token = jwt.sign(payload, app.get('secret'), {
         expiresIn: '1h'
       });
       res.json({
         success: true,
         message: 'Enjoy your token!',
         token: token
       })
      }
    }
  });

})


//protected routes
apiRoutes.use( (req, res, next) => {

  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if (token) {
    jwt.verify(token, app.get('secret'), (err, decoded) => {

      if (err) {
        return res.json({ success: false, message: "Failed to authenticate" });

      } else {
        req.decoded = decoded;
        next();
      }
    })
  } else {
    return res.status(403).send({
      success: false,
      message: 'No token provided'
    })
  }

});


apiRoutes.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API!' });
});

apiRoutes.get('/users', (req, res) => {

  User.find( {}, (err, users) => {

    res.json(users);
  });

});




app.use('/api', apiRoutes);
app.listen(port);
console.log('Magic happens at http://localhost: ' + port);


