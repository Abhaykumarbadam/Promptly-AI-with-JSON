// service worker script to run in background. listens to events and goes first
"use strict"

import { 
    TEXT_API_URL, 
    GROK_API_URL, 
    GEMINI_API_URL, 
    GROK_API_KEY, 
    GEMINI_API_KEY, 
    ACTIVE_API 
} from './config.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "makeApiCall") {
        let apiUrl, headers, body;
            const apiToUse = request.apiToUse || ACTIVE_API;
        
        switch(apiToUse) {
            case 'grok':
                apiUrl = GROK_API_URL;
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROK_API_KEY}`
                };
                body = JSON.stringify({
                    promptText: request.promptText,
                    outputFormat: request.outputFormat || 'text'
                });
                break;
                
            case 'gemini':
                apiUrl = GEMINI_API_URL;
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key': GEMINI_API_KEY
                };
                body = JSON.stringify({
                    promptText: request.promptText,
                    outputFormat: request.outputFormat || 'text'
                });
                break;
                
            default: // default API
                apiUrl = TEXT_API_URL;
                headers = {'Content-Type': 'application/json'};
                body = JSON.stringify({
                    promptText: request.promptText,
                    outputFormat: request.outputFormat || 'text'
                });
        }

        fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: body
        })
        .then(response => response.json())
        .then(data => {
            let enhancedPrompt;
            if (data && typeof data === 'object' && data.enhancedPrompt) {
                enhancedPrompt = data.enhancedPrompt;
            } else if (data && typeof data === 'object' && typeof data.body === 'string') {
                enhancedPrompt = data.body;
            } else if (typeof data === 'string') {
                enhancedPrompt = data;
            }
            if (!enhancedPrompt) {
                sendResponse({ error: 'No data returned from our side :(' });
            } else {
                sendResponse({ enhancedPrompt });
            }
        })
        .catch(error => sendResponse({error: error.message}));

        return true;
    }
    
    if (request.action === "enhancePrompt") {
        const prompt = request.prompt;
        const outputFormat = request.outputFormat || 'text';
        
        const apiUrl = TEXT_API_URL;
        
        const headers = {
          'Content-Type': 'application/json',
        };
        
        const body = JSON.stringify({ 
          promptText: prompt,
          outputFormat: outputFormat
        });
        
        fetch(apiUrl, {
          method: 'POST',
          headers: headers,
          body: body
        })
        .then(response => response.json())
        .then(data => {
          console.log('Background script received data:', data);
          console.log('Requested output format:', request.outputFormat);
          
          let enhancedPrompt;
          if (data && typeof data === 'object' && data.enhancedPrompt) {
            enhancedPrompt = data.enhancedPrompt;
          } else if (data && typeof data === 'object' && typeof data.body === 'string') {
            enhancedPrompt = data.body;
          } else if (typeof data === 'string') {
            enhancedPrompt = data;
          }
          console.log('Enhanced prompt to send:', enhancedPrompt);          
          if (!enhancedPrompt) {
            sendResponse({ error: 'No data returned from our side :(' });
          } else {
            sendResponse({ enhancedPrompt });
          }
        })
        .catch(error => {
          console.error('Error:', error);
          sendResponse({ error: `Error from API: ${error.message}` });
        });
        
        return true; // Required to use sendResponse asynchronously
    }
});

function extractFirstJsonObject(text) {
    if (!text || typeof text !== 'string') return null;
    const stripped = text.replace(/^```json\s*|^```\s*|```\s*$/gmi, '');
    const start = stripped.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    for (let i = start; i < stripped.length; i++) {
        const ch = stripped[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        if (depth === 0) {
            const candidate = stripped.slice(start, i + 1);
            try {
                const parsed = JSON.parse(candidate);
                return JSON.stringify(parsed, null, 2);
            } catch (_) {
            }
        }
    }
    return null;
}

