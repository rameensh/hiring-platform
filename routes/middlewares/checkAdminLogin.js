module.exports = (req, res, next) => {
    if (req.session.admin_email) {
        next();
    } else {
        res.redirect("/admin/login");
    }
};