const express = require("express");
const router = express.Router();
const Category = require("../../models/Category");

router.all("/*", (req, res, next)=> {
    req.app.locals.layout = "admin";
    next();
});

// view category route
router.get("/", (req, res) => {
    Category.find({})
        .lean()
        .then(categories => {
            res.render("admin/categories/index", {categories: categories});
        });
});

// create category route
router.post("/create", (req, res) => {
    const newCategory = Category({
        name: req.body.name
    });

    newCategory.save().then(savedCategory => {
        res.redirect("/admin/categories");
    })
});

// edit category page view  route
router.get("/edit/:id", (req, res) => {
    Category.findOne({_id: req.params.id})
        .lean()
        .then(categories => {
            res.render("admin/categories/edit", {categories: categories});
        });
});

//  category route
router.put("/edit/:id", (req, res) => {
    Category.findOne({_id: req.params.id})
        .then(categories => {

            categories.name = req.body.name;

            categories.save().then(updatedCategory =>{
                req.flash("success_message", "Category was updated successfully");
                res.redirect("/admin/categories");
            });
        });
});

//delete category route
router.delete("/:id", (req, res)=> {
    Category.findOneAndDelete({_id: req.params.id}).then(result=> {
        req.flash("success_message", "Category has being deleted!");
        res.redirect("/admin/categories");
    })
})


module.exports = router;