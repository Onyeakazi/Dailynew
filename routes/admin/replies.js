const express = require("express");
const router = express.Router();
const Replies = require("../../models/Replies");
const Comment = require("../../models/Comment");
const {userAuthenticated} = require("../../helpers/authentication");

// appyling admin to all
router.all("/*", (req, res, next)=> {
    req.app.locals.layout = "admin";
    next();
});

// replies index page view route
router.get("/", userAuthenticated, (req, res)=> {
    const perPage = 10;
    const page = req.query.page || 1;
    Replies.find({})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .populate({
            path: 'comment',
            populate: { path: 'user' } // Populate the comment's user field
        })
        .sort({ _id: -1 })
        .then(reply=> {
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each comments object
            reply.forEach((reply, index) => {
                reply.serialNumber = startSerialNumber + index;
                reply.commentName = reply.comment.name;
            });
            Replies.count({}).then(repCount=> {
                res.render("admin/replies", {
                    reply: reply,
                    current: parseInt(page),
                    pages: Math.ceil(repCount / perPage)
                });
            });
    });
});

// submit replies route
router.post("/", (req, res) => {
    const commentId = req.body.commentId; //Assuming you send it as a field in your form
    Comment.findOne({ _id: commentId }).then(comment => {
        const newReply = new Replies ({
            name: req.body.name,
            body: req.body.reply,
            comment: commentId
        });
        comment.replies.push(newReply);
        comment.save().then(savedCom=> {
            newReply.save().then(savedReply=> {
                req.flash('success_message', 'Reply Sent Successfully'); 
                res.redirect(req.get('referer'));
            });
        });
    });
});

// Individual comment page view  route
router.get("/view_reply/:slug", (req, res) => {
    Replies.findOne({slug: req.params.slug})
        .populate("comment")
        .lean()
        .then(reply => {
            const commentUserName = reply.comment.name;
            const commentUserBody = reply.comment.body;
            res.render("admin/replies/view_reply", {reply: reply, commentUserName: commentUserName, commentUserBody: commentUserBody});
        });
});

// // Delete comment route
router.delete("/:id", (req, res)=> {
    Replies.findOneAndDelete({_id: req.params.id}).then(deteledItm=> {
        Comment.findOneAndUpdate({replies: req.params.id}, {$pull: {replies: req.params.id}}).then(dlt=>{
            req.flash("success_message", `${deteledItm.name}'s reply has being deleted!`);
            res.redirect("/admin/replies");
        });
    });
});
module.exports = router;