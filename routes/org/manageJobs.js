const express = require('express');
const router = express.Router();

const checkOrgLogin = require('../middlewares/checkOrgLogin')

const db = require('../database')
var connection = db();

router.get('/manage-jobs', checkOrgLogin, (req, res, next) => {
    var org_email = req.session.org_email;
    connection.query('SELECT * FROM jobs WHERE org_email = ?', [org_email], async (err, jobsData) => {
        if (err) {
            res.send(err)
        } else {
            res.render('org/manage-jobs', { jobsData })
        }
    })
})

router.get('/manage-applications/(:jobID)', checkOrgLogin, (req, res, next) => {
    connection.query('SELECT * FROM apply WHERE jobID = ?', [req.params.jobID], async (err, applicants) => {
        if (err) {
            res.send(err)
        } else {
            // Get job details
            var applied = []
            applicants.forEach(element => {
                connection.query('SELECT * FROM users WHERE email = ?', [element.user_email], async (err, data) => {
                    if (err) {
                        res.send(err)
                    } else {
                        applied.push({
                            id: element.id,
                            name: data[0].name,
                            email: data[0].email,
                            phone: data[0].phone,
                            resume: data[0].resume,
                            appliedON: element.appliedON,
                            status: element.status
                        })
                    }
                })
            });
            connection.query('SELECT * FROM jobs WHERE id = ?', [req.params.jobID], async (err, jobData) => {
                if (err) {
                    res.send(err)
                } else {
                    res.render('org/manage-applications', { applied, jobData })
                }
            })
        }
    })
})

router.get('/add-job', checkOrgLogin, (req, res, next) => {
    res.render('org/add-job')
})

router.post('/add-job', async (req, res, next) => {

    if (req.session.org_email) {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();
        today = dd + '-' + mm + '-' + yyyy;

        let job = { org_email: req.session.org_email, job_title: req.body.job_title, job_location: req.body.job_location, job_type: req.body.job_type, job_category: req.body.job_category, job_desc: req.body.job_desc, req_skills: req.body.req_skills, pay_1: req.body.pay_1, pay_2: req.body.pay_2, job_posted: today, closing_date: req.body.closing_date, status: 'Active' }
        let sql = 'INSERT INTO jobs SET ?';
        connection.query(sql, job, err => {
            if (err) {
                res.send(err.sqlMessage)
            } else {
                res.send('success')
            }
        })
    } else {
        res.send('Not Login')
    }
})

router.get('/edit-job/(:jobID)', checkOrgLogin, async (req, res, next) => {
    connection.query('SELECT * FROM jobs WHERE id = ?', req.params.jobID, async (err, jobData) => {
        if (err) {
            res.send(err)
        } else {
            res.render('org/edit-job', { jobData: jobData[0] })
        }
    })
})

router.post('/edit-job', async (req, res, next) => {

    if (req.session.org_email) {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();
        today = dd + '-' + mm + '-' + yyyy;

        let job = { org_email: req.session.org_email, job_title: req.body.job_title, job_location: req.body.job_location, job_type: req.body.job_type, job_category: req.body.job_category, job_desc: req.body.job_desc, req_skills: req.body.req_skills, pay_1: req.body.pay_1, pay_2: req.body.pay_2, job_posted: today, closing_date: req.body.closing_date, status: 'Active' }
        let sql = 'UPDATE jobs SET ? WHERE id = ?';
        connection.query(sql, [job, req.body.jobID], err => {
            if (err) {
                res.send(err.sqlMessage)
            } else {
                res.send('success')
            }
        })
    } else {
        res.send('Not Login')
    }
})

router.get('/delete-job/(:jobID)', checkOrgLogin, (req, res, next) => {
    var jobID = req.params.jobID;
    connection.query('DELETE FROM jobs WHERE id = ?', [jobID], async (err, result) => {
        if (err) {
            res.send(err)
        } else {
            connection.query('DELETE FROM apply WHERE jobID = ?', [jobID], async (err, jobs) => {
                if (err) {
                    res.send(err)
                } else {
                    res.redirect('/organization/jobs/manage-jobs')
                }
            })
        }
    })
})

router.post('/change-status', async (req, res, next) => {

    if (req.session.org_email) {
        const { status, id } = req.body;
        connection.query('UPDATE apply SET status = ? WHERE id = ?', [status, id], err => {
            if (err) {
                res.send(err.sqlMessage)
            } else {
                res.send('success')
            }
        })
    } else {
        res.send('Not Login')
    }
})

module.exports = router;