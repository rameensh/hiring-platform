module.exports = (req, res, next) => {
    if (req.session.org_email) {
        next();
    } else {
        res.redirect("/organization/login");
    }
};