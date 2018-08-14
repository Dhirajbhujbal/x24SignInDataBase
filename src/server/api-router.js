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

	router.get('/contacts', (req, res) => {
		pool.connect((err, client, done) => {
			if (err) {
				return res.status(500).json({ error: err.stack });
			}
			var queryStr = "SELECT * FROM CONTACTS";
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

	router.post('/contacts', (req, res) => {
		const contact = req.body;
	
		pool.connect((err, client, done) => {
			if (err) {
				return res.status(500).json({ error: err.stack });
			}
			var queryStr = "INSERT INTO CONTACTS(NAME, ADDRESS, PHONE, PHOTOURL) VALUES($1, $2, $3, $4)";
			
			client.query(queryStr, [contact.name, contact.address, contact.phone, contact.photourl], function(err, result) {
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
			var queryStr = "SELECT * FROM USERS WHERE USERNAME = $1 limit 1";
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
							username: data.username,
							admin: data.admin
						};

						const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1m' });

						return res.json({
							message: 'successfuly authenticated',
							token: token
						});
					}else{
						return res.status(401).json({ error: 'We didnt found this username in our database.'});
					}				
				}
			});
		}); 
	});
	
	return router;
}
module.exports = apiRouter;