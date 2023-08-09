const path = require("path");

module.exports = {

    uploadDir: path.join(__dirname, "../public/uploads/"),

    isEmpty: function(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return true; // Treat non-object values or null as empty.
        }

        if (Array.isArray(obj) || typeof obj === 'function') {
            return obj.length === 0; // Treat arrays and functions as empty if they have no elements.
        }

        for (let key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                return false;
            }
        }
        
    }
};