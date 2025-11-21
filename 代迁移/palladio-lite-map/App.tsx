
import React from 'react';
import { MapProvider, useMapContext } from './services/MapContext';
import { Sidebar } from './components/Sidebar';
import { MapView } from './components/MapView';
import { Menu, ChevronRight } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isSidebarOpen, setIsSidebarOpen } = useMapContext();

  return (
    <div className="flex h-full w-full flex-col md:flex-row bg-white overflow-hidden relative">
      {/* Mobile Header */}
      <div className="md:hidden h-14 bg-white border-b flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
        <h1 className="font-serif text-lg font-bold text-gray-800">Palladio-Lite</h1>
        <div className="text-gray-500" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu size={20} />
        </div>
      </div>

      {/* Sidebar Container */}
      <div 
        className={`
          flex flex-col bg-white border-r border-palladio-border shadow-lg z-20 transition-all duration-300 ease-in-out relative overflow-hidden
          ${isSidebarOpen ? 'w-full md:w-80 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 border-r-0'}
        `}
      >
        <div className="flex-1 overflow-hidden flex flex-col w-full md:w-80 min-w-[20rem]"> 
           <Sidebar />
        </div>
      </div>

      {/* Expand Button (Visible when sidebar is CLOSED on Desktop) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="hidden md:flex absolute top-4 left-4 z-30 items-center justify-center w-8 h-8 bg-white border border-gray-300 shadow-md rounded text-gray-600 hover:bg-gray-50 hover:text-palladio-blue transition-all duration-300"
          title="展开侧边栏"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Main Map Area */}
      <div className="flex-1 h-full relative bg-palladio-gray overflow-hidden">
        <MapView />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <MapProvider>
      <AppContent />
    </MapProvider>
  );
};

export default App;
