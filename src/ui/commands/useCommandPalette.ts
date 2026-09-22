import { useEffect, useState } from "react";

export function useCommandPalette() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (
                (e.metaKey || e.ctrlKey) &&
                e.key.toLowerCase() === "k"
            ) {
                e.preventDefault();
                setOpen(o => !o);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    return {
        open,
        close: () => setOpen(false),
    };
}
