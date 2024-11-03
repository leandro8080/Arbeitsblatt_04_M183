const sqlite3 = require("sqlite3");

function initializeDB(filename) {
  return (db = new sqlite3.Database(filename));
}

function queryDB(db, query) {
  return new Promise((resolve, reject) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
}

function getPosts() {
  return [
    {
      id: 1,
      title: "Introduction to JavaScript",
      content:
        "JavaScript is a dynamic language primarily used for web development...",
    },
    {
      id: 2,
      title: "Functional Programming",
      content:
        "Functional programming is a paradigm where functions take center stage...",
    },
    {
      id: 3,
      title: "Asynchronous Programming in JS",
      content:
        "Asynchronous programming allows operations to run in parallel without blocking the main thread...",
    },
  ];
}

module.exports = { initializeDB, queryDB, getPosts };
