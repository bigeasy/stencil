// todo: this must go, it is going to make people nauseous.
! function (definition) {
  if (typeof module == "object" && module.exports) definition(require, module.exports, module);
  else if (typeof define == "function" && typeof define.amd == "object") define(definition);
} (function (require, exports, module) {
  // Export our constructor.
  module.exports = function (callback) {
    var number = parseInt(this.pathInfo.substring(1), 10); 
    callback(null, {
      previous: '/number/' + (number - 1),
      value: number,
      next: '/number/' + (number + 1)
    });
  }
});
