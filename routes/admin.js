const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passwordValidator = require('password-validator');
const {adminEnsureAuthenticated} = require('../config/auth');


// Dotenv
require('dotenv').config();

// User model
const User = require('../models/User');
const {AsyncResultLocator} = require('jsforce');

// Register Page
router.get('/register', adminEnsureAuthenticated, (req, res) =>
  res.render('register')
);

// register handle
router.post('/register', (req, res) => {
  const {
    name,
    email,
    password,
    password2,
    contact_id,
    account_id,
    icount_id,
    role,
  } = req.body;
  let errors = [];

  // Check required fields
  if (role === 'admin') {
    if (!name || !email || !password || !password2) {
      errors.push({msg: 'Please fill in all fields'});
    }
  } else if (role === 'user')
    if (
      !name ||
      !email ||
      !password ||
      !password2 ||
      !contact_id ||
      !account_id ||
      !icount_id
    ) {
      errors.push({msg: 'Please fill in all fields'});
    }

  // Check passwords match
  if (password !== password2) {
    errors.push({msg: 'Password do not match'});
  }

  // Password Validation begin
  const schema = new passwordValidator(); // Create a schema
  // Add properties to it
  schema
    .is()
    .min(8) // Minimum length 8
    .is()
    .max(16) // Maximum length 15
    .has()
    .has()
    .letters() // Must have letters
    .uppercase() // Must have uppercase letters
    .has()
    .lowercase() // Must have lowercase letters
    .has()
    .digits() // Must have digits
    .has()
    .symbols() // Must have symbols
    .has()
    .not()
    .spaces(); // Should not have spaces

  // Push password errors
  schema.validate(password, {list: true}).forEach(function (error) {
    if (error === 'min') {
      errors.push({msg: 'Password must be at minimum 8 characters.'});
    }
    if (error === 'max') {
      errors.push({msg: 'Password must be at maximum 16 characters.'});
    }
    if (error === 'letters') {
      errors.push({msg: 'Password must contain letters.'});
    }
    if (error === 'uppercase') {
      errors.push({msg: 'Password must contain uppercase character.'});
    }
    if (error === 'lowercase') {
      errors.push({msg: 'Password must contain lowercase character.'});
    }
    if (error === 'digits') {
      errors.push({msg: 'Password must contain digits.'});
    }
    if (error === 'spaces') {
      errors.push({msg: `Password can't contain spaces.`});
    }
  }); // Password validation end

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2,
      contact_id,
      account_id,
      icount_id,
      role,
    });
  } else {
    //  Validation passed
    User.findOne({email: email})
      .then((user) => {
        if (user) {
          //   User exists
          errors.push({msg: 'Email is already registered'});
          res.render('register', {
            errors,
            name,
            email,
            password,
            password2,
            contact_id,
            account_id,
            icount_id,
            role,
          });
        } else {
          const newUser = new User({
            name,
            email,
            password,
            contact_id,
            account_id,
            icount_id,
            role,
          });
          // Hash Password
          bcrypt.genSalt(10, (err, salt) =>
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              // Set password to hashed
              newUser.password = hash;
              // Save User
              newUser
                .save()
                .then((user) => {
                  req.flash(
                    'success_msg',
                    'Register complete !'
                  );
                  res.redirect('/');
                })
                .catch((err) => console.log(err));
            })
          );
        }
      })
      .catch();
  }
});

module.exports = router;
