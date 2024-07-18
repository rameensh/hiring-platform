const express = require('express');
const router = express.Router();

const db = require('../database');
var connection = db();

const checkAdminLogin = require('../middlewares/checkAdminLogin')

router.get('/dashboard', checkAdminLogin, (req, res, next) => {

    connection.query('SELECT * FROM users', async (err, users) => {
        if (err) {
            res.send(err)
        } else {
            connection.query('SELECT * FROM jobs', async (err, jobs) => {
                if (err) {
                    res.send(err)
                } else {
                    connection.query('SELECT * FROM organizations', async (err, orgs) => {
                        if (err) {
                            res.send(err)
                        } else {
                            res.render('admin/dashboard', { users: users.length, jobs: jobs.length, orgs: orgs.length })
                        }
                    })
                }
            })
        }
    })

})

router.get('/users', checkAdminLogin, (req, res, next) => {

    connection.query('SELECT * FROM users', async (err, users) => {
        if (err) {
            res.send(err)
        } else {
            res.render('admin/users', { users })
        }
    })

})

router.get('/orgs', checkAdminLogin, (req, res, next) => {

    connection.query('SELECT * FROM organizations', async (err, orgs) => {
        if (err) {
            res.send(err)
        } else {
            res.render('admin/orgs', { orgs })
        }
    })

})

router.get('/jobs', checkAdminLogin, (req, res, next) => {

    connection.query('SELECT * FROM jobs', async (err, jobs) => {
        if (err) {
            res.send(err)
        } else {
            res.render('admin/jobs', { jobs })
        }
    })

})

router.get('/login', (req, res, next) => {
    res.render('admin/login')
})

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
    if (email == "admin@jobfinder.com" && password == "admin@123") {
        req.session.admin_email = req.body.email
        res.send('success')
    } else {
        res.send('Incorrect Email or Password!')
    }
})

router.get('/logout', (req, res, next) => {
    req.session.destroy();
    res.redirect('/admin/login')
})

module.exports = router;