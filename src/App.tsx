import { Routes, Route } from 'react-router-dom';
import { VoterPage } from './pages/VoterPage';
import { AdminPage } from './pages/AdminPage';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route path="/" element={<VoterPage />} />
      <Route path="/admin/*" element={<AdminPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
