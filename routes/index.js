const express = require('express');
const router = express.Router();
const {
  ensureAuthenticated,
  roleAuthenticated,
  adminEnsureAuthenticated,
} = require('../config/auth');
const ConnectRoles = require('connect-roles');
const app = express();

// const authentication = require('./config/auth');

// Roles
const user = new ConnectRoles({
  failureHandler: function (req, res, action) {
    const accept = req.headers.accept || '';
    res.status(403);
    if (~accept.indexOf('html')) {
      res.redirect('/users/login');
    } else {
      res.send("Access Denied - You don't have permission to: " + action);
    }
  },
});

// app.use(authentication);
app.use(user.middleware());

// Welcome Page
router.get('/', (req, res) => {
  res.render('welcome');
});

// Admin page
router.get('/admin', adminEnsureAuthenticated, (req, res) => {
  res.render('admin');
});

// portal
router.get('/portal', ensureAuthenticated, (req, res) => {
  console.log("*****",req.user.account_id);
  if (req.user.account_id === undefined) {
    return res.redirect('/Not-Allowed');
  }
  res.render('portal', {
    name: req.user.name,
    contact_id: req.user.contact_id,
    account_id: req.user.account_id,
    icount_id: req.user.icount_id,
    role: req.user.role,
    cases: null,
    case_number: null,
    status: null,
    icount_information: null,
    statusCount: null,
    priorityCount: null,
  });
});

// Not Allowed
router.get('/Not-Allowed', (req, res) => {
  res.render('notAllowed');
});
// FAQ Page
router.get('/FAQ', ensureAuthenticated, (req, res) => {
  res.render('faq');
});

module.exports = router;
