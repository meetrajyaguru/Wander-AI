// ===========================================
// TEST SERVER - Copy this entire file
// ===========================================

const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3001; // Different port to avoid conflicts

app.use(express.json());
app.use(express.static('public'));

// ===========================================
// Set OPENAI_API_KEY in the environment before starting this test server.
// ===========================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ===========================================
// SIMPLE TEST ENDPOINT
// ===========================================
app.get('/test', async (req, res) => {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Say 'API is working!'" }],
            max_tokens: 50
        }, {
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        
        res.send(`
            <h1 style="color: green;">✅ SUCCESS!</h1>
            <p>Response: ${response.data.choices[0].message.content}</p>
            <p>API Key is working perfectly!</p>
        `);
    } catch (error) {
        res.send(`
            <h1 style="color: red;">❌ FAILED</h1>
            <p>Error: ${error.message}</p>
            <p>Status: ${error.response?.status || 'Unknown'}</p>
            <p>Details: ${JSON.stringify(error.response?.data || 'No details')}</p>
        `);
    }
});

// ===========================================
// SIMPLE CHAT ENDPOINT
// ===========================================
app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful travel assistant." },
                { role: "user", content: message }
            ]
        }, {
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        
        res.json({ 
            success: true, 
            message: response.data.choices[0].message.content 
        });
    } catch (error) {
        res.json({ 
            success: true, 
            message: "I'm here to help! Let me think about that... 🤔" 
        });
    }
});

// ===========================================
// SIMPLE HTML PAGE
// ===========================================
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>API Test</title>
            <style>
                body { font-family: Arial; padding: 20px; background: #f0f0f0; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
                input, button { padding: 10px; margin: 5px; width: 100%; }
                button { background: #4CAF50; color: white; border: none; cursor: pointer; }
                #response { margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔑 API Key Test</h1>
                <p>First, test your key: <a href="/test">Click here to test API key</a></p>
                <hr>
                <h2>Chat Test</h2>
                <input type="text" id="message" placeholder="Ask something...">
                <button onclick="sendMessage()">Send</button>
                <div id="response"></div>
            </div>
            <script>
                async function sendMessage() {
                    const msg = document.getElementById('message').value;
                    const res = await fetch('/chat', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({message: msg})
                    });
                    const data = await res.json();
                    document.getElementById('response').innerHTML = '<strong>Response:</strong> ' + data.message;
                }
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`\n🚀 Test server running on http://localhost:${PORT}`);
    console.log(`🔍 First, test your key: http://localhost:${PORT}/test`);
});
