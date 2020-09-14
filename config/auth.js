module.exports = {
  ensureAuthenticated: function (req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'user') {
      return next();
    }
    req.flash('error_msg', 'Please log in as `user` to view that resource');
    res.redirect('/Not-Allowed');
  },
  adminEnsureAuthenticated: function (req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    req.flash('error_msg', 'Please log as `Admin` in to view that resource');
    res.redirect('/Not-Allowed');
  },
  forwardAuthenticated: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/portal');
  },
  roleAuthenticated: (role) => {
    return (req, res, next) => {
      if (req.user.role !== role) {
        res.status(401);
        req.flash('error_msg', 'You are not allow enter this page.');
        return;
      }
      next();
    };
  },
};
