const express = require("express");
const router = express.Router();
const Post = require("../../models/Post");
const Contact_page = require("../../models/Contact_page");
const About_page = require("../../models/About_page");
const Category = require("../../models/Category");
const Comment = require("../../models/Comment");
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
    Post.find({ status: 'public' })
        .lean()  
        .sort({ _id: -1 })
        .populate('category')
        .populate('user') 
        .populate({
            path: 'comments',
            match: { approveComment: true } // Only populate approved comments
        })
        .then(posts => {
            // Loop through the posts and count approved comments for each
            posts.forEach(post => {
                post.approvedComCount = post.comments.length;
            });
            Post.count({}).then(postCount=> {
                Category.find({}).lean().then(categories => {
                    Contact_page.findOne({}).lean().then(page => {
                        res.render("home/index", {
                            posts: posts, 
                            categories: categories,
                            page: page
                        });
                    });
                });
            });
    });
});

// Single post Page ROUTE
router.get("/post/:slug", (req, res) => {
    Post.findOne({slug: req.params.slug})
        .lean()
        .populate({path: "comments", match: {approveComment: true}, populate: { path: "replies" }})
        .populate("category")
        .populate("user")
        .then(post=> {
            // Count the number of approved comments for this post
            const approvedComCount = post.comments.length;
            Category.find({}).lean().then(categories => {
                Post.find({ status: 'public' }).lean().populate('category').then(posts => {
                    Contact_page.findOne({}).lean().then(page => {
                        res.render("home/post", {post: post, categories: categories, approvedComCount: approvedComCount, posts:posts, page:page});
                    });
                });
            });
        });
});

// View news by category
router.get("/category/:id", (req, res) => {
    const categoryId = req.params.id; // Assuming categoryId corresponds to _id
    // Find the category of the provided post
    Post.findOne({ _id: categoryId })
      .lean()
      .then((post) => {
        // Use the category ObjectId to find other posts with the same category
        const categoryObjectId = post.category;
        Category.find({}).lean().then(categories => {
            Post.find({ category: categoryObjectId, status: 'public' })
            .lean()
            .populate('category')
            .populate('user') 
            .then((posts1) => {
                Post.find({ status: 'public' }).lean().populate("category").then(posts=> {
                    Contact_page.findOne({}).lean().then(page => {
                        res.render("home/news_categories", { posts1, categories, posts: posts1, page: page });
                    });
                })
            })
        })
    })
});

router.get("/categories/:id", (req, res) => {
  const categoryId = req.params.id;
  // Find the category based on the provided categoryId
  Category.findOne({ _id: categoryId })
    .lean()
    .then((category) => {
      // Use the category ObjectId to find posts with the same category and status 'public'
      Post.find({ category: category._id, status: 'public' })
        .lean()
        .populate('category')
        .populate('user')
        .then((posts1) => {
          // Find all categories (if needed)
          Category.find({})
            .lean()
            .then((categories) => {
                Contact_page.findOne({}).lean().then(page => {
                    // Render the template with the filtered posts and categories
                    res.render("home/news_categories", { posts1, categories, posts: posts1, page: page });
                });
            });
        });
    });
});

// Search bar router
router.get("/search", (req, res) => {
    const query = req.query.q.toLowerCase(); //Get the search query from the URL query parameter
    // Query the database for relevant data (e.g., posts) based on the search query
    Post.find({
      $or: [
        { title: { $regex: query, $options: "i" } }, // Case-insensitive title search
        { body: { $regex: query, $options: "i" } }, // Case-insensitive content search
      ],
    })
      .lean()
      .populate('category')
      .populate('user')
      .then((searchResults) => {
        Category.find({})
            .lean()
            .then((categories) => {
            // Render the search results template and pass the searchResults data
            res.render("home/search", { searchResults, categories, posts:searchResults});
        })
      })
      .catch((error) => {
        console.error("Error searching the database:", error);
        res.status(500).send("Internal Server Error");
      });
});
  
// ABOUT PAGE ROUTE
router.get("/about", (req, res) => {
    Post.find({ status: 'public' })
        .lean()
        .populate('category')
        .then(posts => {
          Category.find({}).lean().then(categories => {
                About_page.findOne({}).lean().then(about => {
                    Contact_page.findOne({}).lean().then(page => {
                        res.render("home/about", {posts: posts, about: about, categories: categories, page:page});
                    });
                })
            });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Internal Server Error");
        });
});
  
// Contact PAGE ROUTE
router.get("/contact", (req, res) => {
    Post.find({ status: 'public' })
        .lean()
        .populate('category')
        .then(posts => {
          Category.find({}).lean().then(categories => {
                Contact_page.findOne({}).lean().then(page => {
                    res.render("home/contact", {posts: posts, page: page, categories: categories});
                })
            });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Internal Server Error");
        });
});

// LOGIN PAGE VIEW ROUTE
router.get("/login", (req, res) => {
    Post.find({ status: 'public' })
    .lean()
    .populate('category')
    .then(posts => {
      Category.find({}).lean().then(categories => {
            Contact_page.findOne({}).lean().then(page => {
                res.render("home/login", {posts: posts, categories: categories, page:page});
            });
        });
    });
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

passport.serializeUser(function(user, done) {
    done(null, {_id: user.id, role: user.role})
});

passport.deserializeUser(function(id, done) {
    User.findById(id).lean().then(user => {
        done(null, user);
    }) 
});

// login route
function authenticateUser(req, res, next) {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            // Authentication failed, flash a generic error message
            req.flash("error", "Invalid email or password.");
            return res.redirect("/login");
        }
        // Authentication succeeded
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            // Check the user's role (assuming you have a 'role' property in your user model)
            if (user.role === 'admin') {
                // Redirect admin to /admin
                return res.redirect("/admin");
            } else {
                // Redirect regular user to /user or any other appropriate route
                return res.redirect("/");
            }
        });
    })(req, res, next);
}
router.post("/login", authenticateUser);

// logout route
router.get("/logout", (req, res)=> {
    req.logOut(function() {
        req.flash("success_message", "Logged Out.");
        res.redirect("/login");
    });
})
  
// REGISTER PAGE VIEW ROUTE
router.get("/register", (req, res) => {
    Post.find({ status: 'public' })
    .lean()
    .populate('category')
    .then(posts => {
      Category.find({}).lean().then(categories => {
            Contact_page.findOne({}).lean().then(page => {
                res.render("home/register", {posts: posts, categories: categories, page:page});
            });
        });
    })
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
                let role = "user";
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
                    terms: terms,
                    role: role
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

module.exports = router;