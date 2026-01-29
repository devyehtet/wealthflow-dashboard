export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <h1 className="text-xl font-semibold">WealthFlow Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter app password to continue.
        </p>

        <form className="mt-6 space-y-3" action="/api/login" method="POST">
          <input
            name="password"
            type="password"
            placeholder="App password"
            className="w-full rounded-xl border p-3"
            required
          />
          <button className="w-full rounded-xl border p-3 font-medium hover:bg-black hover:text-white">
            Login
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4">
          Set password in <code>.env</code> as APP_PASSWORD
        </p>
      </div>
    </div>
  );
}
