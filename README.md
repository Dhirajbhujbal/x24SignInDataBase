# Angular + Node Contact Manager

## Angular API Communication and Authentication

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.0.2.

##Note
Always make sure you make a copy of `.env.sample`, rename it to `.env`, and add in the necessary environemtn variables for both the JWT secret and the postgreSql connection string.

## Build tasks

Different `npm` scripts for your workflow:
  * `npm start`: this will run a production build of the Angular app, and place the bundles in `server/public` directory, and then will start the Node + Express app. This is typically what you would want to do if deploying the applicaiton.
  * `npm run watch`: this will utilize webpack-dev-server to run the Angular app in a live development server, watching for any changes, and also start the Express app at port 3000. Since the app is running on port 4200, we supply a proxy config file to proxy all requests to `/api` to `localhost:3000/api`. Making changes to your code will live reload both the client and the server. Use this for development.
  * `npm run sample`: this will seed your database with initial contacts and users.

## Technologies used
  * Angular v4.1.1
  * Angluar CLI v1.0.2
  * Node v6.10.0
  * Express v4.x
  * postgreSql
  * JSON Web Tokens
