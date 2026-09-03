import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import './index.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/dropzone/styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark" theme={{ fontFamily: 'Tektur' }}>
    <Notifications position='top-right' containerWidth={400}limit={4} autoClose={4000} zIndex={1000} />
      <App />
    </MantineProvider>
  </React.StrictMode>
);