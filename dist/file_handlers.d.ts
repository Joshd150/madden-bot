interface FileHandler {
    readFile<T>(path: string): Promise<T>;
    writeFile<T>(content: T, path: string): Promise<string>;
}
declare class LocalFileHandler implements FileHandler {
    private tempDir;
    constructor();
    readFile<T>(filePath: string): Promise<T>;
    writeFile<T>(content: T, filePath: string): Promise<string>;
}
declare class GCSFileHandler implements FileHandler {
    private storage;
    constructor(serviceAccount: string);
    readFile<T>(filePath: string): Promise<T>;
    writeFile<T>(content: T, filePath: string): Promise<string>;
}
declare const fileHandler: LocalFileHandler | GCSFileHandler;
export default fileHandler;
//# sourceMappingURL=file_handlers.d.ts.map