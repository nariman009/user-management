import { useState, useEffect } from 'react'
import { Link, Route, Routes } from 'react-router-dom';

const Register = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      await onRegister(username, password);
    } catch (err) {
      setError(err.message || 'An error occurred during register.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={ username } placeholder='username' onChange={ e=> setUsername(e.target.value)}/>
      <input value={ password} placeholder='password' onChange={ e=> setPassword(e.target.value)}/>
      <button disabled={ !username || !password }>Register</button>
      {error && <div style={{ color: 'red' }}>{error}</div>} {/* Display error message */}
    </form>
  );
};

const Login = ({ login })=> {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');


  const submit = async(ev) => {
    ev.preventDefault();
    try {
      await login({ username, password });
      setError(''); // Clear any existing errors on successful login
    } catch (err) {
      setError(err.message || 'An error occurred during login.'); // Set error message
    }
  }
  return (
    <form onSubmit={ submit }>
      <input value={ username } placeholder='username' onChange={ ev=> setUsername(ev.target.value)}/>
      <input value={ password} placeholder='password' onChange={ ev=> setPassword(ev.target.value)}/>
      <button disabled={ !username || !password }>Login</button>
      {error && <div style={{ color: 'red' }}>{error}</div>} {/* Display error message */}

    </form>
  );
}

function App() {
  const [auth, setAuth] = useState({});
  const [showRegister, setShowRegister] = useState({});


  useEffect(()=> {
    attemptLoginWithToken();
  }, []);

  const attemptLoginWithToken = async()=> {
    const token = window.localStorage.getItem('token');
    if(token){
      const response = await fetch(`/api/auth/me`, {
        headers: {
          authorization: token
        }
      });
      const json = await response.json();
      if(response.ok){
        setAuth(json);
      }
      else {
        window.localStorage.removeItem('token');
      }
    }
  };

  const register = async (username, password) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const userData = await response.json();
      setAuth(userData);
      // Assuming the response includes a token, you might want to store it in localStorage
      window.localStorage.setItem('token', userData.token);
    } catch (error) {
      throw error;
    }
  };
  
  const login = async(credentials)=> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const json = await response.json();
    if(response.ok){
      window.localStorage.setItem('token', json.token);
      attemptLoginWithToken();
    }
    else {
      throw new Error(json.message || 'Login failed');;
    }
  };

  const logout = ()=> {
    window.localStorage.removeItem('token');
    setAuth({});
  };

  return (
    <>
      {!auth.id ? (
        <>
          {showRegister ? (
            <Register onRegister={register} />
          ) : (
            <Login login={login} />
          )}
          <button onClick={() => setShowRegister(!showRegister)}>
            {showRegister ? 'Already have an account? Log in' : "Don't have an account? Register"}
          </button>
        </>
      ) : (
        <>
          <div>Welcome, {auth.username}!</div> {/* Adjust according to your auth object structure */}
          <button onClick={logout}>Logout</button>
          <nav>
            <Link to='/'>Home</Link>
            <Link to='/faq'>FAQ</Link>
          </nav>
          <Routes>
            <Route path='/' element={<h1>Home</h1>} />
            <Route path='/faq' element={<h1>FAQ</h1>} />
          </Routes>
        </>
      )}
    </>
  )
}

export default App
