const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const CommentSchema = new Schema({

    user: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },

    replies: [{
        type: Schema.Types.ObjectId,
        ref: "replies"
    }],

    name: {
        type: String,
    },
    
    email: {
        type: String,
    },

    body: {
        type: String,
    },

    slug: {
        type: String,
    },

    approveComment: {
        type: Boolean,
        default: true
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
    const existingCom = await mongoose.model('comments').findOne({ slug });
    return !!existingCom;
}

// Use pre-save middleware to generate the slug before saving
CommentSchema.pre("save", async function(next) {
    try {
        if (!this.slug) {
            this.slug = await generateSlug(this.name);
        }
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model("comments", CommentSchema);