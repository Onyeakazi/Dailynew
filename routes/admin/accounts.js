const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const {userAuthenticated} = require("../../helpers/authentication");

// View All
router.all("/*", (req, res, next) => {
    req.app.locals.layout = "admin";
    next();
});

// View accounts Page router
router.get("/", userAuthenticated, (req, res)=> {
    const perPage = 10;
    const page = req.query.page || 1;
    User.find({})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .sort({ _id: -1 })
        .then(users=> {
        // Calculate the starting serial number for each page
        const startSerialNumber = (page - 1) * perPage + 1;
        // Add a serial number to each user object
        users.forEach((user, index) => {
            user.serialNumber = startSerialNumber + index;
        });
        User.count({}).then(accCount=> {
            res.render("admin/accounts", {
                users: users,
                current: parseInt(page),
                pages: Math.ceil(accCount / perPage)
            });
        });
    });
});

// Edit User Role view Router
router.get("/change-role/:slug", (req, res)=> {
    User.findOne({slug: req.params.slug}).lean().then(users=> {
        res.render("admin/accounts/change-role", {users: users});
    })
})

// Edit user role router
router.put("/change-role/:slug", (req, res)=> {
    User.findOne({slug: req.params.slug}).then(users=> {
        const previousRole = users.role;
        users.role = req.body.role;
        users.save().then(userUpdated=> {
            let roleChangeMessage = '';
            if (previousRole === 'admin' && userUpdated.role === 'user') {
                roleChangeMessage = `${users.firstName}'s account is now in user mode.`;
            } else if (previousRole === 'user' && userUpdated.role === 'admin') {
                roleChangeMessage = `${users.firstName}'s account is now in admin mode.`;
            } else {
                roleChangeMessage = `${users.firstName}'s role is unchanged.`;
            }
            req.flash("success_message", roleChangeMessage);
            res.redirect("/admin/accounts");
        })
    })
})

// Delete account users Router
router.delete("/:slug", (req, res)=> {
    User.findOneAndDelete({slug: req.params.slug}).then(userDlt=> {
        req.flash("success_message", `${userDlt.firstName}'s account has being deleted.`);
        res.redirect("/admin/accounts");
    })
})

module.exports = router;