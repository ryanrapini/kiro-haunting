import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-haunted-dark text-white">
        <header className="p-6 border-b border-haunted-purple">
          <h1 className="text-4xl font-spooky text-haunted-orange">
            👻 Haunted Home Orchestrator
          </h1>
        </header>
        <main className="container mx-auto p-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function HomePage() {
  return (
    <div className="text-center py-20">
      <h2 className="text-3xl font-spooky text-haunted-purple mb-4">
        Welcome to the Haunted Home
      </h2>
      <p className="text-xl text-gray-300">
        Transform your smart home into a spooky experience
      </p>
      <div className="mt-8">
        <button className="bg-haunted-orange hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
          Get Started
        </button>
      </div>
    </div>
  );
}

export default App;
