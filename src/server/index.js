const express = require('express');
const app = express();
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');
const createExpressApp = require('./create-express-app');
const port = process.env.PORT || 5000;

require('dotenv').config();

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: true
});

createExpressApp(pool).listen(port, () => {
	console.log('listening on port '+port+'...');
});