const express = require('express');
const router = express.Router();
var multer = require('multer');

var bcrypt = require('bcryptjs');

const db = require('../database')
var connection = db();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/org')
    },

    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
})

var upload = multer({ storage: storage })
var uploadLogo = upload.single('org_logo');

router.get('/login', (req, res, next) => {
    res.render('org/login')
})

router.get('/register', (req, res, next) => {
    res.render('org/register')
})

router.post('/register', uploadLogo, async (req, res, next) => {
    const password = await bcrypt.hash(req.body.org_password, 8)
    let org = { org_name: req.body.org_name, org_email: req.body.org_email, org_password: password, org_phone: req.body.org_phone, org_logo: req.file.path.substring(6) }
    let sql = 'INSERT INTO organizations SET ?';
    connection.query(sql, org, err => {
        if (err) {
            res.send(err.sqlMessage)
        } else {
            req.session.org_email = req.body.org_email
            res.redirect('/organization/jobs/manage-jobs')
        }
    })
})

router.post('/login', async (req, res, next) => {
    const { org_email, org_password } = req.body;

    connection.query('SELECT org_email, org_password FROM organizations WHERE org_email = ?', [org_email], async (err, result) => {
        if (err) {
            res.send(err.sqlMessage)
        }
        if (result[0]) {
            if (await bcrypt.compare(org_password, result[0].org_password)) {
                req.session.org_email = req.body.org_email
                res.send("success")
            } else {
                res.send('Incorrect Email and Password!')
            }
        } else {
            res.send('No organization found with Email Address!')
        }
    })
})

router.get('/logout', (req, res, next) => {
    req.session.destroy();
    res.redirect('/organization/login')
})

module.exports = router;