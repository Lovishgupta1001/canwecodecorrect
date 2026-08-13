import React, { createContext, useContext } from "react";

const DsUrlContext = createContext(null);

export const DsUrlProvider = ({ dsURL, children }) => (
    <DsUrlContext.Provider value={dsURL}>{children}</DsUrlContext.Provider>
);

export const useDsURL = () => useContext(DsUrlContext);
