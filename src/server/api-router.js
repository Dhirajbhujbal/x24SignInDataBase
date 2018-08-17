const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const checkJwt = require('express-jwt');

function apiRouter(pool) {
	const router = express.Router();

	router.use(
		checkJwt({ secret: process.env.JWT_SECRET }).unless({ path: '/api/authenticate'})
	); 

	router.use((err, req, res, next) => {
		if (err.name === 'UnauthorizedError') {
		res.status(401).send({ error: err.message });
		}
	});

	router.get('/users', (req, res) => {
		pool.connect((err, client, done) => {
			if (err) {
				return res.status(500).json({ error: err.stack });
			}
			var queryStr = "SELECT * FROM USERS";
			client.query(queryStr, function(err, result) {
				done();			
				if(err){
					return res.json({
						error: true,
						errorObj:err
					});	
				}else{				
					return res.json(result.rows);				
				}
			});		
		});
	});
	
	router.post('/users', (req, res) => {
		const user = req.body;
	
		pool.connect((err, client, done) => {
			if (err) {
				return res.status(500).json({ error: err.stack });
			}
			var queryStr = "INSERT INTO USERS(FIRSTNAME, LASTNAME, GENDER, DATEOFBIRTH, COUNTRY, PASSWORD, MOBILENUMBER, EMAIL) VALUES($1, $2, $3, $4, $5, $6, $7, $8)";
			
			client.query(queryStr, [user.firstName, user.lastName, user.gender, user.dateOfBirth, user.country, user.password, user.mobileNumber, user.emial], function(err, result) {
				if (err) {
					done();
					return res.status(500).json({ error: 'Error in a inserting new record.' });
				}
				
				return res.status(201).json({success:true});		
			});
		});	
	
	});

	router.post('/authenticate', (req, res) => {
		const user = req.body;
	
		pool.connect((err, client, done) => {
			if (err) {
				return res.status(500).json({ error: err.stack });
			}	
			var queryStr = "SELECT * FROM USERS WHERE EMAIL = $1 limit 1";
			client.query(queryStr, [user.username], function(err, result) {
				done();			
				if(err){
					return res.json({
						error: true,
						errorObj:err
					});	
				}else{			
					if(result.rowCount){
						var data = result.rows[0];
						console.log(result.rows);
						
						if (!bcrypt.compareSync(user.password, data.password)) {
							return res.status(401).json({ error: 'incorrect password'});
						}

						const payload = {
							email: data.email,
							gender: data.gender
						};

						const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

						return res.json({
							message: 'successfuly authenticated',
							token: token
						});
					}else{
						return res.status(401).json({ error: 'We didnt found this user in our database.'});
					}				
				}
			});
		}); 
	});
	
	return router;
}
module.exports = apiRouter;