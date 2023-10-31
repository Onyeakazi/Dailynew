const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ReplySchema = new Schema({
    
    name: {
        type: String,
    },

    body: {
        type: String,
    },

    user: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },

    comment: {
        type: Schema.Types.ObjectId,
        ref: "comments" // Reference to the Comment schema
    },

    slug: {
        type: String,
    },

    date: {
        type: Date,
        default: Date.now()
    }
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
    const existingRep = await mongoose.model('replies').findOne({ slug });
    return !!existingRep;
}

// Use pre-save middleware to generate the slug before saving
ReplySchema.pre("save", async function(next) {
    try {
        if (!this.slug) {
            this.slug = await generateSlug(this.name);
        }
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model("replies", ReplySchema);