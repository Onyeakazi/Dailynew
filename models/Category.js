const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CategorySchema = new Schema({

    name: {
        type: String,
        required: true
    }, 
    slug: {
        type: String
    },

});

// Define a custom function to generate the slug
function generateSlug(name) {
    return new Promise(async (resolve, reject) => {
        try {
            let slug = name.replace(/\s+/g, '-');
            let count = 0;

            while (await isSlugTaken(slug)) {
                count++;
                slug = `${name.replace(/\s+/g, '-')}-${count}`;
            }

            resolve(slug);
        } catch (error) {
            reject(error);
        }
    });
}

// Function to check if a slug is already taken
async function isSlugTaken(slug) {
    const existingCat = await mongoose.model('categories').findOne({ slug });
    return !!existingCat;
}


// Use pre-save middleware to generate the slug before saving
CategorySchema.pre("save", async function(next) {
    try {
        if (!this.slug) {
            this.slug = await generateSlug(this.name);
        }
        next();
    } catch (error) {
        next(error);
    }
});


module.exports = mongoose.model("categories", CategorySchema);