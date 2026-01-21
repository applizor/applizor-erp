
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface Alert {
    id: string;
    message: string;
    type: AlertType;
}

interface AlertContextType {
    showAlert: (message: string, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);

    const showAlert = useCallback((message: string, type: AlertType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setAlerts(prev => [...prev, { id, message, type }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }, 5000);
    }, []);

    const removeAlert = (id: string) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-20 right-4 z-[9999] flex flex-col space-y-4 pointer-events-none">
                {alerts.map(alert => (
                    <div
                        key={alert.id}
                        className={`
                            pointer-events-auto transform transition-all duration-300 ease-in-out translate-x-0
                            flex items-center w-full max-w-sm overflow-hidden bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5
                            ${alert.type === 'success' ? 'border-l-4 border-green-500' : ''}
                            ${alert.type === 'error' ? 'border-l-4 border-red-500' : ''}
                            ${alert.type === 'warning' ? 'border-l-4 border-amber-500' : ''}
                            ${alert.type === 'info' ? 'border-l-4 border-blue-500' : ''}
                        `}
                    >
                        <div className="p-4 flex items-start">
                            <div className="flex-shrink-0">
                                {alert.type === 'success' && <CheckCircle className="w-6 h-6 text-green-500" />}
                                {alert.type === 'error' && <AlertCircle className="w-6 h-6 text-red-500" />}
                                {alert.type === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-500" />}
                                {alert.type === 'info' && <Info className="w-6 h-6 text-blue-500" />}
                            </div>
                            <div className="ml-3 w-0 flex-1 pt-0.5">
                                <p className="text-sm font-medium text-gray-900">
                                    {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {alert.message}
                                </p>
                            </div>
                            <div className="ml-4 flex-shrink-0 flex">
                                <button
                                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                    onClick={() => removeAlert(alert.id)}
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
