'use client';

import React from 'react';
import { 
    FileText, 
    Building2, 
    Users, 
    Table, 
    CreditCard, 
    PenTool, 
    RotateCcw,
    Check
} from 'lucide-react';

export interface InvoiceSettingsData {
    showLogo?: boolean;
    showHeader?: boolean;
    showGstin?: boolean;
    showPan?: boolean;
    showClientGstin?: boolean;
    showClientPan?: boolean;
    showClientContact?: boolean;
    showHsnSac?: boolean;
    showUnit?: boolean;
    showDiscount?: boolean;
    showTaxBreakdown?: boolean;
    showBankDetails?: boolean;
    showNotes?: boolean;
    showTerms?: boolean;
    showSignature?: boolean;
}

interface InvoiceDisplaySettingsProps {
    settings: InvoiceSettingsData;
    onChange: (newSettings: InvoiceSettingsData) => void;
}

const DEFAULT_SETTINGS: InvoiceSettingsData = {
    showLogo: true,
    showHeader: true,
    showGstin: true,
    showPan: true,
    showClientGstin: true,
    showClientPan: true,
    showClientContact: true,
    showHsnSac: true,
    showUnit: true,
    showDiscount: true,
    showTaxBreakdown: true,
    showBankDetails: true,
    showNotes: true,
    showTerms: true,
    showSignature: true,
};

export default function InvoiceDisplaySettings({ settings, onChange }: InvoiceDisplaySettingsProps) {
    const current = { ...DEFAULT_SETTINGS, ...(settings || {}) };

    const handleToggle = (key: keyof InvoiceSettingsData) => {
        onChange({
            ...current,
            [key]: !current[key]
        });
    };

    const handleResetDefaults = () => {
        onChange(DEFAULT_SETTINGS);
    };

    const renderToggle = (
        key: keyof InvoiceSettingsData, 
        label: string, 
        description: string
    ) => {
        const isChecked = current[key] !== false;
        return (
            <div 
                key={key}
                onClick={() => handleToggle(key)}
                className="flex items-center justify-between p-3.5 bg-gray-50/70 hover:bg-gray-100/70 border border-gray-200/80 rounded-md transition-all cursor-pointer select-none group"
            >
                <div className="pr-4 space-y-0.5">
                    <span className="text-xs font-bold text-gray-900 group-hover:text-primary-700 transition-colors flex items-center gap-1.5">
                        {label}
                        {isChecked && <Check className="w-3 h-3 text-emerald-600 inline" />}
                    </span>
                    <p className="text-[10px] text-gray-500 leading-tight">
                        {description}
                    </p>
                </div>
                
                {/* Switch button */}
                <div 
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                        isChecked ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                >
                    <span 
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition duration-200 ease-in-out shadow-sm ${
                            isChecked ? 'translate-x-4' : 'translate-x-1'
                        }`} 
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Top Toolbar / Reset */}
            <div className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-600" />
                        Invoice & Document Display Rules
                    </h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                        Configure which elements appear when generating PDF invoices and quotations
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                    Reset Defaults
                </button>
            </div>

            {/* Grid of Setting Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Header & Company Branding */}
                <div className="ent-card p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <div className="p-1.5 bg-primary-50 rounded-md text-primary-700">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                Company Header & Identity
                            </h4>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                Top header section on Page 1
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {renderToggle('showLogo', 'Company Brand Logo', 'Show your company brand logo on the top header')}
                        {renderToggle('showHeader', 'Company Address & Details', 'Show company address, phone, email in the header')}
                        {renderToggle('showGstin', 'Company GSTIN', 'Show your company GST identification number')}
                        {renderToggle('showPan', 'Company PAN / TAN', 'Show your company Permanent Account Number')}
                    </div>
                </div>

                {/* 2. Client / Recipient Details */}
                <div className="ent-card p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <div className="p-1.5 bg-primary-50 rounded-md text-primary-700">
                            <Users className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                Client (Billed-To) Details
                            </h4>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                Recipient tax and contact block
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {renderToggle('showClientGstin', 'Client GSTIN', 'Show client GST identification number under Billed To')}
                        {renderToggle('showClientPan', 'Client PAN / TAN', 'Show client PAN / TAN details under Billed To')}
                        {renderToggle('showClientContact', 'Client Email & Phone', 'Show client direct contact email and phone numbers')}
                    </div>
                </div>

                {/* 3. Items Table Columns */}
                <div className="ent-card p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <div className="p-1.5 bg-primary-50 rounded-md text-primary-700">
                            <Table className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                Line Items Table Columns
                            </h4>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                Columns visible in the products/services table
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {renderToggle('showHsnSac', 'HSN / SAC Code Column', 'Include the HSN/SAC code column for products and services')}
                        {renderToggle('showUnit', 'Unit of Measurement (UoM)', 'Display the UoM column (e.g. Nos, Pcs, Hours, Kg)')}
                        {renderToggle('showDiscount', 'Discount % Column', 'Display item-level discount percentage column and total')}
                    </div>
                </div>

                {/* 4. Payment & Bank Information */}
                <div className="ent-card p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <div className="p-1.5 bg-primary-50 rounded-md text-primary-700">
                            <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                Totals & Bank Details
                            </h4>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                Settlement and tax calculation blocks
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {renderToggle('showTaxBreakdown', 'Detailed Tax Breakdown', 'Show individual tax percentage breakdown (CGST, SGST, IGST)')}
                        {renderToggle('showBankDetails', 'Bank Account for Wire Transfer', 'Print bank account number, IFSC code, and branch details')}
                    </div>
                </div>

                {/* 5. Notes, Terms & Signatures */}
                <div className="ent-card p-5 space-y-4 md:col-span-2">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <div className="p-1.5 bg-primary-50 rounded-md text-primary-700">
                            <PenTool className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                Remarks, Terms & Legal Signatures
                            </h4>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                Footer and authorized signatory stamp
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {renderToggle('showNotes', 'Remarks / Notes', 'Show custom remarks and notes on document')}
                        {renderToggle('showTerms', 'Terms & Conditions', 'Show payment terms, delivery terms, and contract clauses')}
                        {renderToggle('showSignature', 'Authorized Signatory', 'Display authorized signature image and signatory block')}
                    </div>
                </div>
            </div>
        </div>
    );
}
