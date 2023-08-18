const express = require("express");
const router = express.Router();
const Post = require("../../models/Post");
const Category = require("../../models/Category");
const { isEmpty, uploadDir } = require("../../helpers/upload-helper");
const fs = require("fs");
const {userAuthenticated} = require("../../helpers/authentication");

router.all("/*", (req, res, next)=> {
    req.app.locals.layout = "admin";
    next();
});

// VIEW ALL POST ROUTE
router.get("/", (req, res) =>{
    
    Post.find({})
        .lean()
        .populate("category")
        .then(posts=>{
            // Add a serial number to each post object
            posts.forEach((post, index) => {
                post.serialNumber = index + 1;
            });
            res.render("admin/posts", {posts: posts});
        }).catch(error=> {
            console.log(error);
    });
});

// VIEW CREAT PAGE ROUTE
router.get("/create", (req, res) =>{
    Category.find({}).lean().then(categories=> {
        res.render("admin/posts/create", {categories: categories});
    })
});

// CREATE POST ROUTE
router.post("/create", (req, res) =>{

    let errors = [];

    if(!req.body.title) {
        errors.push({message: "Enter Title."});
    }
    
    if(!req.body.body) {
        errors.push({message: "Enter Your Description."});
    }

    if(errors.length > 0) {
        res.render("admin/posts/create", {
            errors: errors
        });
    } else {

        let filename = "placeholder.png";

        if(!isEmpty(req.files)) {
            let file = req.files.file;
            filename = Date.now() + "-" + file.name;
        
            file.mv("./public/uploads/" + filename, (err) => {
                if(err) throw err;
            });
        }

        let allowComments = true;

        if(req.body.allowComments) {
            allowComments = true;
        } else {
            allowComments = false;
        }

        const newPost = new Post({
        
            user: req.user._id,
            title: req.body.title,
            status: req.body.status,
            allowComments: allowComments,
            body: req.body.body,
            category: req.body.category,
            file: filename

        });
        
        newPost.save().then(savedPost => {
            req.flash("success_message", `Post was created successfully`);
            res.redirect("/admin/posts");
        }).catch(error => {
            console.log("Unable to Save Post" + error);
        });
    }

});

// EDIT POST PAGE View ROUTE 
router.get("/edit/:id", (req, res)=>{

    Post.findOne({_id: req.params.id})
        .lean()
        .then(posts=>{
        Category.find({}).lean().then(categories=> {
            res.render("admin/posts/edit", {posts: posts, categories:categories});
        });
    });

});

// UPDATE POST ROUTE
router.put("/edit/:id", (req, res)=> {

    Post.findOne({_id: req.params.id})
        .then(posts=>{
        
            if(req.body.allowComments) {
                allowComments = true;
            } else {
                allowComments = false;
            }

            posts.user = req.user._id;
            posts.title = req.body.title;
            posts.status = req.body.status;
            posts.allowComments = allowComments;
            posts.body = req.body.body;
            posts.category = req.body.category;

            if(!isEmpty(req.files)) {
                let file = req.files.file;
                filename = Date.now() + "-" + file.name;
                posts.file = filename;
            
                file.mv("./public/uploads/" + filename, (err) => {
                    if(err) throw err;
                });
            }

            posts.save().then(updatedpost =>{
                req.flash("success_message", `Post was updated successfully`);
                res.redirect("/admin/posts");
            });
    });
});

// POST DELETE ROUTE
router.delete("/:id", (req, res)=> {
    Post.findOneAndDelete({_id: req.params.id})
        .populate("comments")
        .then(post => {

            fs.unlink(uploadDir + post.file, (err)=> {
                
                // checking the comment array
                if(!post.comments.length < 1) {
                    post.comments.forEach(comment=> {
                        comment.deleteOne();
                    });
                }

                post.deleteOne().then(removed=> {
                    req.flash("success_message", `Post was Deleted`);
                    res.redirect("/admin/posts");
                });
            })
        });
});

module.exports = router;