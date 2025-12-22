import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { VotingScreen } from './components/VotingScreen';
import { currentIssue } from './data/mockData';
import type { Apartment } from './types';

function App() {
  const [currentApartment, setCurrentApartment] = useState<Apartment | null>(null);

  const handleLogin = (apartment: Apartment) => {
    setCurrentApartment(apartment);
  };

  const handleLogout = () => {
    setCurrentApartment(null);
  };

  // Show login if not authenticated
  if (!currentApartment) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Show voting screen if authenticated
  return (
    <VotingScreen
      apartment={currentApartment}
      issue={currentIssue}
      onLogout={handleLogout}
    />
  );
}

export default App;
