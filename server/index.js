const {
  client,
  createTables,
  createUser,
  fetchUsers,
  authenticate,
  findUserWithToken,
  getFavoriteNumber,
  setFavoriteNumber,
  setAdministrator,
  unsetAdministrator
} = require('./db');
const express = require('express');
const app = express();
app.use(express.json());

//for deployment only
const path = require('path');
app.get('/', (req, res)=> res.sendFile(path.join(__dirname, '../client/dist/index.html')));
app.use('/assets', express.static(path.join(__dirname, '../client/dist/assets'))); 

const isLoggedIn = async(req, res, next)=> {
  try{
    req.user = await findUserWithToken(req.headers.authorization);
    next();
  }
  catch(ex){
    next(ex);
  }
};

app.post('/api/auth/register', async (req, res, next) => {
  try {
    // Create the user in the database
    const { username, password } = req.body;
    const user = await createUser({ username, password });
    if (user) {
      const loginResponse = await authenticate({ username, password });

      res.status(201).json({ 
        message: "User successfully registered", 
        user: { username: user.username, id: user.id },
        token: loginResponse.token
      });
    } else {
      // If the user was not created for some reason, send an appropriate message
      res.status(400).json({ message: "Unable to register user" });
    }
  } catch (ex) {
    console.error(ex);
    // Catch any errors that occur during the process and send an error response
    res.status(500).json({ error: "An error occurred during registration" });
  }
});

app.post('/api/auth/login', async(req, res, next)=> {
  try {
    res.send(await authenticate(req.body));
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth/me', isLoggedIn, (req, res, next)=> {
  try {
    res.send(req.user);
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users', async(req, res, next)=> {
  try {
    res.send(await fetchUsers());
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message ? err.message : err });
});

// Endpoint to get favorite number
app.get('/api/users/:userId/favorite_number', async (req, res) => {
  try {
    const { userId } = req.params;
    const favoriteNumber = await getFavoriteNumber(userId);
    res.json({ favoriteNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to set favorite number
app.post('/api/users/:userId/favorite_number', async (req, res) => {
  try {
    const { userId } = req.params;
    const { favoriteNumber } = req.body;
    const updatedFavoriteNumber = await setFavoriteNumber(userId, favoriteNumber);
    res.json({ favoriteNumber: updatedFavoriteNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/:userId/make_admin', async (req, res) => {
  try {
    const { userId } = req.params;
    // if (!req.user.is_admin) {
    //   return res.status(403).send({ error: "Not authorized" });
    // }
    const updatedUser = await setAdministrator(userId);
    if (updatedUser) {
      res.status(200).send({ message: "User role updated to admin" });
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).send({ error: "Server error" });
  }
});

app.post('/api/users/:userId/unset_admin', async (req, res) => {
  try {
    const { userId } = req.params;
    // if (!req.user.is_admin) {
    //   return res.status(403).send({ error: "Not authorized" });
    // }
    const updatedUser = await unsetAdministrator(userId);
    if (updatedUser) {
      res.status(200).send({ message: "User role updated to admin" });
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).send({ error: "Server error" });
  }
});

const init = async()=> {
  const port = process.env.PORT || 3000;
  await client.connect();
  console.log('connected to database');

  await createTables();
  console.log('tables created');

  const [moe, lucy, ethyl, curly] = await Promise.all([
    createUser({ username: 'moe', password: 'm_pw'}),
    createUser({ username: 'lucy', password: 'l_pw'}),
    createUser({ username: 'ethyl', password: 'e_pw'}),
    createUser({ username: 'curly', password: 'c_pw'})
  ]);
  
  console.log(await fetchUsers());

  await setAdministrator(moe.id);
  console.log('Administrator set.');
  

  app.listen(port, ()=> console.log(`listening on port ${port}`));
};

init();