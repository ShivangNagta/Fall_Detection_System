// Settings.jsx
export default function Settings() {
    return (
      <div className="bg-white p-4 shadow-md rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Settings</h2>
        <div>
          <label className="block mb-2">Notification Preferences</label>
          <select className="p-2 border rounded w-full">
            <option>Send SMS & Push Notifications</option>
            <option>Send SMS Only</option>
            <option>Send Push Notifications Only</option>
          </select>
        </div>
      </div>
    );
  }
  