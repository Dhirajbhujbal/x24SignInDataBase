const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const checkJwt = require('express-jwt');
const utility = require('./utility');

function apiRouter(pool, twilio_client) {
	const router = express.Router();
	
	var allowCrossDomain = function(req, res, next) {
		res.setHeader('access-control-allow-origin', '*');
		res.setHeader('access-control-allow-methods', '*');
		res.setHeader('access-control-allow-headers', '*');
		return next();		
	};
	
	router.use(allowCrossDomain);

	router.use(
		checkJwt({ secret: process.env.JWT_SECRET }).unless({ path: ['/api/authenticate','/api/usersignup','/api/verify']})
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
	
	router.post('/usersignup', (req, res) => {
		const user = req.body;

		var otp = utility.getRandomNumber();

		console.log("/usersignup route called..");
	
		pool.connect((err, client, done) => {
			if (err) {
				return res.status(500).json({ error: err.stack });
			}
			var queryStr = "INSERT INTO USERS(FIRSTNAME, LASTNAME, GENDER, DATEOFBIRTH, COUNTRY, PASSWORD, MOBILENUMBER, EMAIL, OTP, CREATIONDATE) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";
			
			console.log("connected to pool..");

			client.query(queryStr, [user.firstName, user.lastName, user.gender, user.dateOfBirth, user.country, user.password, user.mobileNumber, user.emial, otp, new Date()], function(err, result) {
				if (err) {
					done();
					return res.status(500).json({ error: 'Error in a inserting new record.', err: err});
				}

				console.log("records inserted into user table..");

				twilio_client.messages.create({
					body: otp+' is your OTP(One Time Password) for creating account on application.',
					to: '+91'+user.mobileNumber,  // Text this number
					from: process.env.TWILIO_NUMBER // From a valid Twilio number
				})
				.then((message) => {
					return res.status(201).json({success:"OTP is sent to your mobile.", message: message});		
				}).catch((e) => {
					return res.status(500).json({error:e});
				});			
			});
		});	
		
	});

	router.post('/verify', (req, res) => {
		const user = req.body;
		console.log("/verify route called...", user);
		pool.connect((err, client, done) => {
			if (err) {
				return res.status(500).json({ error: err.stack });
			}	
			var queryStr = "SELECT * FROM USERS WHERE EMAIL = $1 AND OTP = $2";
			client.query(queryStr, [user.email, user.otp], function(err, result) {		
				if(err){
					done();
					return res.json({
						error: true,
						errorObj:err
					});	
				}else{			
					if(result.rowCount){
						var data = result.rows[0];
						console.log(data);
						var isOtpExpired = utility.isOtpExpired(data.creationdate);
						if(isOtpExpired){
							done();
							return res.status(401).json({ error: "OTP expired." });
						}
						var updateQuery = "UPDATE USERS SET VERIFY = $1 WHERE EMAIL = $2 AND OTP = $3";
						client.query(updateQuery, [true, data.email, data.otp], function(err, updateQueryResult){
							done();
							if(err){
								return res.json({
									error: true,
									errorObj:err
								});
							}else{
								return res.status(200).json({ success: "User verified successfully." });
							}
						});
					}else{
						done();
						return res.status(401).json({ error: "Not a valid user." });						
					}
				}
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
			client.query(queryStr, [user.email], function(err, result) {
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