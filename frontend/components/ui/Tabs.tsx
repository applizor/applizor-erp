'use client';

import * as React from 'react';

const TabsContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
} | null>(null);

export interface TabsProps {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
    const [stateValue, setStateValue] = React.useState(defaultValue || '');

    const currentValue = value !== undefined ? value : stateValue;
    const handleValueChange = React.useCallback((newValue: string) => {
        if (onValueChange) {
            onValueChange(newValue);
        }
        setStateValue(newValue);
    }, [onValueChange]);

    return (
        <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 ${className || ''}`}>
            {children}
        </div>
    );
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsTrigger must be used within Tabs');

    const isSelected = context.value === value;

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => context.onValueChange(value)}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
            ${isSelected ? 'bg-white text-slate-950 shadow-sm' : 'hover:bg-slate-200 hover:text-slate-900'} 
            ${className || ''}`}
        >
            {children}
        </button>
    );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsContent must be used within Tabs');

    if (context.value !== value) return null;

    return (
        <div
            role="tabpanel"
            className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 ${className || ''}`}
        >
            {children}
        </div>
    );
}
