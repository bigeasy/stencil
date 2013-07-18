! function (definition) {
  if (typeof module == "object" && module.exports) definition(require, module.exports, module);
  else if (typeof define == "function" && typeof define.amd == "object") define(definition);
} (function (require, exports, module) {
  // Export our constructor.
  module.exports = function (context, callback) {
    var number = parseInt(context.pathInfo.substring(1), 10); 
    callback(null, {
      previous: '/number/' + (number - 1),
      value: number,
      next: '/number/' + (number + 1)
    });
  }
});
