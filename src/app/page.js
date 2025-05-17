import { Suspense } from 'react';
import CSVUploader from './components/CSVUploader';

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen py-12 bg-gray-50">
      <main className="flex flex-col items-center w-full max-w-4xl px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">Product Catalog Generator</h1>
        <div className="w-full max-w-xl p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Upload Your Product CSV</h2>
          <p className="mb-6 text-gray-600">
            Upload a CSV file with the following columns: product name, product price, 
            product company, filter tag, quantity available, aisle row, aisle column, and image URL.
          </p>
          <Suspense fallback={<div>Loading uploader...</div>}>
            <CSVUploader />
          </Suspense>
        </div>
      </main>
    </div>
  );
}