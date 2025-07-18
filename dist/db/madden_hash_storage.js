"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTwoLayer = exports.findDifferences = exports.getMaddenCacheStats = void 0;
const file_handlers_1 = __importDefault(require("../file_handlers"));
const node_cache_1 = __importDefault(require("node-cache"));
const hash = require("object-hash");
const treeCache = new node_cache_1.default({ maxKeys: 100000 });
const CACHE_TTL = 3600 * 48; // 2 days in seconds
// debug function
function getMaddenCacheStats() {
    return treeCache.getStats();
}
exports.getMaddenCacheStats = getMaddenCacheStats;
function flatten(tree) {
    return tree.headNode.children.concat(tree.headNode.children.flatMap(n => flatten({ headNode: n })));
}
function findDifferences(incoming, old) {
    if (incoming.headNode.hash === old.headNode.hash) {
        return [];
    }
    else {
        const oldHashes = Object.fromEntries(old.headNode.children.map(h => [h.hash, h]));
        return incoming.headNode.children.flatMap(c => {
            if (oldHashes[c.hash]) {
                return [];
            }
            return [c.hash].concat(flatten({ headNode: c }).map(n => n.hash));
        });
    }
}
exports.findDifferences = findDifferences;
function createTwoLayer(nodes) {
    const topHash = hash(nodes.map(c => c.hash));
    return { headNode: { hash: topHash, children: nodes } };
}
exports.createTwoLayer = createTwoLayer;
function createCacheKey(league, request_type) {
    return `${league}|${request_type}`;
}
function filePath(leagueId, event_type, request_type) {
    return `league_hashes/${leagueId}/${event_type}/${request_type}.json`;
}
const HashStorage = {
    readTree: async function (league, request_type, event_type) {
        const cachedTree = treeCache.get(createCacheKey(league, request_type));
        if (cachedTree) {
            return cachedTree;
        }
        else {
            try {
                const tree = await file_handlers_1.default.readFile(filePath(league, event_type, request_type));
                try {
                    treeCache.set(createCacheKey(league, request_type), tree, CACHE_TTL);
                }
                catch (e) {
                }
                return tree;
            }
            catch (e) {
                return { headNode: { children: [], hash: hash("") } };
            }
        }
    },
    writeTree: async function (league, request_type, event_type, tree) {
        try {
            treeCache.set(createCacheKey(league, request_type), tree, CACHE_TTL);
        }
        catch (e) {
        }
        try {
            await file_handlers_1.default.writeFile(tree, filePath(league, event_type, request_type));
        }
        catch (e) {
        }
    }
};
exports.default = HashStorage;
//# sourceMappingURL=madden_hash_storage.js.map