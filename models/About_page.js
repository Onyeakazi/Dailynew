const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AboutSchema = new Schema({ 

    our_mission: {
        type: String
    },

    our_overview: {
        type: String
    },

    our_vision: {
        type: String
    }, 

    our_services: {
        type: String
    },
});

module.exports = mongoose.model("about_page", AboutSchema);
