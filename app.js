const express = require("express");
const app = express();
const path = require("path");
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override"); 
const upload = require("express-fileupload");
const session = require("express-session");
const flash = require("connect-flash");
const {mongoDbUrl} = require("./config/database");
const passport = require("passport");

// Creating and connecting our mongo database
mongoose.connect(mongoDbUrl).then((db) => {
  console.log("Connected");
}).catch(err => console.log("Failed to connect", err));

app.use(express.static(path.join(__dirname, "public")));

// Create an instance of the handlebars engine with the options
const {select, generateDate} = require("./helpers/handlebars-helpers");

const hbs = exphbs.create({ 
  defaultLayout: "home", helpers: {select: select, generateDate: generateDate},
  partialsDir: path.join(__dirname, "views", "partials")
});

// Set the view engine to use the handlebars instance
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

// Upload Middleware
app.use(upload());

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// form Method Override
app.use(methodOverride("_method"));

// SESSION MIDDLEWARE
app.use(session({
  secret: "berrygodswill",
  resave: true,
  saveUninitialized: true
}));

// FLASH MIDDLEWARE
app.use(flash());

// passport authentication initializer
app.use(passport.initialize());
app.use(passport.session());

// local variables using middleware
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_message = req.flash("success_message");
  res.locals.error_message = req.flash("error_message");
  res.locals.error = req.flash("error");
  next();
})

// LOAD ROUTES
const home = require("./routes/home/index");
const admin = require("./routes/admin/index");
const posts = require("./routes/admin/posts");
const categories = require("./routes/admin/categories");
const comments = require("./routes/admin/comments");

// USE ROUTES
app.use("/", home);
app.use("/admin", admin);
app.use("/admin/posts", posts);
app.use("/admin/categories", categories);
app.use("/admin/comments", comments);

app.listen(3100, () => {
  console.log("listening on port 3100");
});
