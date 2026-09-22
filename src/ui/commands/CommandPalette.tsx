import { useMemo, useState } from "react";
import { useCommandPalette } from "./useCommandPalette";
import { CommandItem } from "./CommandItems";
import { navigationRegistry } from "@/navigation/NavigationRegistry";

export function CommandPalette() {
    const { open, close } = useCommandPalette();
    const [query, setQuery] = useState("");

    const commands = useMemo(() => {
        const items: {
            id: string;
            label: string;
            path: string;
            policy?: string;
        }[] = [];

        function walk(nodes: typeof navigationRegistry) {
            nodes.forEach(n => {
                if (n.path) {
                    items.push({
                        id: n.id,
                        label: n.label,
                        path: n.path,
                        policy: n.policy,
                    });
                }
                if (n.children) walk(n.children);
            });
        }

        walk(navigationRegistry);
        return items;
    }, []);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-32 z-50">
            <div className="bg-white rounded-lg w-full max-w-lg shadow-lg">
                <input
                    autoFocus
                    placeholder="Type a command…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full p-4 border-b outline-none"
                />

                <ul className="max-h-80 overflow-auto">
                    {commands
                        .filter(c =>
                            c.label.toLowerCase().includes(query.toLowerCase())
                        )
                        .map(cmd => (
                            <CommandItem
                                key={cmd.id}
                                {...cmd}
                                onClose={close}
                            />
                        ))}
                </ul>
            </div>
        </div>
    );
}
