import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './rsvp-status.css';
import './readability.css';
import './uber.css';
import './mobile-calendar.css';
import './capacity.css';

createRoot(document.getElementById('root')).render(<App />);
