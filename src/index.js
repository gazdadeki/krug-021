import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { SnackbarProvider } from 'notistack';


ReactDOM.render(
  // Anchored top-right: these are persist:true, so at the default bottom-left
  // they sit permanently over the drinks grid and the Račun button and swallow
  // clicks (each snackbar sets pointer-events: all at z-index 1400).
  <SnackbarProvider
    maxSnack={3}
    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
  >
    <App />
  </SnackbarProvider>,
  document.getElementById('root')
);

