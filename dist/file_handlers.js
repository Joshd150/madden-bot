"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const storage_1 = require("@google-cloud/storage");
const fs_1 = require("fs");
// Local file storage implementation
class LocalFileHandler {
    tempDir;
    constructor() {
        this.tempDir = os.tmpdir();
    }
    async readFile(filePath) {
        try {
            const fullPath = path.join(this.tempDir, filePath);
            const data = await fs.readFile(fullPath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error}`);
        }
    }
    async writeFile(content, filePath) {
        try {
            const fullPath = path.join(this.tempDir, filePath);
            // Ensure directory exists
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            const jsonContent = JSON.stringify(content);
            await fs.writeFile(fullPath, jsonContent, 'utf-8');
            return filePath; // Return the provided path
        }
        catch (error) {
            throw new Error(`Failed to write file ${filePath}: ${error}`);
        }
    }
}
// Google Cloud Storage implementation
class GCSFileHandler {
    storage;
    constructor(serviceAccount) {
        this.storage = new storage_1.Storage({
            projectId: "snallabot",
            credentials: JSON.parse(serviceAccount)
        });
    }
    async readFile(filePath) {
        try {
            const [bucketName, ...pathParts] = filePath.split('/');
            const objectPath = pathParts.join('/');
            const file = this.storage.bucket(bucketName).file(objectPath);
            const data = await file.download();
            return JSON.parse(data.toString());
        }
        catch (error) {
            throw new Error(`Failed to read file ${filePath} from GCS: ${error}`);
        }
    }
    async writeFile(content, filePath) {
        try {
            const [bucketName, ...pathParts] = filePath.split('/');
            const objectPath = pathParts.join('/');
            const file = this.storage.bucket(bucketName).file(objectPath);
            const jsonContent = JSON.stringify(content);
            await file.save(jsonContent, {
                metadata: {
                    contentType: 'application/json'
                }
            });
            return filePath; // Return the provided path
        }
        catch (error) {
            throw new Error(`Failed to write file ${filePath} to GCS: ${error}`);
        }
    }
}
let serviceAccount;
if (process.env.SERVICE_ACCOUNT_FILE) {
    serviceAccount = (0, fs_1.readFileSync)(process.env.SERVICE_ACCOUNT_FILE, 'utf8');
}
else if (process.env.SERVICE_ACCOUNT) {
    serviceAccount = process.env.SERVICE_ACCOUNT;
}
const fileHandler = serviceAccount ? new GCSFileHandler(serviceAccount) : new LocalFileHandler;
exports.default = fileHandler;
//# sourceMappingURL=file_handlers.js.map