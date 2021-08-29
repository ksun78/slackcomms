// used to do path concatenations and such. No need to install, included out of the box
const path = require('path');

// gets our dirname that we can then use to combine paths with
// this sets the __dirname global variable
module.exports = path.dirname(process.mainModule.filename);
