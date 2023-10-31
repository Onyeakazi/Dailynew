const express = require("express");
const router = express.Router();
const Contact_page = require("../../models/Contact_page");
const About_page = require("../../models/About_page");
const {userAuthenticated} = require("../../helpers/authentication");

router.all("/*", (req, res, next)=> {
    req.app.locals.layout = "admin";
    next();
});

//Cantact Page view router
router.get("/contact", userAuthenticated, (req, res)=> {
    Contact_page.findOne({}).lean().then(page => {
        res.render("admin/pages/contact", { page:page });
    })
});

//Edit Cantact Page router
router.post('/edit', (req, res) => {
    const { location, email, phone, contact_info, pageId } = req.body;
    // Find the existing data in the database
    Contact_page.findById(pageId)
        .then(existingPage => {
            if (!existingPage) {
                res.status(404).send('Page not found');
                return;
            }
            // Update only the fields that were changed
            if (location !== undefined) {
                existingPage.location = location;
            }
            if (email !== undefined) {
                existingPage.email = email;
            }
            if (phone !== undefined) {
                existingPage.phone = phone;
            }
            if (contact_info !== undefined) {
                existingPage.contact_info = contact_info;
            }
            // Save the updated data to the database
            return existingPage.save();
        })
        .then(() => {
            req.flash("success_message", `Page updated successfully`);
            res.redirect('/admin/pages/contact');
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('An error occurred while updating data');
        });
});

// About Page view router
router.get("/about", (req, res)=> {
    About_page.findOne({}).lean().then(about => {
        res.render("admin/pages/about", { about:about});
    });
});

//Edit About Page router
router.post('/edit2', (req, res) => {
    const { our_mission, our_vision, our_services } = req.body;
    // Find the existing data in the database
    About_page.findOne()
        .then(existingPage => {
            if (!existingPage) {
                // If no existing data, create a new instance
                const newAboutPage = new About_page({
                    our_mission,
                    our_vision,
                    our_services,
                });
                return newAboutPage.save(); // Save the new record
            }
            // Update only the fields that were changed
            if (our_mission !== undefined) {
                existingPage.our_mission = our_mission;
            }
            if (our_vision !== undefined) {
                existingPage.our_vision = our_vision;
            }
            if (our_services !== undefined) {
                existingPage.our_services = our_services;
            }
            // Save the updated data to the database
            return existingPage.save();
        })
        .then(() => {
            req.flash("success_message", `Page updated successfully`);
            res.redirect('/admin/pages/about');
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('An error occurred while updating data');
        });
});

module.exports = router;