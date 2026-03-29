export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <div className="text-8xl font-bold text-gray-200 dark:text-gray-700 mb-4">404</div>
      <h1 className="text-3xl font-bold mb-4 dark:text-white">Page Not Found</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        The page you&apos;re looking for doesn&apos;t exist. Try searching for a
        car by its plate number instead.
      </p>
      <div className="flex gap-4 justify-center">
        <a
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Search for a Car
        </a>
        <a
          href="/add"
          className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Add a Record
        </a>
      </div>
    </div>
  );
}
