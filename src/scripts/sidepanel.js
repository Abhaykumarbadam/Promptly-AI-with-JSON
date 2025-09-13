const MAX_PROMPTS = 5;
const MAX_DISPLAY_LENGTH = 35;

const promptList = document.getElementById('prompt-list');
const newPromptInput = document.getElementById('new-prompt');
const errorMessage = document.getElementById('error-message');
function fetchPrompts() {
    chrome.storage.sync.get(['prompts'], (result) => {
        const prompts = result.prompts || [];
        updatePromptList(prompts);
    });
}
function savePrompts(prompts) {
    chrome.storage.sync.set({ prompts });
}
function truncatePrompt(prompt) {
    if (prompt.length > MAX_DISPLAY_LENGTH) {
        return prompt.slice(0, MAX_DISPLAY_LENGTH) + '...';
    }
    return prompt;
}
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHTML = button.innerHTML;
        button.innerHTML = '✓';
        button.style.backgroundColor = '#10b981';
        button.style.color = 'white';
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.backgroundColor = '';
            button.style.color = '';
        }, 1000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

function createIconButton(innerHTML, className, onClick) {
    const button = document.createElement('button');
    button.className = `button button-icon ${className}`;
    button.innerHTML = innerHTML;
    button.onclick = onClick;
    return button;
}

function updatePromptList(prompts) {
    promptList.innerHTML = '';
    prompts.forEach((prompt, index) => {
        const li = document.createElement('li');
        li.className = 'prompt-item';

        const promptText = document.createElement('span');
        promptText.textContent = truncatePrompt(prompt);
        promptText.title = prompt; // Show full text on hover
        promptText.className = 'prompt-text';

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'prompt-actions';

        const copyButton = createIconButton('📋', 'copy-button', () => copyToClipboard(prompt, copyButton));
        const deleteButton = createIconButton('🗑️', 'delete-button', () => {
            prompts.splice(index, 1);
            savePrompts(prompts);
            updatePromptList(prompts);
            errorMessage.classList.add('hidden');
        });

        actionsDiv.appendChild(copyButton);
        actionsDiv.appendChild(deleteButton);
        
        li.appendChild(promptText);
        li.appendChild(actionsDiv);
        promptList.appendChild(li);
    });
}
document.getElementById('add-prompt').addEventListener('click', () => {
    const newPrompt = newPromptInput.value.trim();
    chrome.storage.sync.get(['prompts'], (result) => {
        const prompts = result.prompts || [];
        if (newPrompt && prompts.length < MAX_PROMPTS) {
            prompts.push(newPrompt);
            savePrompts(prompts);
            updatePromptList(prompts);
            newPromptInput.value = '';
            newPromptInput.style.height = 'auto';
            errorMessage.classList.add('hidden');
        } else if (prompts.length >= MAX_PROMPTS) {
            errorMessage.classList.remove('hidden');
        }
    });
});
newPromptInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
fetchPrompts();
