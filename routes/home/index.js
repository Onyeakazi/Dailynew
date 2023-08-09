const express = require("express");
const router = express.Router();
const Post = require("../../models/Post");
const Category = require("../../models/Category");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

router.all("/*", (req, res, next)=> {
    req.app.locals.layout = "home";
    next();
});

// HOME PAGE ROUTE
router.get("/", (req, res) => {

    // Pulling the posts and category from the database and putting it in a variable
    Post.find({}).lean().then(posts => {
        Category.find({}).lean().then(categories => {
            res.render("home/index", {posts: posts, categories: categories});
        });
    });

});
  
// ABOUT PAGE ROUTE
router.get("/about", (req, res) => {
    res.render("home/about");
});
  
// LOGIN PAGE VIEW ROUTE
router.get("/login", (req, res) => {
    res.render("home/login");
});

// LOGIN PAGE ROUTE

passport.use(new LocalStrategy({usernameField: "email"}, (email, password, done)=> {
    User.findOne({email: email}).then(user=> {
        if(!user) return done(null, false, {message: "No user found!"});

        bcrypt.compare(password, user.password, (err, matched)=> {
            if(err) return err;

            if(matched) {
                return done(null, user);
            } else {
                return done(null, false, { message: "Incorrect password."});
            }

            
        });
    })
}));

router.post("/login", (req, res, next) => {

    // passport password authentication
    passport.authenticate("local", {
        successRedirect: "/admin",
        failureRedirect: "/login",
        failureFlash: true
    })(req, res, next);
});
  
// REGISTER PAGE VIEW ROUTE
router.get("/register", (req, res) => {
    res.render("home/register");
});

// REGISTER form ROUTE
router.post("/register", (req, res) => {
    let errors = [];

    if(!req.body.firstName) {
        errors.push({message: "Enter First name."});
    }
    
    if(!req.body.lastName) {
        errors.push({message: "Enter Last name."});
    }

    if(!req.body.email) {
        errors.push({message: "Enter Email."});
    }

    if(req.body.password !== req.body.confirmPassword) {
        errors.push({message: "Your passwords do not match!"});
    }

    if(errors.length > 0) {
        res.render("home/register", {
            errors: errors,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email
        });
    } else {

        User.findOne({email: req.body.email}).then(user=> {

            if(!user) {

                let terms = false;

                if(req.body.terms) {
                    terms = true;
                } else {
                    terms = false;
                }
        
                const newUser = new User({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: req.body.password,
                    terms: terms
            
                });
        
                // crypting the password with salt 
                bcrypt.genSalt(10, (err, salt)=> {
                    // hashing the password
                    bcrypt.hash(newUser.password, salt, (err, hash)=> {
        
                        // converting the hashed password 
                        newUser.password = hash;
                                
                        newUser.save().then(savedUser => {
                            req.flash("success_message", "Account created, proceed to login.");
                            res.redirect("/login");
                        });
                    });
                });

            } else {
                req.flash("error_message", "Email already exist, please login!");
                res.redirect("/login");
            }
        });
    }
});

// Single post Page ROUTE
router.get("/post/:id", (req, res) => {
    Post.findOne({_id: req.params.id}).lean().then(post=> {
            Category.find({}).lean().then(categories => {
            res.render("home/post", {post: post, categories: categories});
        });
    });
});

module.exports = router;