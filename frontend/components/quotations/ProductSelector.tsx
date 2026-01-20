'use client';

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';

// Mock Product Data (since we don't have a backend module yet)
// In a real scenario, this would come from an API
const PREDEFINED_PRODUCTS = [
    { id: '1', name: 'Web Development (Basic)', description: '5 Page Static Website, Mobile Responsive', price: 25000, tax: 18 },
    { id: '2', name: 'Web Development (Standard)', description: 'CMS based website with Admin Panel', price: 45000, tax: 18 },
    { id: '3', name: 'E-commerce Website', description: 'Full featured online store with payment gateway', price: 85000, tax: 18 },
    { id: '4', name: 'SEO Package (Monthly)', description: 'On-page and Off-page optimization', price: 15000, tax: 18 },
    { id: '5', name: 'Logo Design', description: '3 Concepts, Source Files Included', price: 5000, tax: 18 },
    { id: '6', name: 'Hosting (Annual)', description: 'Shared Hosting Plan - 10GB Storage', price: 3500, tax: 18 },
    { id: '7', name: 'Annual Maintenance Contract', description: 'Monthly backups and updates', price: 12000, tax: 18 },
];

interface ProductSelectorProps {
    onSelect: (product: typeof PREDEFINED_PRODUCTS[0]) => void;
}

export default function ProductSelector({ onSelect }: ProductSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = PREDEFINED_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative">
            {!isOpen ? (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    <Search className="w-4 h-4 mr-1" />
                    Select from Product Catalog
                </button>
            ) : (
                <div className="absolute left-0 top-0 z-50 w-96 bg-white shadow-xl rounded-lg border border-gray-200 mt-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search products..."
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">No products found</div>
                        ) : (
                            <ul>
                                {filteredProducts.map(product => (
                                    <li key={product.id}>
                                        <button
                                            type="button"
                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 transition border-b border-gray-50 last:border-0"
                                            onClick={() => {
                                                onSelect(product);
                                                setIsOpen(false);
                                                setSearchTerm('');
                                            }}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-900 text-sm">{product.name}</span>
                                                <span className="text-xs font-bold text-gray-600">₹{product.price.toLocaleString()}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{product.description}</p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="p-2 bg-gray-50 rounded-b-lg border-t border-gray-100 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-xs text-gray-500 hover:text-gray-800 px-3 py-1"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
