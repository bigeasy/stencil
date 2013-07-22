module.exports = function (callback) {
  var number = parseInt(this.pathInfo.substring(1), 10);
  callback(null, {
    previous: '/number/' + (number - 1),
    value: number,
    next: '/number/' + (number + 1)
  });
}
