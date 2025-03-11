import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './configs/axios';
import 'antd/dist/antd.css'; // Import CSS của Ant Design
// Add style
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


