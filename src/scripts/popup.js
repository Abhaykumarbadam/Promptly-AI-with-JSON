"use strict";

document.addEventListener('DOMContentLoaded', function() {
    const repromptButton = document.getElementById('reprompt-button');
    const checkmarkElement = document.getElementById('checkmark');
    const loadingElement = document.getElementById('loading');
    const errorMessageElement = document.getElementById('error-message');
    const jsonToggle = document.getElementById('json-toggle');

    repromptButton.addEventListener('click', function() {
        repromptButton.disabled = true;
        hideAllStatusElements();
        loadingElement.classList.remove('hidden');
        
        // Get the JSON format preference
        const useJsonFormat = jsonToggle.checked;
    
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "modifyPrompt", 
                outputFormat: useJsonFormat ? 'json' : 'text'
            }, function(response) {
                loadingElement.classList.add('hidden');
                
                if (chrome.runtime.lastError) {
                    handleError("Error: More than one ChatGPT/Claude/Perplexity tab open or no relevant tab found");
                } else if (!response) {
                    handleError("Error: No response from content script");
                } else if (!response.success) {
                    handleContentScriptError(response.error);
                } else {
                    showSuccess();
                }
            });
        });
    });

    function handleContentScriptError(error) {
        let errorMsg;
        switch(error) {
            case "Prompt textarea not found":
                errorMsg = "Prompt textarea not found";
                break;
            case "Prompt must be between 10-2000 characters":
                errorMsg = "Prompt length is invalid (10-2000 chars)";
                break;
            case "No data returned from our side :(":
                errorMsg = "No data returned from our side :(";
                break;
            default:
                if (error.startsWith("Error from API:")) {
                    errorMsg = "Error on our side :(";
                } else {
                    errorMsg = "Unknown error occurred";
                }
        }
        handleError(errorMsg);
    }

    function handleError(message) {
        errorMessageElement.textContent = message;
        errorMessageElement.classList.remove('hidden');
        repromptButton.disabled = false;
        
        setTimeout(() => {
            errorMessageElement.classList.add('hidden');
        }, 5000);
    }

    function showSuccess() {
        checkmarkElement.classList.remove('hidden');
        
        setTimeout(() => {
            repromptButton.disabled = false;
            checkmarkElement.classList.add('hidden');
        }, 1000);
    }

    function hideAllStatusElements() {
        checkmarkElement.classList.add('hidden');
        loadingElement.classList.add('hidden');
        errorMessageElement.classList.add('hidden');
    }

    const tooltips = document.querySelectorAll('.tooltip');
    tooltips.forEach(tooltip => {
        const tooltipText = tooltip.querySelector('.tooltip-text');
        
        tooltip.addEventListener('mouseenter', () => {
            tooltipText.style.visibility = 'visible';
            tooltipText.style.opacity = '1';
        });
        
        tooltip.addEventListener('mouseleave', () => {
            tooltipText.style.visibility = 'hidden';
            tooltipText.style.opacity = '0';
        });
    });

    const shortcutElement = document.getElementById('keyboard-shortcut');
    if (shortcutElement) {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        shortcutElement.textContent = isMac ? '⌘ + M' : 'Ctrl + M';
    }

    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    chrome.storage.sync.get(['theme'], (result) => {
        const savedTheme = result.theme || 'light';
        applyTheme(savedTheme);
        updateToggleIcon(savedTheme);
    });
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        applyTheme(newTheme);
        updateToggleIcon(newTheme);
        
        chrome.storage.sync.set({ theme: newTheme });
    });
    
    function applyTheme(theme) {
        htmlElement.setAttribute('data-theme', theme);
    }
    
    function updateToggleIcon(theme) {
        const iconElement = themeToggle.querySelector('i');
        if (theme === 'dark') {
            iconElement.classList.remove('fa-moon');
            iconElement.classList.add('fa-sun');
        } else {
            iconElement.classList.remove('fa-sun');
            iconElement.classList.add('fa-moon');
        }
    }

    const openSidePanelButton = document.getElementById('open-side-panel');
    if (openSidePanelButton) {
        openSidePanelButton.addEventListener('click', () => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs && tabs[0]) {
                    chrome.sidePanel.setOptions({ tabId: tabs[0].id, path: 'sidepanel.html', enabled: true }, () => {
                        chrome.sidePanel.open({ tabId: tabs[0].id });
                    });
                }
            });
        });
    }

    const openOptionsButton = document.getElementById('open-options');
    if (openOptionsButton) {
        openOptionsButton.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }
});
