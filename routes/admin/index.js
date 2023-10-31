const express = require("express");
const router = express.Router();
const Post = require("../../models/Post");
const User = require("../../models/User");
const Category = require("../../models/Category");
const Comment = require("../../models/Comment");
const {userAuthenticated} = require("../../helpers/authentication");

// applying admin to all
router.all("/*", (req, res, next)=> {
    req.app.locals.layout = "admin";
    next();
});

// Admin Dashboard view router
router.get("/", userAuthenticated, (req, res) => {
    // MODIFIED CODE
    const promises = [
        User.count().exec(),
        Post.count().exec(),
        Category.count().exec(),
        Comment.count().exec(),
        Comment.count({ approveComment: true }).exec(),
        Comment.count({ approveComment: false }).exec()
    ];

    Promise.all(promises).then(([ userCount, postCount, catCount, comCount, approvedComCount, unapprovedComCount]) => {
        res.render("admin/index", {
            userCount: userCount, 
            postCount: postCount, 
            catCount: catCount, 
            comCount: comCount, 
            approvedComCount: approvedComCount, 
            unapprovedComCount: unapprovedComCount
        });
    })


    // oLD CODE
    // Post.count({}).then(postCount=> {
    //     Category.count({}).then(catCount=> {
    //         Comment.count({}).then(comCount=> {
    //             Comment.count({ approveComment: true }).then(approvedComCount => {
    //                 Comment.count({ approveComment: false }).then(unapprovedComCount => {
    //                     res.render("admin/index", {postCount: postCount, catCount: catCount, comCount: comCount, approvedComCount: approvedComCount, unapprovedComCount: unapprovedComCount });
    //                 });
    //             });
    //         });
    //     });
    // });
});

module.exports = router;