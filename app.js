const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');

var jsforce = require('jsforce');
var fs = require('fs');

const app = express();

// Passport config
require('./config/passport')(passport);

// DB Config
const db = require('./config/key').MongoURI;

// Connect to MongoDB
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log('MongoDB Connected ...'))
  .catch((err) => console.log(err));

// EJS
const path = require('path');
app.use('/public/images/', express.static('./public/images'));
app.use('/public/css/', express.static('./public/css'));
app.use('/public/js/', express.static('./public/js'));
app.set('views', path.join(__dirname, 'views'));

// Bodyparser
app.use(express.urlencoded({extended: true}));

app.set('view engine', 'ejs');
app.use(expressLayouts);

// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    // cookie: {secure: true},
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', (req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Connect flash
app.use(flash());

// Global Vars
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');

  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/admin', require('./routes/admin'));
// 404 Page
app.use('/users/*', (req, res, next) => {
  res.status(404).render('404page');
});app.use('/admin/*', (req, res, next) => {
  res.status(404).render('404page');
});app.use('/*', (req, res, next) => {
  res.status(404).render('404page');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
