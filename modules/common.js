module.exports = function resolver (url, callback) {
  try {
    callback(null, require(url));
  } catch (error) {
    callback(error);
  }
}
