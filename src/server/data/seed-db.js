require('dotenv').config();

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const async = require('async');

const users = require('./users');
const contacts = require('./contacts');

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: true
});

function allDone(notAborted, arr) {
  console.log("done", notAborted, arr);
}

function seedCollection(tableName, columnString, columnValueStr, initialRecords) {
  	pool.connect((err, client, done) => {
		if(err){
			done();
			console.log("Pg connection err", err);
		}else{
			console.log('connected to pg...');	
			var count = 0;
			async.forEach(initialRecords, (obj, callback) => {
				var queryStr = "INSERT INTO "+tableName+"("+columnString+") values("+columnValueStr+")";							
				var valueArr = [];
				for(key in obj){
					obj[key] = (key.toLowerCase() === "password") ? bcrypt.hashSync(obj[key], 10) : obj[key];
					valueArr.push(obj[key]);
				}
				client.query(queryStr, valueArr, function(err, res) {
					if (err) {
						console.log(err.stack);
						done();
						callback(err);
					} else {
						count++;
						console.log(count);
						callback();
					}
				});
			}, err => {
				if(err){
						console.error(err.message);
				}else{
					console.error("All records are processed...");
				}
			});
		}
	});	
}

//seedCollection('USERS', "ID, FIRSTNAME, LASTNAME, GENDER, DATEOFBIRTH, COUNTRY, PASSWORD, MOBILENUMBER, EMAIL", "$1, $2, $3, $4, $5, $6, $7, $8, $9", users);
//seedCollection('CONTACTS', "NAME, ADDRESS, PHONE, PHOTOURL", "$1, $2, $3, $4", contacts);