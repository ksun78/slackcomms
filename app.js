const express = require('express');
const app = express();

const path = require('path');

app.set('view engine', 'ejs');

// allows us to serve all files as static in viz directory,
// it's the only way express allows us to use path to files in viz
// inside the script src= tags in the ejs file
app.use(express.static(path.join(__dirname, 'viz')));

// get path to public file, used in express.static to allow access to assets
// such as css, javascript, and images
// we use __dirname here because we are at the root level of the project directory,
// if we are in another file it's best to use exported path.js object
const publicPath = path.join(__dirname, "public");
const staticAssets = express.static(publicPath);
app.use(staticAssets);

// imports the exposed/exported router constant in conversastions.js
// we can now 'use' that router we defined in converstaions.js, which now is assigned the name 'conversationsRoutes' below
// we use './' to signify the current directory, since app.js is same level as routes folder
const conversationsRoutes = require('./routes/index');
app.use(conversationsRoutes.routes);

// catches anything that is not caught before
// notice first argument is ommitted, equivalent to giving blank string
app.use((req, res, next) => {
  // __dirname is a global variable that tells you the directory path of the current file you're in
  const errorFilePath = path.join(__dirname, "views", "404.html")
  res.status(404).sendFile(errorFilePath);
})

app.listen(80);
