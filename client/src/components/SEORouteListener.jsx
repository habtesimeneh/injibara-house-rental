import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncSEOForRoute } from '../utils/seoService';

export default function SEORouteListener() {
  const location = useLocation();

  useEffect(() => {
    syncSEOForRoute(location.pathname);
  }, [location.pathname]);

  return null;
}
