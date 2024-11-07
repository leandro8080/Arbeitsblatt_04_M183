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

const insertDB = (db, query) => {
	return new Promise((resolve, reject) => {
		db.run(query, [], (err, rows) => {
			if (err) return reject(err);
			resolve(rows);
		});
	});
};

module.exports = { initializeDB, insertDB, queryDB };
