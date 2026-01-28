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
            <div className="flex items-center gap-4">
                <div className="ent-icon-box">
                    <Icon size={20} />
                </div>
                <div>
                    <h1 className="ent-page-title">{title}</h1>
                    {subtitle && <p className="ent-page-subtitle">{subtitle}</p>}
                </div>
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
                    {actions}
                </div>
            )}
        </div>
    );
}
