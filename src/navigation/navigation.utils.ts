import type { NavigationNode } from "./NavigationRegistry";

export const flattenNavigation = (
    nodes: NavigationNode[],
    parentTrail: NavigationNode[] = []
): (NavigationNode & { trail: NavigationNode[] })[] => {
    return nodes.flatMap(node => {
        const trail = [...parentTrail, node];

        if (node.children) {
            return flattenNavigation(node.children, trail);
        }

        return [{ ...node, trail }];
    });
};
