const express = require("express");
const router = express.Router();
const Post = require("../../models/Post");
const Category = require("../../models/Category");
const { isEmpty, uploadDir } = require("../../helpers/upload-helper");
const fs = require("fs");
const {userAuthenticated} = require("../../helpers/authentication");
const axios = require("axios"); //Import the axios library
const cheerio = require('cheerio');
const path = require("path");


// Define a route to fetch news articles from The Guardian API
router.post("/fetch-news", async (req, res) => {
    try {
      // Your API key from The Guardian's developer portal
      const apiKey = 'd799126c-6649-4adb-8d94-e65161e06725';
      // The endpoint URL for fetching news articles
      const apiUrl = 'https://content.guardianapis.com/search';
      // Your desired search query
      const queries = req.body.query;
      // Specify the number of articles you want to retrieve
      const pageSize = req.body.posts; // Change this number to the desired count 
      // Define parameters for the API request
      const params = {
        q: queries,
        'api-key': apiKey,
        'page-size': pageSize,
      };
      // Make the API request
      const response = await axios.get(apiUrl, { params });
      // Extract the articles from the response
      const articles = response.data.response.results;

        // Save the articles to your database
        for (const article of articles) {
            // Fetch and log the text content of the article from its web URL
            const articleResponse = await axios.get(article.webUrl);
            const articleHtml = articleResponse.data;
            const $ = cheerio.load(articleHtml);
            const articleTextContent = $('article').text();

            // Extract the image URL from the article, assuming it's in a specific HTML element, e.g., <img src="...">
            const imageUrl = $('article img').attr('src');
            const imageDirectory = '../public/img/';

            // Download the image and save it to a file
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageFileName = `image_${Date.now()}.jpg`; //Generate a unique file name
            const imagePath = path.resolve(__dirname, '..', imageDirectory, imageFileName); // Construct the full path
            fs.writeFileSync(imagePath, imageResponse.data);

            // Replace special characters like '?' in the title
            const sanitizedTitle = article.webTitle.replace(/[?]/g, ' ');

            // Create new post object with image path
            const newPost = new Post({
                title: sanitizedTitle,
                body: articleTextContent,
                file: imageFileName, //Save the image name in the database
            });

            await newPost.save();
        }
        // Flash a success message
        req.flash('success_message', 'Posts saved to the database');

        // Redirect back to the form or a different page
        res.redirect("/admin/posts");
    } catch (error) {
        // Handle errors
        console.error('Error:', error.message);
        res.status(500).json({ error: 'An error occurred' });
    }
});

router.all("/*", (req, res, next)=> {
    req.app.locals.layout = "admin";
    next();
});

// VIEW ALL POST ROUTE
router.get("/", userAuthenticated, async (req, res) => {
    const perPage = 10;
    const page = req.query.page || 1;
    // Pulling the posts and category from the database and putting it in a variable
    Post.find({})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .populate("category")
        .sort({ _id: -1 })
        .then(posts=>{
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each post object
            posts.forEach((post, index) => {
                if (post.status === 'draft') {
                    post.statusClass = 'text-danger'; // For draft posts, set text color to red
                } else if (post.status === 'public') {
                    post.statusClass = 'text-success'; // For public posts, set text color to green
                } else {
                    post.statusClass = 'text-black'; // For unpublished posts, set text color to black
                }
                post.serialNumber = startSerialNumber + index;
            });

            Post.count({}).then(postCount=> {
                res.render("admin/posts", {
                    posts: posts,
                    current: parseInt(page),
                    pages: Math.ceil(postCount / perPage)
                });
            });

        }).catch(error=> {
            console.log(error);
        });
});

// VIEW ALL DRAFT POST ROUTE
router.get("/draft-posts", (req, res) =>{
    const perPage = 10;
    const page = req.query.page || 1;
    const draft = "draft"; // Specified the desired status here
    Post.find({ status: draft }) // Query for posts with the desired status
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .populate("category")
        .sort({ _id: -1 })
        .then(posts=>{
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each post object
            posts.forEach((post, index) => {
                post.serialNumber = startSerialNumber + index;
            });
            Post.count({ status: draft }).then(postCount=> {
                // Calculate the last serial number
                const lastSerialNumber = startSerialNumber + posts.length - 1;
                // Calculate the total number of pages
                const totalPages = Math.ceil(postCount / perPage);
                // Generate an array of page numbers for pagination
                const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

                res.render("admin/posts/draft-posts", {
                    posts: posts,
                    current: parseInt(page),
                    pages: totalPages,
                    pageNumbers: pageNumbers,
                });
            })
        }).catch(error=> {
            console.log(error);
        });
});

// VIEW ALL PUBLIC POST ROUTE
router.get("/public-posts", (req, res) =>{
    const perPage = 10;
    const page = req.query.page || 1;
    const public = "public"; // Specified the desired status here
    Post.find({ status: public }) // Query for posts with the desired status
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .populate("category")
        .sort({ _id: -1 })
        .then(posts=>{
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each post object
            posts.forEach((post, index) => {
                post.serialNumber = startSerialNumber + index;
            });
            Post.count({ status: public }).then(postCount => {
                // Calculate the last serial number
                const lastSerialNumber = startSerialNumber + posts.length - 1;
                // Calculate the total number of pages
                const totalPages = Math.ceil(postCount / perPage);
                // Generate an array of page numbers for pagination
                const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

                res.render("admin/posts/public-posts", {
                    posts: posts,
                    current: parseInt(page),
                    pages: totalPages,
                    pageNumbers: pageNumbers,
                });
            });
        }).catch(error=> {
            console.log(error);
        });
});

// VIEW ALL Highlight News POST ROUTE
router.get("/highlight_news", (req, res) =>{
    const perPage = 10;
    const page = req.query.page || 1;
    const highlight_news = "highlight_news"; // Specified the desired status here
    Post.find({ news: highlight_news }) // Query for posts with the desired status
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .populate("category")
        .sort({ _id: -1 })
        .then(posts=>{
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each post object
            posts.forEach((post, index) => {
                post.serialNumber = startSerialNumber + index;
            });
            Post.count({ news: highlight_news }).then(postCount => {
                // Calculate the last serial number
                const lastSerialNumber = startSerialNumber + posts.length - 1;
                // Calculate the total number of pages
                const totalPages = Math.ceil(postCount / perPage);
                // Generate an array of page numbers for pagination
                const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

                res.render("admin/posts/highlight_news", {
                    posts: posts,
                    current: parseInt(page),
                    pages: totalPages,
                    pageNumbers: pageNumbers,
                });
            });
        }).catch(error=> {
            console.log(error);
        });
});

// VIEW ALL Side Highlight News POST ROUTE
router.get("/side_highlight_news", (req, res) =>{
    const perPage = 10;
    const page = req.query.page || 1;
    const side_highlight_news = "side_highlight_news"; // Specified the desired status here
    Post.find({ news: side_highlight_news }) // Query for posts with the desired status
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .populate("category")
        .sort({ _id: -1 })
        .then(posts=>{
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each post object
            posts.forEach((post, index) => {
                post.serialNumber = startSerialNumber + index;
            });
            Post.count({ news: side_highlight_news }).then(postCount => {
                // Calculate the last serial number
                const lastSerialNumber = startSerialNumber + posts.length - 1;
                // Calculate the total number of pages
                const totalPages = Math.ceil(postCount / perPage);
                // Generate an array of page numbers for pagination
                const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
                res.render("admin/posts/side_highlight_news", {
                    posts: posts,
                    current: parseInt(page),
                    pages: totalPages,
                    pageNumbers: pageNumbers,
                });
            });
        }).catch(error=> {
            console.log(error);
        });
});

// VIEW ALL Breaking News POST ROUTE
router.get("/breaking_news", (req, res) =>{
    const perPage = 10;
    const page = req.query.page || 1;
    const breaking_news = "breaking_news"; // Specified the desired status here
    Post.find({ news: breaking_news }) // Query for posts with the desired status
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .populate("category")
        .sort({ _id: -1 })
        .then(posts=>{
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each post object
            posts.forEach((post, index) => {
                post.serialNumber = startSerialNumber + index;
            });
            Post.count({ news: breaking_news }).then(postCount => {
                // Calculate the last serial number
                const lastSerialNumber = startSerialNumber + posts.length - 1;
                // Calculate the total number of pages
                const totalPages = Math.ceil(postCount / perPage);
                // Generate an array of page numbers for pagination
                const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

                res.render("admin/posts/breaking_news", {
                    posts: posts,
                    current: parseInt(page),
                    pages: totalPages,
                    pageNumbers: pageNumbers,
                });
            });
        }).catch(error=> {
            console.log(error);
        });
});

// VIEW ALL Featured News POST ROUTE
router.get("/featured_news", (req, res) =>{
    const perPage = 10;
    const page = req.query.page || 1;
    const featured_news = "featured_news"; // Specified the desired status here
    Post.find({ news: featured_news }) // Query for posts with the desired status
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .populate("category")
        .sort({ _id: -1 })
        .then(posts=>{
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each post object
            posts.forEach((post, index) => {
                post.serialNumber = startSerialNumber + index;
            });
            Post.count({ news: featured_news }).then(postCount => {
                // Calculate the last serial number
                const lastSerialNumber = startSerialNumber + posts.length - 1;
                // Calculate the total number of pages
                const totalPages = Math.ceil(postCount / perPage);
                // Generate an array of page numbers for pagination
                const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

                res.render("admin/posts/featured_news", {
                    posts: posts,
                    current: parseInt(page),
                    pages: totalPages,
                    pageNumbers: pageNumbers,
                });
            });
        }).catch(error=> {
            console.log(error);
        });
});

// VIEW ALL Latest News POST ROUTE
router.get("/latest_news", (req, res) =>{
    const perPage = 10;
    const page = req.query.page || 1;
    const latest_news = "latest_news"; // Specified the desired status here
    Post.find({ news: latest_news }) // Query for posts with the desired status
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .populate("category")
        .sort({ _id: -1 })
        .then(posts=>{
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each post object
            posts.forEach((post, index) => {
                post.serialNumber = startSerialNumber + index;
            });
            Post.count({ news: latest_news }).then(postCount => {
                // Calculate the last serial number
                const lastSerialNumber = startSerialNumber + posts.length - 1;
                // Calculate the total number of pages
                const totalPages = Math.ceil(postCount / perPage);
                // Generate an array of page numbers for pagination
                const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

                res.render("admin/posts/latest_news", {
                    posts: posts,
                    current: parseInt(page),
                    pages: totalPages,
                    pageNumbers: pageNumbers,
                });
            });
        }).catch(error=> {
            console.log(error);
        });
});

// VIEW ALL Trending News POST ROUTE
router.get("/trending_news", (req, res) =>{
    const perPage = 10;
    const page = req.query.page || 1;
    const trending_news = "trending_news"; // Specified the desired status here
    Post.find({ news: trending_news }) // Query for posts with the desired status
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .populate("category")
        .sort({ _id: -1 })
        .then(posts=>{
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each post object
            posts.forEach((post, index) => {
                post.serialNumber = startSerialNumber + index;
            });
            Post.count({ news: trending_news }).then(postCount => {
                // Calculate the last serial number
                const lastSerialNumber = startSerialNumber + posts.length - 1;
                // Calculate the total number of pages
                const totalPages = Math.ceil(postCount / perPage);
                // Generate an array of page numbers for pagination
                const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

                res.render("admin/posts/trending_news", {
                    posts: posts,
                    current: parseInt(page),
                    pages: totalPages,
                    pageNumbers: pageNumbers,
                });
            });
        }).catch(error=> {
            console.log(error);
        });
});

// VIEW ALL Popular News POST ROUTE
router.get("/popular_news", (req, res) =>{
    const perPage = 10;
    const page = req.query.page || 1;
    const popular_news = "popular_news"; // Specified the desired status here
    Post.find({ news: popular_news }) // Query for posts with the desired status
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .populate("category")
        .sort({ _id: -1 })
        .then(posts=>{
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each post object
            posts.forEach((post, index) => {
                post.serialNumber = startSerialNumber + index;
            });
            Post.count({ news: popular_news }).then(postCount => {
                // Calculate the last serial number
                const lastSerialNumber = startSerialNumber + posts.length - 1;
                // Calculate the total number of pages
                const totalPages = Math.ceil(postCount / perPage);
                // Generate an array of page numbers for pagination
                const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

                res.render("admin/posts/popular_news", {
                    posts: posts,
                    current: parseInt(page),
                    pages: totalPages,
                    pageNumbers: pageNumbers,
                });
            });
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
            news: req.body.news,
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
router.get("/edit/:slug", (req, res)=>{

    Post.findOne({slug: req.params.slug})
        .lean()
        .then(posts=>{
        Category.find({}).lean().then(categories=> {
            res.render("admin/posts/edit", {posts: posts, categories:categories});
        });
    });
});

// UPDATE POST ROUTE
router.put("/edit/:slug", (req, res)=> {
    Post.findOne({slug: req.params.slug})
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
            posts.news = req.body.news;

            if(!isEmpty(req.files)) {
                let file = req.files.file;
                filename = Date.now() + "-" + file.name;
                posts.file = filename;
            
                file.mv("./public/uploads/" + filename, (err) => {
                    if(err) throw err;
                });
            }
            posts.save().then(updatedpost =>{
                req.flash("success_message", `Post ${updatedpost.title} was updated successfully`);
                res.redirect("/admin/posts");
            });
    });
});

// POST DELETE ROUTE
router.delete("/:slug", (req, res)=> {
    Post.findOneAndDelete({slug: req.params.slug})
        .populate("comments")
        .then(post => {
            fs.unlink(uploadDir + post.file, (err)=> {
                // checking the comment array
                if(!post.comments.length < 1) {
                    post.comments.forEach(comment=> {
                        comment.remove();
                    });
                };
                req.flash("success_message", `Post was Deleted`);
                res.redirect("/admin/posts");
            });
        });
});

// Search bar router
router.post("/admin_Search", (req, res) => {
    const query = req.body.q.toLowerCase(); // Get the search query from the URL query parameter
    const perPage = 10;
    const page = req.query.page || 1;
  
    // Query the database for posts that match the search query
    Post.find({ $text: { $search: query } }) //Use the $text operator for text search
        .populate("category")
        .lean()
        .then((posts) => {
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each post object
            posts.forEach((post, index) => {
                if (post.status === 'draft') {
                    post.statusClass = 'text-danger'; // For draft posts, set text color to red
                } else if (post.status === 'public') {
                    post.statusClass = 'text-success'; // For public posts, set text color to green
                } else {
                    post.statusClass = 'text-black'; // For unpublished posts, set text color to black
                }
                post.serialNumber = startSerialNumber + index;
            });
            // Render a template to display the search results (create this template)
            res.render("admin/posts/searchBar", { posts});
        })
  });

module.exports = router;