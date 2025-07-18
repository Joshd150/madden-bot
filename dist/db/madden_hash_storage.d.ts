import NodeCache from "node-cache";
export declare function getMaddenCacheStats(): NodeCache.Stats;
type Node = {
    hash: string;
    children: Array<Node>;
};
type MerkleTree = {
    headNode: Node;
};
export declare function findDifferences(incoming: MerkleTree, old: MerkleTree): Array<string>;
export declare function createTwoLayer(nodes: Array<Node>): MerkleTree;
interface MaddenHashStorage {
    readTree(league: string, request_type: string, event_type: string): Promise<MerkleTree>;
    writeTree(league: string, request_type: string, event_type: string, tree: MerkleTree): Promise<void>;
}
declare const HashStorage: MaddenHashStorage;
export default HashStorage;
//# sourceMappingURL=madden_hash_storage.d.ts.map