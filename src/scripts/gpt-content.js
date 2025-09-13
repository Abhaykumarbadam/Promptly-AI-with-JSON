const systemPrompt = `You are an AI assistant. When asked for JSON format, respond ONLY with a valid JSON object in the following structure, with no markdown, commentary, or extra text:

{
  "prompt": "<the original or clarified prompt, as text>",
  "json": {
    // structured fields describing the prompt, such as task, topic, audience_level, tone, length, format, language, etc.
  }
}

For example:
{
  "prompt": "Explain how photosynthesis works in a way a 10-year-old can understand.",
  "json": {
    "task": "explanation",
    "topic": "photosynthesis",
    "audience_level": "child",
    "tone": "educational",
    "length": "short",
    "format": "paragraph",
    "language": "English"
  }
}

Do not include markdown code fences, explanations, or any text outside the JSON object. If standard text format is requested, provide only the clarified prompt as plain text with no extra commentary.`;


function addCustomButton() {
  const sendButton = document.querySelector("button[data-testid='send-button']");

  if (sendButton && !document.querySelector(".extra-button")) {
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("promptly-buttons-container");
    buttonContainer.style.display = "flex";
    buttonContainer.style.alignItems = "center";
    buttonContainer.style.marginRight = "8px";

    const enhanceButton = document.createElement("button");
    enhanceButton.classList.add("extra-button");
    enhanceButton.style.border = "none";
    enhanceButton.style.cursor = "pointer";
    enhanceButton.style.padding = "0";
    enhanceButton.style.marginRight = "4px";
    enhanceButton.style.transition = "background-color 0.3s ease";
    enhanceButton.title = "Enhance Prompt";

    const iconImg = document.createElement("img");
    iconImg.src = chrome.runtime.getURL("favicon-32x32.png");
    iconImg.alt = "Reprompt";
    iconImg.style.width = "32px";
    iconImg.style.height = "32px";
    iconImg.style.display = "block";
    iconImg.style.borderRadius = "50%";
    enhanceButton.appendChild(iconImg);

    const jsonButton = document.createElement("button");
    jsonButton.classList.add("json-format-button");
    jsonButton.style.border = "none";
    jsonButton.style.cursor = "pointer";
    jsonButton.style.padding = "4px 8px";
    jsonButton.style.marginRight = "4px";
    jsonButton.style.backgroundColor = "#f0f0f0";
    jsonButton.style.borderRadius = "4px";
    jsonButton.style.fontSize = "12px";
    jsonButton.style.fontWeight = "bold";
    jsonButton.style.color = "#333";
    jsonButton.style.transition = "all 0.3s ease";
    jsonButton.textContent = "JSON";
    jsonButton.title = "Toggle JSON Format";

    let jsonFormatEnabled = false;

    function updateJsonButtonState() {
      if (jsonFormatEnabled) {
        jsonButton.style.backgroundColor = "#4285f4";
        jsonButton.style.color = "white";
      } else {
        jsonButton.style.backgroundColor = "#f0f0f0";
        jsonButton.style.color = "#333";
      }
    }

    jsonButton.addEventListener("click", (e) => {
      e.preventDefault();
      jsonFormatEnabled = !jsonFormatEnabled;
      updateJsonButtonState();
    });

    enhanceButton.addEventListener("click", (e) => {
      e.preventDefault();
      const promptElement = document.getElementById('prompt-textarea') || document.querySelector('div[contenteditable="true"][data-testid="textbox"]');
      if (promptElement) {
        modifyPromptElement(promptElement, jsonFormatEnabled ? 'json' : 'text');
      } else {
        showErrorMessage(enhanceButton, "Prompt textarea not found");
      }
    });

    buttonContainer.appendChild(jsonButton);
    buttonContainer.appendChild(enhanceButton);
    sendButton.parentNode.insertBefore(buttonContainer, sendButton);

    const parentContainer = sendButton.parentNode;
    if (parentContainer.style.display !== "flex") {
      parentContainer.style.display = "flex";
      parentContainer.style.flexShrink = "0";
    }

    enhanceButton.addEventListener("mouseenter", () => {
      if (enhanceButton.style.backgroundColor !== "red" &&
          enhanceButton.style.backgroundColor !== "blue") {
        enhanceButton.style.backgroundColor = "#e0e0e0";
      }
    });
    enhanceButton.addEventListener("mouseleave", () => {
      if (enhanceButton.style.backgroundColor !== "red" &&
          enhanceButton.style.backgroundColor !== "blue") {
        enhanceButton.style.backgroundColor = "transparent";
      }
    });
  }
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      addCustomButton();
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener("load", addCustomButton);

function showErrorMessage(button, errorText) {
  const errorDiv = document.createElement('div');
  errorDiv.textContent = errorText;

  Object.assign(errorDiv.style, {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '8px',
    whiteSpace: 'nowrap',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    zIndex: '1000',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
  });

  button.style.position = 'relative';
  button.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.style.opacity = '1';
  }, 10);

  setTimeout(() => {
    errorDiv.style.opacity = '0';
    setTimeout(() => errorDiv.remove(), 300);
  }, 2000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "modifyPrompt") {
    const outputFormat = request.outputFormat || 'text';
    const promptElement = document.getElementById('prompt-textarea') || document.querySelector('div[contenteditable="true"][data-testid="textbox"]');

    if (promptElement) {
      modifyPromptElement(promptElement, outputFormat)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // async
    } else {
      sendResponse({ success: false, error: "Prompt textarea not found" });
    }
  }
});

document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "m") {
    event.preventDefault();
    const promptElement = document.getElementById('prompt-textarea') || document.querySelector('div[contenteditable="true"][data-testid="textbox"]');
    if (promptElement) {
      modifyPromptElement(promptElement);
    } else {
      const button = document.querySelector(".extra-button");
      if (button) {
        showErrorMessage(button, "Prompt textarea not found");
      }
    }
  }
});

const knownErrors = [
  "Prompt textarea not found",
  "Prompt must be between 10-2000 characters",
  "No data returned from our side :(",
  "No response received"
];

async function modifyPromptElement(promptElement, outputFormat = 'text') {
  const button = document.querySelector(".extra-button");

  try {
    if (button) {
      button.style.backgroundColor = "blue";
    }

    if (!promptElement) throw new Error("Prompt textarea not found");

    const promptText = promptElement.textContent.trim();

    if (promptText.length < 10 || promptText.length > 2500) {
      throw new Error("Prompt must be between 10-2000 characters");
    }

    let enhancedText;
    const response = await chrome.runtime.sendMessage({
      action: "enhancePrompt", 
      prompt: promptText,
      outputFormat: outputFormat
    });
    
    if (!response || !response.enhancedPrompt) {
      throw new Error("No data returned from our side :(");
    }
    
    if (outputFormat === 'json') {
      let jsonString = response.enhancedPrompt;
      let parsed = null;
      jsonString = jsonString.replace(/```json[\r\n]+|```[\r\n]+|```/gim, '').trim();
      try {
        parsed = JSON.parse(jsonString);
      } catch (e) {
        const match = jsonString.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch (e2) {
            parsed = null;
          }
        }
      }
      if (parsed && typeof parsed === 'object' && parsed.prompt && parsed.json) {
        enhancedText = JSON.stringify(parsed, null, 2);
      } else {
        const inferred = inferSchemaFromPrompt(response.enhancedPrompt);
        enhancedText = JSON.stringify({
          prompt: response.enhancedPrompt,
          json: {
            task: inferred.type,
            topic: inferred.elements && inferred.elements.length > 0 ? inferred.elements[0] : '',
            audience_level: inferred.level,
            tone: 'neutral',
            length: 'medium',
            format: 'paragraph',
            language: 'English'
          }
        }, null, 2);
      }
    } else {
      enhancedText = response.enhancedPrompt;
    }

    if (outputFormat === 'json') {
      const escaped = enhancedText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      promptElement.innerHTML = escaped.replace(/\n/g, '<br>');
    } else {
      promptElement.textContent = enhancedText;
    }
    promptElement.dispatchEvent(new Event('input', { bubbles: true }));

    if (button) {
      setTimeout(() => {
        button.style.backgroundColor = "transparent";
      }, 800);
    }

    return { success: true };

  } catch (error) {
    if (button) {
      button.style.backgroundColor = "red";
      const message = error.message;
      showErrorMessage(button, knownErrors.includes(message) ? message : "Unknown error occurred - try reloading");
      setTimeout(() => {
        button.style.backgroundColor = "transparent";
      }, 1800);
    }
    return { success: false, error: error.message };
  }
}

function ensureRequiredJsonSchema(obj, originalPrompt) {
  const hasAll = (o) => o &&
    typeof o.prompt === 'string' &&
    typeof o.type === 'string' &&
    Array.isArray(o.elements) &&
    typeof o.approach === 'string' &&
    typeof o.level === 'string' &&
    typeof o.audience === 'string';

  if (hasAll(obj)) return obj;

  const inferred = inferSchemaFromPrompt(originalPrompt);
  const merged = {
    prompt: obj && typeof obj.prompt === 'string' ? obj.prompt : inferred.prompt,
    type: obj && typeof obj.type === 'string' ? obj.type : inferred.type,
    elements: Array.isArray(obj && obj.elements) ? obj.elements : inferred.elements,
    approach: obj && typeof obj.approach === 'string' ? obj.approach : inferred.approach,
    level: obj && typeof obj.level === 'string' ? obj.level : inferred.level,
    audience: obj && typeof obj.audience === 'string' ? obj.audience : inferred.audience
  };
  return merged;
}

function inferSchemaFromPrompt(prompt) {
  const text = (prompt || '').toLowerCase();
  const isStory = /story|narrative|tale|fiction/.test(text);
  const isGuide = /guide|how to|steps|manual|instructions?/.test(text);
  const isAnalysis = /analy(s|z)e|analysis|compare|evaluation?/.test(text);
  const isTechnical = /technical|code|programming|software|system/.test(text);
  const isCreative = /creative|write|compose|design|art/.test(text);
  const isResearch = /research|study|investigate|explore/.test(text);

  const type = isStory ? 'creative' : isGuide ? 'instruction' : isAnalysis ? 'analysis' : isTechnical ? 'technical' : isCreative ? 'creative' : isResearch ? 'research' : 'general';
  const level = /basic|simple|easy|beginner/.test(text) ? 'basic' : /advanced|complex|expert|detailed|comprehensive/.test(text) ? 'advanced' : 'intermediate';
  const audience = isTechnical ? 'technical' : /academic|research|study|university/.test(text) ? 'academic' : /professional|business|corporate/.test(text) ? 'professional' : /beginner|newbie|learning/.test(text) ? 'beginner' : /expert|advanced|experienced/.test(text) ? 'expert' : 'general';

  const elements = [];
  if (/compare|comparison/.test(text)) elements.push('comparison');
  if (/analy(s|z)e|analysis/.test(text)) elements.push('analysis');
  if (/explain|explanation/.test(text)) elements.push('explanation');
  if (/example|examples/.test(text)) elements.push('examples');
  if (/step|steps/.test(text)) elements.push('step-by-step approach');
  if (/benefit|advantage|pros/.test(text)) elements.push('benefits');
  if (/limitation|disadvantage|cons/.test(text)) elements.push('limitations');
  if (/pros and cons|advantages and disadvantages/.test(text)) elements.push('pros and cons');
  if (/definition|define/.test(text)) elements.push('definition');
  if (/use case|application/.test(text)) elements.push('use cases');
  if (elements.length === 0) elements.push('main topic');

  const approach = isAnalysis ? 'Provide a structured analysis with clear comparisons and evidence' :
    isGuide ? 'Break down into clear, actionable steps with examples' :
    isTechnical ? 'Use technical terminology and provide implementation details' :
    isResearch ? 'Present findings with supporting evidence and methodology' :
    isCreative ? 'Use creative language and engaging narrative techniques' :
    'Present information in a clear, organized manner with supporting details';

  return { 
    prompt: prompt, // Use original prompt as fallback
    type, 
    elements, 
    approach, 
    level, 
    audience 
  };
}