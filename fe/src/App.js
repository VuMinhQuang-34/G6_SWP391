// src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DefaultLayout from './layouts/DefaultLayout';
import UserDetail from "./pages/users/UserDetail";
import UserList from "./pages/users/UserList";

const Home = () => <h2>Home Page</h2>;
const About = () => <h2>About Page</h2>;
const Services = () => <h2>Services Page</h2>;
const Contact = () => <h2>Contact Page</h2>;

const App = () => {
  return (
    <Router>
      <DefaultLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/admin/users" element={<UserList />} />
          {/* <Route path="/users/:id/edit" element={<UserEdit />} /> */}
          {/* <Route path="/users/create" element={<UserCreate />} /> */}
          
        </Routes>
      </DefaultLayout>
    </Router>
  );
};

export default App;
