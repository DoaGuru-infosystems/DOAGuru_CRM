import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store/store";

// Automatically use local backend ONLY during local development (npm start).
// When built for deployment (npm run build), this block does not run and production URLs are used.
if (process.env.NODE_ENV === "development") {
  axios.interceptors.request.use(
    (config) => {
      if (config.url && typeof config.url === "string") {
        config.url = config.url
          .replace(
            "https://crm-generalize.siarasystems.com",
            "http://localhost:9000"
          )
          .replace(
            "https://crm-generalize.dentalguru.software",
            "http://localhost:9000"
          );
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>{" "}
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
