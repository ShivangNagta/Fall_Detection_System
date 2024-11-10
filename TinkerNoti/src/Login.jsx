import React, { useState } from 'react';
import { signIn, signUp } from '../auth';

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    try {
      const userCredential = isSignUp ? await signUp(email, password) : await signIn(email, password);
      setUser(userCredential.user);
    } catch (error) {
      console.error("Error with authentication:", error.message);
    }
  };

  return (
    <div>
      <h2>{isSignUp ? "Sign Up" : "Sign In"}</h2>
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleAuth}>{isSignUp ? "Sign Up" : "Sign In"}</button>
      <button onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? "Already have an account? Sign In" : "No account? Sign Up"}
      </button>
    </div>
  );
};

export default Login;
