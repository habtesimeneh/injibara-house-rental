import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const LoadingContext = createContext({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [activeRequests, setActiveRequests] = useState(0);

  const startLoading = () => setActiveRequests((prev) => prev + 1);
  const stopLoading = () => setActiveRequests((prev) => Math.max(0, prev - 1));

  useEffect(() => {
    // Intercept requests
    const reqInterceptor = axios.interceptors.request.use(
      (config) => {
        startLoading();
        return config;
      },
      (error) => {
        stopLoading();
        return Promise.reject(error);
      }
    );

    // Intercept responses
    const resInterceptor = axios.interceptors.response.use(
      (response) => {
        stopLoading();
        return response;
      },
      (error) => {
        stopLoading();
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  const isLoading = activeRequests > 0;

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

