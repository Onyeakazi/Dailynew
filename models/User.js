const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const UserSchema = new Schema({

    firstName: {
        type: String,
        required: true
    },

    lastName: {
        type: String,
        required: true
    },

    file: {
        type: String
    },

    email: {
        type: String,
        required: true
    },

    role: {
        type: "String"
    },

    phone: {
        type: String
    },

    company: {
        type: String
    },

    password: {
        type: String,
        required: true
    },

    slug: {
        type: String,
    },

    terms: {    
        type: Boolean,
        required: true
    }
});

// Define a custom function to generate the slug
function generateSlug(firstName) {
    return new Promise(async (resolve, reject) => {
        try {
            let slug = firstName.replace(/\s+/g, '-');
            let count = 0;

            while (await isSlugTaken(slug)) {
                count++;
                slug = `${firstName.replace(/\s+/g, '-')}-${count}`;
            }
            resolve(slug);
        } catch (error) {
            reject(error);
        }
    });
}

// Function to check if a slug is already taken
async function isSlugTaken(slug) {
    const existingPost = await mongoose.model('posts').findOne({ slug });
    return !!existingPost;
}

// Use pre-save middleware to generate the slug before saving
UserSchema.pre("save", async function(next) {
    try {
        if (!this.slug) {
            this.slug = await generateSlug(this.firstName);
        }
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model("users", UserSchema);