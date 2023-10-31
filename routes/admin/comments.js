const express = require("express");
const router = express.Router();
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");
const {userAuthenticated} = require("../../helpers/authentication");

// appyling admin to all
router.all("/*", (req, res, next)=> {
    req.app.locals.layout = "admin";
    next();
});

// comment index page view route
router.get("/", userAuthenticated, (req, res)=> {
    const perPage = 10;
    const page = req.query.page || 1;

    Comment.find({})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .sort({ _id: -1 })
        .then(comments=> {
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each comments object
            comments.forEach((comment, index) => {
                comment.serialNumber = startSerialNumber + index;
            });

            Comment.count({}).then(comCount=> {
                res.render("admin/comments", {
                    comments: comments,
                    current: parseInt(page),
                    pages: Math.ceil(comCount / perPage)
                });
            });
    });
});

// approved comment page view route
router.get("/approved-comments", (req, res)=> {
    const perPage = 10;
    const page = req.query.page || 1;

    Comment.find({ approveComment: true })
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .sort({ _id: -1 })
        .then(comments=> {
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each comments object
            comments.forEach((comment, index) => {
                comment.serialNumber = startSerialNumber + index ;
            });
            Comment.count({}).then(comCount=> {
                res.render("admin/comments/approved-comments", {
                    comments: comments,
                    current: parseInt(page),
                    pages: Math.ceil(comCount / perPage)
                });
            });
    });
});

// unapproved comment page view route
router.get("/unapproved-comments", (req, res)=> {
    const perPage = 10;
    const page = req.query.page || 1;

    Comment.find({ approveComment: false })
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .sort({ _id: -1 })
        .then(comments=> {
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each comments object
            comments.forEach((comment, index) => {
                comment.serialNumber = startSerialNumber + index;
            });
            Comment.count({}).then(comCount=> {
                res.render("admin/comments/unapproved-comments", {
                    comments: comments,
                    current: parseInt(page),
                    pages: Math.ceil(comCount / perPage)
                });
            });
    });
});

// submit comment route 
router.post("/", (req, res)=> {
    Post.findOne({_id: req.body.id}).then(post=> {
        const newComment = new Comment({
            name: req.body.name,
            email: req.body.email,
            body: req.body.body
        });
        post.comments.push(newComment);
        post.save().then(savedPost=> {
            newComment.save().then(savedComment=> {
                req.flash("success_message", "Comment Submitted Successfully");
                res.redirect(`/post/${post.slug}`);
            })
        });
    });
});

// Individual comment page view  route
router.get("/view_comment/:slug", (req, res) => {
    Comment.findOne({slug: req.params.slug})
        .lean()
        .then(comments => {
            res.render("admin/comments/view_comment", {comments: comments});
        });
});

// Delete comment route
router.delete("/:id", (req, res)=> {
    Comment.findOneAndDelete({_id: req.params.id}).then(deteledItm=> {
        Post.findOneAndUpdate({comments: req.params.id}, {$pull: {comments: req.params.id}}).then(dlt=>{
            res.redirect("/admin/comments");
        });
    });
});

// Ajax Switch Endpoint
router.post("/approve-comment", (req, res)=> {
    Comment.findByIdAndUpdate(req.body.id, {$set: {approveComment: req.body.approveComment}}).then(updated=> {
        res.send(updated);
    });
});
module.exports = router;