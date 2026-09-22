import { useNavigate } from "react-router-dom";
import { usePolicy } from "@/ui-policy/hooks/usePolicy";

type CommandItemProps = {
    id: string;
    label: string;
    path: string;
    policy?: string;
    onClose: () => void;
};

export function CommandItem({
    id,
    label,
    path,
    policy,
    onClose,
}: CommandItemProps) {
    const navigate = useNavigate();

    // ✅ Hook called at top level (LEGAL)
    const decision = policy
        ? usePolicy({ permissionKey: policy })
        : { visible: true, enabled: true };

    if (!decision.visible) return null;

    return (
        <li
            key={id}
            className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
                navigate(path);
                onClose();
            }}
        >
            {label}
        </li>
    );
}
