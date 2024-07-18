const express = require('express');
const router = express.Router();

const db = require('../database');
var connection = db();

var checkLogin = require('../middlewares/checkUserLogin')

router.get('/view/(:jobID)', (req, res, next) => {
    // Get Job Data
    connection.query('SELECT * FROM jobs WHERE id = ?', req.params.jobID, async (err, jobData) => {
        if (err) {
            res.send(err)
        } else {
            // Get Organization Data
            connection.query('SELECT * FROM organizations WHERE org_email = ?', jobData[0].org_email, async (err, companyData) => {
                if (err) {
                    res.send(err)
                } else {
                    // Check already applied
                    connection.query('SELECT jobID FROM apply WHERE user_email = ? && jobID = ?', [req.session.email, req.params.jobID], async (err, result) => {
                        if (err) {
                            res.send(err)
                        } else {
                            var already = result.length != 0 ? true : false;
                            res.render('users/view-job', { email: req.session.email, jobData, companyData, already })
                        }
                    })
                }
            })
        }
    })
})

router.get('/browse/(:jobCat)', (req, res, next) => {
    var category = req.params.jobCat;
    connection.query('SELECT * FROM jobs WHERE job_category = ?', category, async (err, jobsData) => {
        if (err) {
            res.send(err)
        } else {
            res.render('users/browse-jobs', { email: req.session.email, jobsData, category })
        }
    })
})

router.get('/location/(:city)', (req, res, next) => {
    var location = req.params.city;
    connection.query('SELECT * FROM jobs WHERE job_location = ?', location, async (err, jobsData) => {
        if (err) {
            res.send(err)
        } else {
            res.render('users/browse-jobs', { email: req.session.email, jobsData, category: location })
        }
    })
})

router.post('/filter', (req, res, next) => {
    var { category, job_location, job_type, min_pay, max_pay } = req.body;
    var query = 'SELECT * FROM jobs WHERE job_category = "' + category + '"';
    if (job_type != "") {
        query += ' AND job_type = "' + job_type + '"'
    }
    if (job_location != "") {
        query += ' AND job_location = "' + job_location + '"'
    }
    if (min_pay != "" && max_pay != "") {
        query += ' AND pay_1 >= ' + min_pay
        query += ' AND pay_2 <= ' + max_pay
    }

    connection.query(query, async (err, jobsData) => {
        if (err) {
            res.send(err)
        } else {
            res.render('users/browse-jobs', { email: req.session.email, jobsData, category, job_location, job_type, min_pay, max_pay })
        }
    })
})

router.post('/apply', async (req, res, next) => {
    if (req.session.email) {

        const { jobID, org_name, job_title } = req.body;

        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        today = dd + '-' + mm + '-' + yyyy;

        connection.query('SELECT jobID FROM apply WHERE user_email = ? && jobID = ?', [req.session.email, jobID], async (err, result) => {
            if (err) {
                res.send(err)
            } else {
                if (result.length != 0) {
                    res.send('already')
                } else {
                    let application = { jobID: jobID, org_name: org_name, job_title: job_title, user_email: req.session.email, appliedON: today, status: 'New' }
                    let sql = 'INSERT INTO apply SET ?';
                    connection.query(sql, application, err => {
                        if (err) {
                            res.send(err)
                        } else {
                            res.send('success')
                        }
                    })
                }
            }
        })


    } else {
        res.send('Not Login')
    }

})

router.get('/applied', checkLogin, (req, res, next) => {
    connection.query('SELECT * FROM apply WHERE user_email = ?', req.session.email, async (err, jobsData) => {
        if (err) {
            res.send(err)
        } else {
            res.render('users/applied-jobs', { email: req.session.email, jobsData })
        }
    })
})

module.exports = router;