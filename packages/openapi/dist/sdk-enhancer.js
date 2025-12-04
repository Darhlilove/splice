/**
 * SDK Enhancer
 * Injects additional files into generated SDKs for better developer experience
 * - Environment variable support
 * - Credential providers
 * - Enhanced HTTP client with interceptors
 * - Comprehensive README with security best practices
 */
import * as fs from 'fs';
import * as path from 'path';
export class SDKEnhancer {
    constructor() {
        // In Next.js, the templates are copied to the public folder
        // We use process.cwd() which points to the Next.js app root
        // Templates are in public/sdk-templates
        const publicTemplatesDir = path.join(process.cwd(), 'public', 'sdk-templates');
        // Also try the package dist location as fallback
        const packageTemplatesDir = path.join(__dirname, 'sdk-templates');
        // Use whichever exists
        if (fs.existsSync(publicTemplatesDir)) {
            this.templatesDir = publicTemplatesDir;
            console.log('[SDKEnhancer] Using templates from Next.js public folder');
        }
        else if (fs.existsSync(packageTemplatesDir)) {
            this.templatesDir = packageTemplatesDir;
            console.log('[SDKEnhancer] Using templates from package dist');
        }
        else {
            this.templatesDir = publicTemplatesDir; // Default to public even if not found
            console.error('[SDKEnhancer] Templates not found in either location!');
        }
        console.log('[SDKEnhancer] Templates directory:', this.templatesDir);
        console.log('[SDKEnhancer] Templates exist?', fs.existsSync(this.templatesDir));
        if (fs.existsSync(this.templatesDir)) {
            const files = fs.readdirSync(this.templatesDir);
            console.log('[SDKEnhancer] Template files found:', files);
        }
        else {
            console.error('[SDKEnhancer] Tried paths:');
            console.error('  - Public:', publicTemplatesDir);
            console.error('  - Package:', packageTemplatesDir);
        }
    }
    /**
     * Enhance generated SDK with additional files
     * @param outputPath - Path to generated SDK directory
     * @param spec - OpenAPI specification
     * @param config - SDK configuration
     */
    async enhanceSDK(outputPath, spec, config) {
        try {
            console.log('[SDKEnhancer] ===== Starting SDK Enhancement =====');
            console.log('[SDKEnhancer] Output path:', outputPath);
            console.log('[SDKEnhancer] Package:', config.packageName);
            // Create placeholders map
            const placeholders = this.createPlaceholders(spec, config);
            // Create organized folder structure
            await this.createFolderStructure(outputPath);
            // Inject template files into organized folders
            await this.injectConfigFile(outputPath, placeholders);
            await this.injectClientFile(outputPath, placeholders);
            await this.injectHttpFiles(outputPath, placeholders);
            await this.injectAuthFiles(outputPath, placeholders);
            await this.injectUtilsFiles(outputPath, placeholders);
            await this.injectEnvExample(outputPath, placeholders);
            await this.enhanceReadme(outputPath, placeholders);
            await this.updatePackageJson(outputPath, config);
            console.log('[SDKEnhancer] ===== SDK Enhancement Complete =====');
        }
        catch (error) {
            console.error('[SDKEnhancer] ERROR during enhancement:', error);
            console.error('[SDKEnhancer] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
            throw error; // Re-throw to see in generation logs
        }
    }
    /**
     * Create placeholder replacements
     */
    createPlaceholders(spec, config) {
        var _a, _b, _c, _d, _e;
        const packageNameUpper = config.packageName
            .toUpperCase()
            .replace(/-/g, '_')
            .replace(/@/g, '')
            .replace(/\//g, '_');
        return {
            '{PACKAGE_NAME}': config.packageName,
            '{PACKAGE_NAME_UPPER}': packageNameUpper,
            '{PACKAGE_VERSION}': config.packageVersion,
            '{API_TITLE}': ((_a = spec.info) === null || _a === void 0 ? void 0 : _a.title) || 'API',
            '{API_VERSION}': ((_b = spec.info) === null || _b === void 0 ? void 0 : _b.version) || '1.0.0',
            '{API_DESCRIPTION}': ((_c = spec.info) === null || _c === void 0 ? void 0 : _c.description) || '',
            '{LICENSE}': ((_e = (_d = spec.info) === null || _d === void 0 ? void 0 : _d.license) === null || _e === void 0 ? void 0 : _e.name) || 'MIT',
        };
    }
    /**
     * Replace placeholders in template content
     */
    replacePlaceholders(content, placeholders) {
        let result = content;
        for (const [placeholder, value] of Object.entries(placeholders)) {
            result = result.replace(new RegExp(placeholder, 'g'), value);
        }
        return result;
    }
    /**
     * Create organized folder structure
     */
    async createFolderStructure(outputPath) {
        // Create src folder if it doesn't exist
        const srcDir = path.join(outputPath, 'src');
        if (!fs.existsSync(srcDir)) {
            fs.mkdirSync(srcDir, { recursive: true });
        }
        // Create subfolders inside src/
        const folders = ['http', 'auth', 'utils'];
        for (const folder of folders) {
            const folderPath = path.join(srcDir, folder);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
                console.log(`[SDKEnhancer] Created folder: src/${folder}/`);
            }
        }
    }
    /**
     * Inject client.ts file (main SDK entry point)
     */
    async injectClientFile(outputPath, placeholders) {
        const templatePath = path.join(this.templatesDir, 'client.ts.template');
        const outputFilePath = path.join(outputPath, 'src', 'client.ts');
        if (!fs.existsSync(templatePath)) {
            console.warn('[SDKEnhancer] client.ts template not found, skipping');
            return;
        }
        const template = fs.readFileSync(templatePath, 'utf-8');
        const content = this.replacePlaceholders(template, placeholders);
        fs.writeFileSync(outputFilePath, content, 'utf-8');
        console.log('[SDKEnhancer] Injected src/client.ts');
    }
    /**
     * Inject HTTP-related files (httpClient.ts, interceptors.ts)
     */
    async injectHttpFiles(outputPath, placeholders) {
        const httpDir = path.join(outputPath, 'src', 'http');
        // Inject httpClient.ts
        const clientTemplatePath = path.join(this.templatesDir, 'http', 'httpClient.ts.template');
        const clientOutputPath = path.join(httpDir, 'httpClient.ts');
        if (fs.existsSync(clientTemplatePath)) {
            const template = fs.readFileSync(clientTemplatePath, 'utf-8');
            const content = this.replacePlaceholders(template, placeholders);
            fs.writeFileSync(clientOutputPath, content, 'utf-8');
            console.log('[SDKEnhancer] Injected src/http/httpClient.ts');
        }
        // Inject interceptors.ts
        const interceptorsTemplatePath = path.join(this.templatesDir, 'http', 'interceptors.ts.template');
        const interceptorsOutputPath = path.join(httpDir, 'interceptors.ts');
        if (fs.existsSync(interceptorsTemplatePath)) {
            const template = fs.readFileSync(interceptorsTemplatePath, 'utf-8');
            const content = this.replacePlaceholders(template, placeholders);
            fs.writeFileSync(interceptorsOutputPath, content, 'utf-8');
            console.log('[SDKEnhancer] Injected src/http/interceptors.ts');
        }
    }
    /**
     * Inject auth-related files (credential providers)
     */
    async injectAuthFiles(outputPath, placeholders) {
        const authDir = path.join(outputPath, 'src', 'auth');
        const templatePath = path.join(this.templatesDir, 'auth', 'credentialProvider.ts.template');
        const outputFilePath = path.join(authDir, 'credentialProvider.ts');
        if (!fs.existsSync(templatePath)) {
            console.warn('[SDKEnhancer] auth/credentialProvider.ts template not found, skipping');
            return;
        }
        const template = fs.readFileSync(templatePath, 'utf-8');
        const content = this.replacePlaceholders(template, placeholders);
        fs.writeFileSync(outputFilePath, content, 'utf-8');
        console.log('[SDKEnhancer] Injected src/auth/credentialProvider.ts');
    }
    /**
     * Inject utils files (error, logger, constants)
     */
    async injectUtilsFiles(outputPath, placeholders) {
        const utilsDir = path.join(outputPath, 'src', 'utils');
        const utilFiles = ['error.ts', 'logger.ts', 'constants.ts'];
        for (const file of utilFiles) {
            const templatePath = path.join(this.templatesDir, 'utils', `${file}.template`);
            const outputFilePath = path.join(utilsDir, file);
            if (fs.existsSync(templatePath)) {
                const template = fs.readFileSync(templatePath, 'utf-8');
                const content = this.replacePlaceholders(template, placeholders);
                fs.writeFileSync(outputFilePath, content, 'utf-8');
                console.log(`[SDKEnhancer] Injected src/utils/${file}`);
            }
        }
    }
    /**
     * Inject config.ts file
     */
    async injectConfigFile(outputPath, placeholders) {
        const templatePath = path.join(this.templatesDir, 'config.ts.template');
        const outputFilePath = path.join(outputPath, 'config.ts');
        if (!fs.existsSync(templatePath)) {
            console.warn('[SDKEnhancer] config.ts template not found, skipping');
            return;
        }
        const template = fs.readFileSync(templatePath, 'utf-8');
        const content = this.replacePlaceholders(template, placeholders);
        fs.writeFileSync(outputFilePath, content, 'utf-8');
        console.log('[SDKEnhancer] Injected config.ts');
    }
    /**
     * Inject credentialProvider.ts file
     */
    async injectCredentialProviderFile(outputPath, placeholders) {
        const templatePath = path.join(this.templatesDir, 'credentialProvider.ts.template');
        const outputFilePath = path.join(outputPath, 'credentialProvider.ts');
        if (!fs.existsSync(templatePath)) {
            console.warn('[SDKEnhancer] credentialProvider.ts template not found, skipping');
            return;
        }
        const template = fs.readFileSync(templatePath, 'utf-8');
        const content = this.replacePlaceholders(template, placeholders);
        fs.writeFileSync(outputFilePath, content, 'utf-8');
        console.log('[SDKEnhancer] Injected credentialProvider.ts');
    }
    /**
     * Inject httpClient.ts file
     */
    async injectHttpClientFile(outputPath, placeholders) {
        const templatePath = path.join(this.templatesDir, 'httpClient.ts.template');
        const outputFilePath = path.join(outputPath, 'httpClient.ts');
        if (!fs.existsSync(templatePath)) {
            console.warn('[SDKEnhancer] httpClient.ts template not found, skipping');
            return;
        }
        const template = fs.readFileSync(templatePath, 'utf-8');
        const content = this.replacePlaceholders(template, placeholders);
        fs.writeFileSync(outputFilePath, content, 'utf-8');
        console.log('[SDKEnhancer] Injected httpClient.ts');
    }
    /**
     * Inject .env.example file
     */
    async injectEnvExample(outputPath, placeholders) {
        const templatePath = path.join(this.templatesDir, 'env.example.template');
        const outputFilePath = path.join(outputPath, '.env.example');
        if (!fs.existsSync(templatePath)) {
            console.warn('[SDKEnhancer] .env.example template not found, skipping');
            return;
        }
        const template = fs.readFileSync(templatePath, 'utf-8');
        const content = this.replacePlaceholders(template, placeholders);
        fs.writeFileSync(outputFilePath, content, 'utf-8');
        console.log('[SDKEnhancer] Injected .env.example');
    }
    /**
     * Enhance README.md with security best practices
     */
    async enhanceReadme(outputPath, placeholders) {
        const templatePath = path.join(this.templatesDir, 'README.md.template');
        const outputFilePath = path.join(outputPath, 'README.md');
        if (!fs.existsSync(templatePath)) {
            console.warn('[SDKEnhancer] README.md template not found, skipping');
            return;
        }
        const template = fs.readFileSync(templatePath, 'utf-8');
        const content = this.replacePlaceholders(template, placeholders);
        // Replace the generated README with our enhanced version
        fs.writeFileSync(outputFilePath, content, 'utf-8');
        console.log('[SDKEnhancer] Enhanced README.md');
    }
    /**
     * Update package.json with additional exports
     */
    async updatePackageJson(outputPath, config) {
        const packageJsonPath = path.join(outputPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            console.warn('[SDKEnhancer] package.json not found, skipping');
            return;
        }
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        // Add exports for new files
        packageJson.exports = Object.assign({ '.': './index.ts', './config': './config.ts', './credentialProvider': './credentialProvider.ts', './httpClient': './httpClient.ts' }, packageJson.exports);
        // Add keywords
        packageJson.keywords = [
            ...(packageJson.keywords || []),
            'openapi',
            'sdk',
            'typescript',
            'api-client',
            'rest-api',
        ];
        // Add repository info if not present
        if (!packageJson.repository) {
            packageJson.repository = {
                type: 'git',
                url: 'https://github.com/yourusername/your-repo.git',
            };
        }
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
        console.log('[SDKEnhancer] Updated package.json');
    }
}
