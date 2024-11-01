const express = require("express");
const session = require("express-session"); 
const app = express();
const path = require("path");
const userRoutes = require("./routes/user");

require('dotenv').config();

app.use(session({
    secret: 'hello world',
    resave: false,
    saveUninitialized: false,
}));


app.set("view engine","ejs");
app.set("views", path.join(__dirname, "views"));

app.use(userRoutes);

app.listen(700,function(){
    console.log("uygulama başladı");
});