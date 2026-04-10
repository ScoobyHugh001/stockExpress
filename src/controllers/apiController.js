exports.getStatus = (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
};

exports.getData = (req, res) => {
  res.json({
    message: 'Hello from the API',
    timestamp: new Date().toISOString(),
  });
};
