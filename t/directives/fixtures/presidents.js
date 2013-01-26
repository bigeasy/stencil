!function (definition) {
  if (typeof module == "object" && module.exports) module.exports = definition();
  else if (typeof define == "function" && typeof define.amd == "object") define(definition);
  else this.tz = definition();
} (function () {
  var presidents =
  [ { firstName: "George", lastName:"Washington" }
  , { firstName: "John", lastName:"Adams" }
  , { firstName: "Thomas", lastName:"Jefferson" }
  , { firstName: "James", lastName:"Madison" }
  , { firstName: "James", lastName:"Monroe" }
  , { firstName: "John", lastName:"Quincy Adams" }
  , { firstName: "Andrew", lastName:"Jackson" }
  , { firstName: "Martin", lastName:"Van Buren" }
  , { firstName: "William", lastName:"Henry Harrison" }
  , { firstName: "John", lastName:"Tyler" }
  , { firstName: "James", middleInitial:"K", lastName:"Polk" }
  , { firstName: "Zachary", lastName:"Taylor" }
  , { firstName: "Millard", lastName:"Fillmore" }
  , { firstName: "Franklin", lastName:"Pierce" }
  , { firstName: "James", lastName:"Buchanan" }
  , { firstName: "Abraham", lastName:"Lincoln" }
  , { firstName: "Andrew", lastName:"Johnson" }
  , { firstName: "Ulysses", middleInitial:"S", lastName:"Grant" }
  , { firstName: "Rutherford", middleInitial:"B", lastName:"Hayes" }
  , { firstName: "James", middleInitial:"A", lastName:"Garfield" }
  , { firstName: "Chester", lastName:"Arthur" }
  , { firstName: "Grover", lastName:"Cleveland" }
  , { firstName: "Benjamin", lastName:"Harrison" }
  , { firstName: "William", lastName:"McKinley" }
  , { firstName: "Theodore", lastName:"Roosevelt" }
  , { firstName: "William", lastName:"Howard Taft" }
  , { firstName: "Woodrow", lastName:"Wilson" }
  , { firstName: "Warren", middleInitial:"G", lastName:"Harding" }
  , { firstName: "Calvin", lastName:"Coolidge" }
  , { firstName: "Herbert", lastName:"Hoover" }
  , { firstName: "Franklin", middleInitial:"D", lastName:"Roosevelt" }
  , { firstName: "Harry", middleInitial:"S", lastName:"Truman" }
  , { firstName: "Dwight", middleInitial:"D", lastName:"Eisenhower" }
  , { firstName: "John", middleInitial:"F", lastName:"Kennedy" }
  , { firstName: "Lyndon", middleInitial:"B", lastName:"Johnson" }
  , { firstName: "Richard", lastName:"Nixon" }
  , { firstName: "Gerald", lastName:"Ford" }
  , { firstName: "Jimmy", lastName:"Carter" }
  , { firstName: "Ronald", lastName:"Reagan" }
  , { firstName: "George", lastName:"Bush" }
  , { firstName: "Bill", lastName:"Clinton" }
  , { firstName: "George", middleInitial:"W", lastName:"Bush" }
  , { firstName: "Barack", lastName:"Obama" }
  ];
  return function json (expire, callback) {
    callback(null, presidents);
  }
});
