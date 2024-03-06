const {
  client,
  createTables,
  createUser,
  fetchUsers,
  authenticate,
  findUserWithToken,
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
      // If user creation was successful, send a success response
      res.status(201).json({ message: "User successfully registered", user: { username: user.username, id: user.id } });
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

  app.listen(port, ()=> console.log(`listening on port ${port}`));
};

init();

