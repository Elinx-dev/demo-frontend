import { useBuildPolicyContext } from "./BuildPolicyContext";
import { UIPolicyProvider } from "./UIPolicyContext";

export const PolicyBridge = ({ children }: { children: React.ReactNode }) => {
    const { uiCtx } = useBuildPolicyContext();

    return (
        <UIPolicyProvider ctx={uiCtx}>
            {children}
        </UIPolicyProvider>
    );
};
