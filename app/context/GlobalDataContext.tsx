"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Define the shape of our global data
export interface GlobalDataState {
  targets: any[];
  assets: any[];
  services: any[];
  ports: any[];
}

interface GlobalDataContextType {
  data: GlobalDataState;
  isLoading: boolean;
  setTargets: (targets: any[]) => void;
  setAssets: (assets: any[]) => void;
  setServices: (services: any[]) => void;
  setPorts: (ports: any[]) => void;
}

const defaultState: GlobalDataState = {
  targets: [],
  assets: [],
  services: [],
  ports: [],
};

const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

export function GlobalDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<GlobalDataState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data globally on initial app mount
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/global-data');
        if (response.ok) {
          const result = await response.json();
          setData({
            targets: result.targets || [],
            assets: result.assets || [],
            services: result.services || [],
            ports: result.ports || [],
          });
        } else {
          console.error("Failed to load initial data from API");
        }
      } catch (error) {
        console.error("Network or API error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const setTargets = (targets: any[]) => setData((prev) => ({ ...prev, targets }));
  const setAssets = (assets: any[]) => setData((prev) => ({ ...prev, assets }));
  const setServices = (services: any[]) => setData((prev) => ({ ...prev, services }));
  const setPorts = (ports: any[]) => setData((prev) => ({ ...prev, ports }));

  return (
    <GlobalDataContext.Provider
      value={{
        data,
        isLoading,
        setTargets,
        setAssets,
        setServices,
        setPorts,
      }}
    >
      {children}
    </GlobalDataContext.Provider>
  );
}

// Hook to use the global context easily
export function useGlobalData() {
  const context = useContext(GlobalDataContext);
  if (context === undefined) {
    throw new Error("useGlobalData must be used within a GlobalDataProvider");
  }
  return context;
}
