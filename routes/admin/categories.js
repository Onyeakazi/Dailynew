const express = require("express");
const router = express.Router();
const Category = require("../../models/Category");
const {userAuthenticated} = require("../../helpers/authentication");

router.all("/*", (req, res, next)=> {
    req.app.locals.layout = "admin";
    next();
});

// view category route
router.get("/", userAuthenticated, (req, res) => {
    const perPage = 5;
    const page = req.query.page || 1;

    Category.find({})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean()
        .sort({ _id: -1 })
        .then(categories => {
            // Calculate the starting serial number for each page
            const startSerialNumber = (page - 1) * perPage + 1;
            // Add a serial number to each categories object
            categories.forEach((categorie, index) => {
                categorie.serialNumber = startSerialNumber + index;
            });
            Category.count({}).then(catCount=> {
                // Calculate the last serial number
                const lastSerialNumber = startSerialNumber + categories.length - 1;
                res.render("admin/categories/index", {
                    categories: categories,
                    current: parseInt(page),
                    pages: Math.ceil(catCount / perPage)});
            });
        });
});

// create category route
router.post("/create", (req, res) => {
    const newCategory = Category({
        name: req.body.name
    });
    newCategory.save().then(savedCategory => {
        req.flash("success_message", `${savedCategory.name} Category was created successfully!`);
        res.redirect("/admin/categories");
    })
});

// edit category page view  route
router.get("/edit/:slug", (req, res) => {
    Category.findOne({slug: req.params.slug})
        .lean()
        .then(categories => {
            res.render("admin/categories/edit", {categories: categories});
        });
});

//  edit category route
router.put("/edit/:slug", (req, res) => {
    Category.findOne({slug: req.params.slug})
        .then(categories => {
            categories.name = req.body.name;
            categories.save().then(updatedCategory =>{
                req.flash("success_message", `${updatedCategory.name} Category was updated successfully!`);
                res.redirect("/admin/categories");
            });
        });
});

//delete category route
router.delete("/:slug", (req, res)=> {
    Category.findOneAndDelete({slug: req.params.slug}).then(result=> {
        req.flash("success_message", `${result.name} Category has being deleted!`);
        res.redirect("/admin/categories");
    });
});

module.exports = router;