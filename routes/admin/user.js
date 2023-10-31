const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const { isEmpty, uploadDir } = require("../../helpers/upload-helper");
const fs = require("fs");
const {userAuthenticated} = require("../../helpers/authentication");
const bcrypt = require("bcryptjs");

router.all("/*", (req, res, next)=> {
    req.app.locals.layout = "admin";
    next();
});

// view UserProfile page route
router.get("/", userAuthenticated, (req, res) => {
    User.find({})
        .lean()
        .then(users => {
            res.render("admin/user/users", {users: users});
        });
});

// Updating the profile
router.post("/", (req, res) => {
    // Find the user by ID
    User.findById(req.user._id)
        .then(user => {
            // Update user fields with data from req.body
            user.fullName = req.body.fullName;
            user.company = req.body.company;
            user.phone = req.body.phone;
            user.email = req.body.email;
            // Check if req.files exists and is an object before processing it
            if (req.files && typeof req.files === 'object' && Object.keys(req.files).length !== 0) {
                let file = req.files.file;
                filename = Date.now() + "-" + file.name;
                user.file = filename;

                file.mv("./public/uploads/" + filename, (err) => {
                    if (err) throw err;
                });
            }
            // Save the updated user instance
            user.save().then(updatedUser => {
                    req.flash("success_message", "Profile Updated.");
                    res.redirect("/admin/user"); // Redirect to the appropriate URL
                })
        });
});

// Ajax User profile delete Endpoint
router.post("/delete-profile", (req, res)=> {
    User.findById(req.user._id)
      .then(userProfile => {
        if (userProfile.file) {
            fs.unlink(uploadDir + userProfile.file, (err)=> {});
        }
         // Set the user's file property to empty string to remove the reference to the file
         userProfile.file = "default.png";
         userProfile.save()
                .then(updatedUser => {
                    res.redirect("/admin/user");
                })
        });
});

// Ajax User password change Endpoint
router.post("/change-password", (req, res)=> { 
    // Access the form data from the request body
    const formData = req.body;
    //Find the user by ID
    User.findOne(req.user._id).then(user=> {
        bcrypt.compare(formData.currentPassword, user.password, (err, matched)=> {
            if(matched) {
                const newPassword = formData.newPassword;
                const confirmPassword = formData.confirmPassword; //Assuming the field name is "confirmPassword"
                // Check if the new password and confirm password match
                if (newPassword !== confirmPassword) {
                     // Return a JSON response indicating the error
                     return res.status(400).json({ error_message: "New password and confirm password do not match." });
                }
                // crypting the password with salt 
                bcrypt.genSalt(10, (err, salt)=> {
                    // hashing the password
                    bcrypt.hash(newPassword, salt, (err, hash)=> {
                        // converting the hashed password 
                        user.password = hash;
                        user.save().then(savedUser => {
                            // Return a JSON response indicating success
                            return res.status(200).json({ success_message: "Password Changed." });
                            res.redirect("/admin/user");
                        });
                    });
                });
            } else {
                // Return a JSON response indicating incorrect current password
                return res.status(400).json({ error_message: "Current Password Do not Match" });
            }
        });
    });
});

module.exports = router;