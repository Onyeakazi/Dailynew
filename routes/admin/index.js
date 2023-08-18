const express = require("express");
const router = express.Router();
const faker = require("faker");
const Post = require("../../models/Post");
const Category = require("../../models/Category");
const Comment = require("../../models/Comment");
const {userAuthenticated} = require("../../helpers/authentication");

// applying admin to all
router.all("/*", (req, res, next)=> {
    req.app.locals.layout = "admin";
    next();
});

// Admin Dashboard view router
router.get("/", (req, res) => {
    Post.count({}).then(postCount=> {
        Category.count({}).then(catCount=> {
            Comment.count({}).then(comCount=> {
                Comment.count({ approveComment: true }).then(approvedComCount => {
                    Comment.count({ approveComment: false }).then(unapprovedComCount => {
                        res.render("admin/index", {postCount: postCount, catCount: catCount, comCount: comCount, approvedComCount: approvedComCount, unapprovedComCount: unapprovedComCount });
                    });
                });
            });
        });
    });
});

router.post("/generate-fake-posts", (req, res)=>{
    for(let i = 0; i < req.body.amount; i++) {
        let post = new Post();

        post.title = faker.name.title();
        post.status = "public";
        post.allowComments = faker.datatype.boolean();
        post.body = faker.lorem.sentence();

        post.save();
    }
    res.redirect("/admin/posts"); 
});

module.exports = router;