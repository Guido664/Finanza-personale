import React from 'react';
import { MagnifyingGlassIcon } from './Icons';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, onQueryChange }) => {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>
      <input
        id="search"
        name="search"
        className="block w-full rounded-md border-0 bg-white py-2 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        placeholder="Cerca per descrizione o categoria..."
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        aria-label="Cerca transazioni per descrizione o categoria"
      />
    </div>
  );
};

export default SearchBar;