export default function AccountingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}
