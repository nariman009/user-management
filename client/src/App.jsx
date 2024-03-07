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

const FavoriteNumber = ({ userId, token }) => {
  const [favoriteNumber, setFavoriteNumber] = useState(null);

  useEffect(() => {
    const token = window.localStorage.getItem('token');
    async function fetchFavoriteNumber() {
      if (!userId || !token) {
        console.log("User ID or token is missing.");
        return; // Exit if no userId or token
      }
      
      try {
        // Fetch the favorite number on component mount
        const response = await fetch(`/api/users/${userId}/favorite_number`, {
          headers: {
            authorization: token
          }
        });
      
        console.log("response: ", response)
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        setFavoriteNumber(data.favoriteNumber);
      } catch (error) {
      console.error("Failed to fetch favorite number:", error);
      // Handle error (e.g., by setting an error state, logging, etc.)
      }
      
    }

    fetchFavoriteNumber();
  }, [userId, token]);

  const handleUpdateFavoriteNumber = async (e) => {
    // Update the favorite number
    const newNumber = e.target.value;
    const response = await fetch(`/api/users/${userId}/favorite_number`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: token
      },
      body: JSON.stringify({ favoriteNumber: newNumber }),
    });
    if (response.ok) {
      setFavoriteNumber(newNumber);
    }
  };

  return (
    <div>
      <h3>Your favorite number is: {favoriteNumber}</h3>
      <input
        type="number"
        value={favoriteNumber}
        onChange={handleUpdateFavoriteNumber}
      />
    </div>
  );
}

const AdminPanel = ({ auth }) => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = window.localStorage.getItem('token');
        const response = await fetch('/api/users', {
          headers: {
            authorization: token
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (err) {
        setError(err.message);
      }
    }

    fetchUsers();
  }, []); // Empty dependency array means this runs once on component mount

  const handleMakeAdmin = async (userId) => {
    try {
      console.log(userId)
      // const token = window.localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}/make_admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
      });
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <div>
      <h1>Admin Panel</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.username} - Admin: {user.is_admin ? 'Yes' : 'No'}
            {!user.is_admin && <button onClick={() => handleMakeAdmin(user.id)}>Make Admin</button>}

          </li>
        ))}
      </ul>
    </div>
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
        setAuth({ id: json.id, username: json.username, is_admin: json.is_admin });
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
          <div>Welcome, {auth.username}! Click to <button onClick={logout}>Logout</button></div>
          <FavoriteNumber userId={auth.id} token={auth.token} />
          <nav>
            <Link to='/'>Home</Link>
            <Link to='/faq'>FAQ</Link>
            {auth.is_admin && <Link to="/admin">Admin Panel</Link>}
          </nav>
          <Routes>
            <Route path='/' element={<h1>Home</h1>} />
            <Route path='/faq' element={<h1>FAQ</h1>} />
            {auth.is_admin && <Route path="/admin" element={<AdminPanel auth={auth}/>} />} {/* New Route for Admin Panel */}
          </Routes>
        </>
      )}
    </>
  )
}

export default App
