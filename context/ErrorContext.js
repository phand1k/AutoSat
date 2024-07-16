import React, { createContext, useState } from 'react';

export const ErrorContext = createContext();

export const ErrorProvider = ({ children }) => {
  const [error403, setError403] = useState(false);

  return (
    <ErrorContext.Provider value={{ error403, setError403 }}>
      {children}
    </ErrorContext.Provider>
  );
};
