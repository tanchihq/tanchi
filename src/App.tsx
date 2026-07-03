import { Route, Routes } from 'react-router-dom';

const Home = () => (
  <main className="flex min-h-svh flex-col items-center justify-center gap-2">
    <h1 className="text-2xl font-semibold">SweeLeads</h1>
    <p className="text-muted-foreground text-sm">Foundation ready.</p>
  </main>
);

const App = () => (
  <Routes>
    <Route path="/" element={<Home />} />
  </Routes>
);

export default App;
