const path = require('path');

exports.getHomePage = (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'views', 'index.html'));
};

exports.getAboutPage = (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'views', 'about.html'));
};
