const express = require("express");
const router = express.Router();
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");

// appyling admin to all
router.all("/*", (req, res, next)=> {
    req.app.locals.layout = "admin";
    next();
});

// comment index page view route
router.get("/", (req, res)=> {
    Comment.find({})
        .lean()
        .then(comments=> {
            // Add a serial number to each comments object
            comments.forEach((comment, index) => {
                comment.serialNumber = index + 1;
            });
        res.render("admin/comments", {comments: comments});
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
                res.redirect(`/post/${post._id}`);
            })
        });
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