
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This page is deprecated. Redirecting to dashboard if accessed directly.
const Birthdays: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/');
  }, [navigate]);

  return null;
};

export default Birthdays;
