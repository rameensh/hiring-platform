const express = require('express');
const dotenv = require('dotenv');
const session = require('express-session');

const app = express()
dotenv.config()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))

app.set('view engine', 'ejs');

app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/img', express.static(__dirname + 'public/img'))
app.use('/fonts', express.static(__dirname + 'public/fonts'))
app.use('/scripts', express.static(__dirname + 'public/scripts'))

const userRoute = require('./routes/users/login')
const jobRoute = require('./routes/users/job')

const orgRoute = require('./routes/org/login')
const orgJobsRoute = require('./routes/org/manageJobs')

const adminRoute = require('./routes/admin/login')

app.use('/', userRoute)
app.use('/job', jobRoute)

app.use('/organization', orgRoute)
app.use('/organization/jobs', orgJobsRoute)

app.use('/admin', adminRoute)

module.exports = app;