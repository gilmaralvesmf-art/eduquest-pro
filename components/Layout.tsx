
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Library, 
  BrainCircuit, 
  FileText, 
  History,
  Settings, 
  LogOut, 
  Menu, 
  X,
  GraduationCap
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Banco de Questões', icon: Library, path: '/bank' },
    { name: 'Estúdio IA', icon: BrainCircuit, path: '/ai-studio' },
    { name: 'Minhas Avaliações', icon: FileText, path: '/assessments' },
    { name: 'Histórico', icon: History, path: '/history' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-md"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <Link to="/" className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white" size={24} />
            </Link>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              EduQuest Pro
            </h1>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                  ${location.pathname === item.path 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-slate-600 hover:bg-slate-50'}
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
              <LogOut size={18} />
              Sair
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-slate-400">Bem-vindo de volta, Professor Silva</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Settings size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
              JS
            </div>
          </div>
        </header>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
