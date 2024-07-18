const express = require('express');
const router = express.Router();
var multer = require('multer');
var bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const db = require('../database');
const checkUserLogin = require('../middlewares/checkUserLogin');
var connection = db();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/user')
    },

    filename: function (req, file, cb) {
        cb(null, Date.now() + file.originalname)
    }
})

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
    }
});

var upload = multer({ storage: storage })
var uploadResume = upload.single('resume');

router.get('/', (req, res, next) => {
    var user_email = req.session.email
    if (user_email) {
        connection.query('SELECT skills FROM users WHERE email = ?', user_email, async (err, user) => {
            if (err) {
                res.send(err)
            } else {
                connection.query('SELECT * FROM jobs', async (err, jobsData) => {
                    if (err) {
                        res.send(err)
                    } else {
                        let result = []
                        if (user[0] && user[0].skills) {
                            var skillsArr = user[0].skills.split(', ')
                            jobsData.forEach(function (job) {
                                if (skillsArr.some(v => job.req_skills.includes(v))) {
                                    result.push(job)
                                }
                            })
                        }

                        connection.query('SELECT * FROM jobs WHERE job_category = ?', ["Layman Hiring"], async (err, layData) => {
                            if (err) {
                                res.send(err)
                            } else {
                                res.render('users/index', { email: user_email, noofjobs: jobsData.length, jobsData: result, layData })
                            }
                        })
                    }
                })
            }
        })
    } else {
        connection.query('SELECT * FROM jobs', async (err, jobsData) => {
            if (err) {
                res.send(err)
            } else {
                connection.query('SELECT * FROM jobs WHERE job_category = ?', ["Layman Hiring"], async (err, layData) => {
                    if (err) {
                        res.send(err)
                    } else {
                        res.render('users/index', { email: user_email, noofjobs: jobsData.length, jobsData, layData })
                    }
                })
            }
        })
    }
})

router.get('/login', (req, res, next) => {
    res.render('users/login')
})

router.get('/register', (req, res, next) => {
    res.render('users/register')
})

router.get('/verify-otp', async (req, res, next) => {
    if(req.session.email) {
        connection.query('SELECT * FROM users WHERE email = ?', [req.session.email], async (err, userData) => {
            if (err) {
                res.send(err)
            } else {
                let mailOptions = {
                    from: process.env.EMAIL,
                    to: userData[0].email,
                    subject: 'OTP Verification for AI JOB FINDER',
                    text: 'Dear User,\n\nYour OTP for Email verification is ' + userData[0].otp + "\n\nThank You!"
                };
                
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error.message);
                    }
                    console.log('success');
                });
            
                res.render('users/verifyOTP')
            }
        })
    } else {
        res.redirect('/login')
    }
    
})

router.get('/my-profile', checkUserLogin, (req, res, next) => {
    var skills = []
    connection.query('SELECT * FROM users WHERE email = ?', req.session.email, async (err, user) => {
        if (err) {
            res.send(err)
        } else {
            connection.query('SELECT req_skills FROM jobs', async (err, result) => {
                if (err) {
                    res.send(err)
                } else {
                    result.forEach(element => {
                        var skillArr = element.req_skills.split(', ')
                        skills = skills.concat(skillArr)
                    });
                    skills.push("Creative Writing", "Digital Marketing", "English Proficiency (Spoken)", "English Proficiency (Spoken)", "English Proficiency (Written)", "Facebook Marketing", "Instagram Marketing", "Search Engine Marketing (SEM)", "Search Engine Optimization (SEO)", "Social Media Marketing", "Client Relationship", "Adobe Photoshop", "CorelDRAW", "Android", "ReactJS", "React Native", "Business Analysis", "Business Research", "Effective Communication", "MS-Office", "MS-Excel", "PHP", "HTML", "JavaScript", "Python", "Node.js", ".NET", "Electrician", "Plumber", "Painter", "Worker", "Driver")
                    skills = [...new Set(skills)]
                    skills = skills.sort()
                    res.render('users/profile', { email: req.session.email, user: user[0], skills })
                }
            })
        }
    })
})

router.post('/my-profile', checkUserLogin, (req, res, next) => {
    var { name, email, phone, skills } = req.body;
    skills = skills.filter(item => item);
    skills = [...new Set(skills)]
    var user_skills = skills.join(', ')
    connection.query('UPDATE users SET name = ?, email = ?, phone = ?, skills = ? WHERE email = ?', [name, email, phone, user_skills, email], async (err, user) => {
        if (err) {
            res.send(err)
        } else {
            res.redirect('/my-profile')
        }
    })
})

router.post('/register', uploadResume, async (req, res, next) => {
    const password = await bcrypt.hash(req.body.password, 8)
    var otp = Math.floor(100000 + Math.random() * 900000);
    let user = { name: req.body.name, email: req.body.email, password: password, phone: req.body.phone, resume: req.file.path.substring(6), otp: otp, auth: 'False' }
    let sql = 'INSERT INTO users SET ?';
    connection.query(sql, user, err => {
        if (err) {
            res.send(err)
        } else {
            req.session.email = req.body.email
            res.redirect('/verify-otp')
        }
    })
})

router.post('/verify-otp', async (req, res, next) => {
    var email = req.session.email;
    connection.query('SELECT * FROM users WHERE email = ?', email, async (err, user) => {
        if (err) {
            res.send(err)
        } else {
            if (user[0].otp == req.body.otp) {
                connection.query('UPDATE users SET auth = ? WHERE email = ?', ["True", email], async (err, result) => {
                    if (err) {
                        res.send(err)
                    } else {
                        res.send("success")
                    }
                })
            } else {
                res.send("incorrect")
            }
        }
    })
})

router.post('/login-user', async (req, res, next) => {
    const { email, password } = req.body;

    connection.query('SELECT email, password, auth FROM users WHERE email = ?', [email], async (err, result) => {
        if (err) {
            console.log(err)
            res.send(err.sqlMessage)
        } else {
            if (result[0]) {
                if (await bcrypt.compare(password, result[0].password)) {
                    req.session.email = req.body.email
                    if (result[0].auth == "False") {
                        res.send('auth')
                    } else {
                        res.send('success')
                    }
                } else {
                    res.send('Incorrect Email and Password!')
                }
            } else {
                res.send('No user found with Email Address!')
            }
        }
    })
})

router.post('/search', (req, res, next) => {
    var { title, location } = req.body;
    let sql = "SELECT * FROM jobs";
    if (title) {
        sql = "SELECT * FROM jobs WHERE job_title LIKE '%" + title + "%'";
    }
    if (location) {
        sql = "SELECT * FROM jobs WHERE job_location = '" + location + "'";
    }
    if (title && location) {
        sql = "SELECT * FROM jobs WHERE job_title LIKE '%" + title + "%' AND job_location = '" + location + "'";
    }
    connection.query(sql, async (err, jobsData) => {
        if (err) {
            res.send(err)
        } else {
            res.render('users/browse-jobs', { email: req.session.email, jobsData, category: title ? title : 'All Jobs' })
        }
    })
})

router.get('/logout', (req, res, next) => {
    req.session.destroy();
    res.redirect('/login')
})

router.get('/initial-tables', async (req, res, next) => {
    var query = "CREATE TABLE users(name varchar(25), email varchar(50) PRIMARY KEY, phone varchar(10), password varchar(60), resume varchar(100), skills varchar(300), otp varchar(6), auth varchar(6));"
    await connection.query(query)

    var query2 = "CREATE TABLE organizations(org_name varchar(25), org_email varchar(50) PRIMARY KEY, org_phone varchar(10), org_password varchar(60), org_logo varchar(60));"
    await connection.query(query2)

    var query3 = "CREATE TABLE jobs(id INT AUTO_INCREMENT PRIMARY KEY, org_email varchar(50), job_title varchar(50), job_location varchar(20), job_type varchar(20), job_category varchar(30), job_desc varchar(5000), req_skills varchar(300), pay_1 varchar(30), pay_2 varchar(30), job_posted varchar(30), closing_date varchar(30), status varchar(20));"
    await connection.query(query3)

    var query4 = "CREATE TABLE apply(id INT AUTO_INCREMENT PRIMARY KEY, jobID varchar(5), org_email varchar(50), job_title varchar(50), user_email varchar(50), appliedON varchar(10), status varchar(20));"
    await connection.query(query4)

    res.redirect('/')
})

module.exports = router;