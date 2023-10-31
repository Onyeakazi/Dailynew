const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ContactSchema = new Schema({ 

    contact_info: {
        type: String
    },

    location: {
        type: String
    }, 

    email: {
        type: String
    },

    phone: {
        type: String
    }
});

module.exports = mongoose.model("contact_page", ContactSchema);
