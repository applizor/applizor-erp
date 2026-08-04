export default function Template({ children }: { children: React.ReactNode }) {
    // No wrapper: CSS transform/animation on a page wrapper breaks
    // @hello-pangea/dnd (dragged cards jump sideways away from the cursor).
    return <>{children}</>;
}
