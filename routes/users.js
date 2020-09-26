const express = require('express');
const router = express.Router();
const passport = require('passport');
const jsforce = require('jsforce');
const {
  ensureAuthenticated,
  roleAuthenticated,
  reDirectRole,
} = require('../config/auth');
const https = require('https');
const ejs = require('ejs');

// Dotenv
require('dotenv').config();

// User model
const User = require('../models/User');
const { AsyncResultLocator } = require('jsforce');

// Login Page
router.get('/login', (req, res) => res.render('login'));

// Login Handle
router.post('/login', passport.authenticate('local'), function (req, res) {
  if (req.user.role === 'admin') {
    res.redirect('/admin');
  } else {
    res.redirect('/portal');
  }
});

// Logout Handle
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/');
});

// jotform
router.get('/jotform', ensureAuthenticated, (req, res) => {
  res.render('jotform', {
    account_id: req.user.account_id,
  });
});

// iCount
router.get('/icount', ensureAuthenticated, (req, res) => {
  // iCount Login api
  https
    .get(
      process.env.ICOUNT,
      (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
          data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
          const sidP = JSON.parse(data).sid;
          console.log(JSON.parse(data));

          // iCount get docs api
          https
            .get(
              `https://api.icount.co.il/api/v3.php/client/get_open_docs?sid=${sidP}&client_id=${req.user.icount_id}`,
              (resp) => {
                let data = '';

                // A chunk of data has been recieved.
                resp.on('data', (chunk) => {
                  data += chunk;
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                  let open_docs_info = JSON.parse(data).open_docs;
                  console.log(open_docs_info);
                  res.render('portal', {
                    name: req.user.name,
                    contact_id: req.user.contact_id,
                    account_id: req.user.account_id,
                    icount_id: req.user.icount_id,
                    cases: null,
                    case_number: null,
                    status: null,
                    icount_information: open_docs_info.deal,
                    statusCount: null,
                    priorityCount: null,
                  });
                });
              }
            )
            .on('error', (err) => {
              console.log('Error: ' + err.message);
            });
        });
      }
    )
    .on('error', (err) => {
      console.log('Error: ' + err.message);
    });
});

// Get all New cases
router.get('/all-open-cases-query', ensureAuthenticated, async (req, res) => {
  try {
    const conn = new jsforce.Connection({
      serverUrl: process.env.SF_URL,
    });
    await conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD);

    console.log('Connected to Salesforce!');
    await conn.query(
      `SELECT CaseNumber,Status,Subject,LastModifiedDate FROM Case WHERE Status = 'New' AND AccountId = '${req.user.account_id}'`,
      function (err, result) {
        if (err) {
          return console.error(err);
        }
        res.render('portal', {
          name: req.user.name,
          contact_id: req.user.contact_id,
          account_id: req.user.account_id,
          icount_id: req.user.icount_id,
          cases: null,
          case_number: null,
          status: result.records,
          icount_information: null,
          statusCount: null,
          priorityCount: null,
        });
      }
    );
    await conn.logout();
    console.log('Out from Salesforce!');
  } catch (err) {
    console.error(err);
  }
});

// Get last Case query
router.get('/case-number-query', ensureAuthenticated, async (req, res) => {
  try {
    const conn = new jsforce.Connection({
      serverUrl: process.env.SF_URL,
    });

    await conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD);

    console.log('Connected to Salesforce!');

    await conn.query(
      `SELECT CaseNumber,LastModifiedDate FROM Case WHERE AccountId = '${req.user.account_id}' ORDER BY CreatedDate DESC NULLS FIRST LIMIT 1`,
      function (err, result) {
        if (err) {
          return console.error(err);
        }
        res.render('portal', {
          name: req.user.name,
          contact_id: req.user.contact_id,
          account_id: req.user.account_id,
          icount_id: req.user.icount_id,
          cases: null,
          case_number: result.records,
          status: null,
          icount_information: null,
          statusCount: null,
          priorityCount: null,
        });
      }
    );
    await conn.logout();
    console.log('Out from Salesforce!');
  } catch (err) {
    console.error(err);
  }
});

// Show all Cases query
router.get('/show-all-cases-query', ensureAuthenticated, async (req, res) => {
  try {
    const conn = new jsforce.Connection({
      serverUrl: process.env.SF_URL,
    });

    await conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD);

    console.log('Connected to Salesforce!');
    var CountStatus = [];
    var CountPriority = [];
    var Case = [];
    await conn.query(
      `SELECT status, count(id) FROM Case WHERE AccountId = '${req.user.account_id}' GROUP BY Status`,
      function (err, result) {
        if (err) {
          return console.error(err);
        }
        result.records.forEach((exp) => {
          CountStatus.push(exp.expr0);
        });
      }
    );

    await conn.query(
      `SELECT Priority, count(id) FROM Case WHERE AccountId = '${req.user.account_id}' GROUP BY Priority`,
      function (err, result) {
        if (err) {
          return console.error(err);
        }
        result.records.forEach((exp) => {
          CountPriority.push(exp.expr0);
        });
      }
    );

    await conn.query(
      `SELECT CaseNumber,Status,Subject,LastModifiedDate FROM Case WHERE AccountId = '${req.user.account_id}' ORDER BY CreatedDate ASC NULLS FIRST`,
      function (err, result) {
        if (err) {
          return console.error(err);
        }
        Case = result.records;
      }
    );
    await conn.logout();
    console.log('Out from Salesforce!');
  } catch (err) {
    console.error(err);
  }
  res.render('portal', {
    name: req.user.name,
    contact_id: req.user.contact_id,
    account_id: req.user.account_id,
    icount_id: req.user.icount_id,
    cases: Case,
    case_number: null,
    status: null,
    icount_information: null,
    statusCount: CountStatus,
    priorityCount: CountPriority,
  });
});

module.exports = router;
