import React, { createContext, useContext, useState, useCallback } from 'react';
import { RefinedLoader } from './RefinedLoader';

interface LoadingContextType {
  isLoading: boolean;
  loadingTitle: string;
  loadingSubtitle: string;
  setLoading: (loading: boolean, title?: string, subtitle?: string) => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export const useLoadingManager = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingManager must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState('Loading...');
  const [loadingSubtitle, setLoadingSubtitle] = useState('Please wait while we fetch your data');

  const setLoading = useCallback((loading: boolean, title?: string, subtitle?: string) => {
    setIsLoading(loading);
    if (title) setLoadingTitle(title);
    if (subtitle) setLoadingSubtitle(subtitle);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, loadingTitle, loadingSubtitle, setLoading }}>
      {isLoading ? (
        <RefinedLoader title={loadingTitle} subtitle={loadingSubtitle} />
      ) : (
        children
      )}
    </LoadingContext.Provider>
  );
};