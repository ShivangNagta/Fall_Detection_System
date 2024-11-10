// AppLayout.jsx
export default function AppLayout({ children }) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-800">
        <header className="bg-blue-500 p-4 text-white text-center">
          <h1 className="text-2xl font-bold">Fall Alert System</h1>
        </header>
        <main className="p-4">{children}</main>
      </div>
    );
  }
  