'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon: Icon, actions }: PageHeaderProps) {
    return (
        <div className="ent-page-header-container">
            <div className="flex items-center gap-3 md:gap-4 w-full">
                <div className="ent-icon-box shrink-0">
                    <Icon size={18} className="md:w-5 md:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="ent-page-title truncate">{title}</h1>
                    {subtitle && <p className="ent-page-subtitle truncate">{subtitle}</p>}
                </div>
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto justify-start lg:justify-end mt-1 lg:mt-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
