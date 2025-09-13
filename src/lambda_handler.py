import json
import os
import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-1.5-flash")

def get_meta_prompt():
    return f"""
    You are an AI assistant tasked with analyzing a user's prompt to identify the task type, objective, and main components. Enhance the prompt by improving clarity, specificity, and structure, ensuring the outcome is more professional and aligned with the user’s original intent. Follow a step-by-step approach to ensure each essential aspect of the task is addressed.
**Do not provide an answer to the user's prompt. Only return an enhanced version of the prompt without any additional commentary.**

# Guidelines
1. **Identify the Core Task**:
   - Determine the primary goal or action required by the prompt.
   - Avoid specific solutions or explanations; focus only on clarifying the task requirements.

2. **Clarify Components and Terminology**:
   - Identify key terms or elements that may need further definition or context to clarify the task.
   - Provide only necessary instructions or specifications without solving or addressing the task directly.

3. **Improve Structure and Flow**:
   - Rephrase for better coherence and flow without changing the prompt’s intent.
   - Ensure the instructions remain action-oriented, concise, and free from unnecessary detail.

4. **Enhance Precision**:
   - If relevant, suggest additional general steps or considerations for a thorough and professional approach to the task.
   - Maintain a clear, functional tone without delving into specifics that would fulfill or solve the task.
   
# Output Format
- Provide only the refined prompt, with enhanced clarity and structure and without any additional commentary.
- Avoid any answers, explanations, or overly detailed guidance that may inadvertently solve the user’s prompt.
- Do not modify any attachments, pasted content, or provided data from the user.

# Examples
- **Original Prompt**: "Determine the derivative of the function \( f(x) = 3x^4 - 5x^2 + 7x - 9 \)."
- **Enhanced Prompt**: "Calculate the derivative of the function \( f(x) = 3x^4 - 5x^2 + 7x - 9 \). Outline each differentiation step clearly, specifying the rules applied to each term without solving for the final expression."

- **Original Prompt**: "Create a step-by-step guide on how to set up a secure database connection."
- **Enhanced Prompt**: "Provide instructions on setting up a secure database connection, addressing essential steps. Include guidelines for:
    1. Authentication
    2. Encryption
    3. Access permissions. 
    Explain step by step."

- **Original Prompt**: "Explain the main features of climate change affecting coastal areas."
- **Enhanced Prompt**: "Outline the primary features of climate change that impact coastal areas, covering factors such as:
    - Rising sea levels
    - Erosion
    - Extreme weather
    Describe each feature briefly and clearly explain your chain of thought."

# Notes
- Maintain the user’s original intent without changing the task.
- Avoid any unnecessary specificity that could result in completing or solving the task.
- Maintain the user’s tone and style, using a professional tone only if specified.
- Do not modify or interfere with any pasted attachments provided by the user.
"""

def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}'))
    promptText = body.get('promptText')
    output_format = body.get('outputFormat', 'text')
    
    if not promptText:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',  # CORS header
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps('Missing required field: promptText')
        }
    
    if output_format == 'json':
        json_instructions = (
            "Return ONLY a valid JSON object with the following exact keys and structure. "
            "Keys: "
            '"prompt" (string), '
            '"type" (string), '
            '"elements" (array of strings), '
            '"approach" (string), '
            '"level" (string), '
            '"audience" (string). '
            "Where: 'prompt' contains the refined and improved version of the original prompt. "
            "'type' should categorize the task (e.g., 'analysis', 'explanation', 'comparison', 'creative', 'technical', 'instruction', 'research'). "
            "'elements' should list the main components or requirements identified in the prompt. "
            "'approach' should provide a brief outline of how to approach the task. "
            "'level' should be 'basic', 'intermediate', or 'advanced'. "
            "'audience' should indicate the intended audience (e.g., 'general', 'technical', 'academic', 'professional', 'beginner', 'expert'). "
            "Do not include markdown, backticks, code fences, comments, or any extra text outside the JSON."
        )
        prompt = (
            f"{get_meta_prompt()}\n\n"
            f"Output requirement: {json_instructions}\n\n"
            f"Original Prompt: {promptText}\n\n"
            f"JSON:"
        )
    else:
        prompt = f"{get_meta_prompt()}\n\nOriginal Prompt: {promptText}\n\nReworded Prompt:"
    
    try:
        response = model.generate_content(prompt)
        content = response.text.strip() if response.text else "No content available"
        
        if output_format == 'json':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',  # CORS header
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                },
                'body': json.dumps({'enhancedPrompt': content})
            }
        else:
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',  # CORS header
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                },
                'body': json.dumps(content)
            }
    except Exception as e:
        error_message = str(e)
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',  # CORS header
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps({'success': False, 'error': error_message})
        }
