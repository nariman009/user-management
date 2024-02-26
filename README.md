# Description

- this is a working application which allows an existing user to log into and out of the application

# Features to Add

- enable registration for new users
- add the ability for a logged in user to set a value for their favorite_number
- add a property of is_admin for users which will determine if a logged in user is an administrator
- an administrator should have link which will enable them to see all the users in the system

# Setup

- create database

```
createdb fsa_app_db
```

- install dependencies

```
npm install && cd client && npm install
```

- start server in root directory of repository
```
npm run start:dev
```

- start vite server in client directory

```
npm run dev
```

- use a username and password in server/index.js in order to test out application.

# to test deployment
```
cd client && npm run build
```

browse to localhost:3000 (or whatever server port you used)

# to deploy
- build script for deploy

```
npm install && cd client && npm install && npm run build

```
- start script for deploy 

```
node server/index.js

```

- environment variables for deployed site

```
JWT for jwt secret
DATABASE_URL for postgres database
```

