const http = require('http');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = '/home/admin/.openclaw/openclaw.json';
const PORT = 8188;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Read config file
function readConfig() {
    try {
        const data = fs.readFileSync(CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading config:', error);
        return null;
    }
}

// Write config file
function writeConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing config:', error);
        return false;
    }
}

// Create server
const server = http.createServer((req, res) => {
    // Handle API requests
    if (req.url.startsWith('/api/')) {
        handleApiRequest(req, res);
        return;
    }

    // Serve static files
    let filePath = '.' + (req.url === '/' ? '/index.html' : req.url);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

// Handle API requests
function handleApiRequest(req, res) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    // Get config
    if (req.url === '/api/config' && req.method === 'GET') {
        const config = readConfig();
        if (config) {
            res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
            res.end(JSON.stringify(config));
        } else {
            res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
            res.end(JSON.stringify({ error: 'Failed to read config' }));
        }
        return;
    }

    // Update model
    if (req.url === '/api/update-model' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { modelId } = JSON.parse(body);
                const config = readConfig();

                if (!config) {
                    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: false, error: 'Failed to read config' }));
                    return;
                }

                // Update primary model
                if (!config.agents) config.agents = {};
                if (!config.agents.defaults) config.agents.defaults = {};
                if (!config.agents.defaults.model) config.agents.defaults.model = {};
                config.agents.defaults.model.primary = modelId;

                // Write config
                if (writeConfig(config)) {
                    console.log(`Model updated to: ${modelId}`);
                    res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: true, modelId }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: false, error: 'Failed to write config' }));
                }
            } catch (error) {
                console.error('Error updating model:', error);
                res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }

    // Add provider
    if (req.url === '/api/add-provider' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { providerName, apiType, baseUrl, apiKey } = JSON.parse(body);
                const config = readConfig();

                if (!config) {
                    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: false, error: 'Failed to read config' }));
                    return;
                }

                // Add provider
                if (!config.models) config.models = {};
                if (!config.models.providers) config.models.providers = {};
                if (!config.models.mode) config.models.mode = 'merge';

                config.models.providers[providerName] = {
                    baseUrl: baseUrl,
                    api: apiType,
                    models: []
                };

                // Add API key if provided
                if (apiKey) {
                    if (!config.auth) config.auth = {};
                    if (!config.auth.profiles) config.auth.profiles = {};
                    config.auth.profiles[`${providerName}:default`] = {
                        provider: providerName,
                        mode: 'api_key',
                        apiKey: apiKey
                    };
                }

                // Write config
                if (writeConfig(config)) {
                    console.log(`Provider added: ${providerName}`);
                    res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: true, providerName }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: false, error: 'Failed to write config' }));
                }
            } catch (error) {
                console.error('Error adding provider:', error);
                res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }

    // Delete provider
    if (req.url === '/api/delete-provider' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { providerName } = JSON.parse(body);
                const config = readConfig();

                if (!config) {
                    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: false, error: 'Failed to read config' }));
                    return;
                }

                // Delete provider
                if (config.models && config.models.providers) {
                    delete config.models.providers[providerName];
                }

                // Delete auth profile
                if (config.auth && config.auth.profiles) {
                    delete config.auth.profiles[`${providerName}:default`];
                }

                // Write config
                if (writeConfig(config)) {
                    console.log(`Provider deleted: ${providerName}`);
                    res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: true, providerName }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: false, error: 'Failed to write config' }));
                }
            } catch (error) {
                console.error('Error deleting provider:', error);
                res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }

    // Add model
    if (req.url === '/api/add-model' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { providerName, modelId, modelName, contextWindow, maxTokens } = JSON.parse(body);
                const config = readConfig();

                if (!config) {
                    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: false, error: 'Failed to read config' }));
                    return;
                }

                // Add model to provider
                if (!config.models || !config.models.providers || !config.models.providers[providerName]) {
                    res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: false, error: 'Provider not found' }));
                    return;
                }

                const provider = config.models.providers[providerName];
                if (!provider.models) provider.models = [];

                // Check if model already exists
                const existingIndex = provider.models.findIndex(m => m.id === modelId);
                if (existingIndex >= 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: false, error: 'Model already exists' }));
                    return;
                }

                provider.models.push({
                    id: modelId,
                    name: modelName,
                    reasoning: false,
                    input: ['text'],
                    cost: {
                        input: 0,
                        output: 0,
                        cacheRead: 0,
                        cacheWrite: 0
                    },
                    contextWindow: contextWindow,
                    maxTokens: maxTokens
                });

                // Write config
                if (writeConfig(config)) {
                    console.log(`Model added to ${providerName}: ${modelId}`);
                    res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: true, modelId }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: false, error: 'Failed to write config' }));
                }
            } catch (error) {
                console.error('Error adding model:', error);
                res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }

    // Delete model
    if (req.url === '/api/delete-model' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { providerName, modelId } = JSON.parse(body);
                const config = readConfig();

                if (!config) {
                    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: false, error: 'Failed to read config' }));
                    return;
                }

                // Delete model from provider
                if (!config.models || !config.models.providers || !config.models.providers[providerName]) {
                    res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: false, error: 'Provider not found' }));
                    return;
                }

                const provider = config.models.providers[providerName];
                const index = provider.models.findIndex(m => m.id === modelId);

                if (index < 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: false, error: 'Model not found' }));
                    return;
                }

                provider.models.splice(index, 1);

                // Write config
                if (writeConfig(config)) {
                    console.log(`Model deleted from ${providerName}: ${modelId}`);
                    res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: true, modelId }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                    res.end(JSON.stringify({ success: false, error: 'Failed to write config' }));
                }
            } catch (error) {
                console.error('Error deleting model:', error);
                res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }

    // Unknown API endpoint
    res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Not found' }));
}

// Start server
server.listen(PORT, '127.0.0.1', () => {
    console.log(`Model Config UI running on http://127.0.0.1:${PORT}`);
});
