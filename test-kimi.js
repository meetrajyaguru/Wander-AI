require('dotenv').config();
const axios = require('axios');

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions";

async function testKimi() {
    console.log("Testing Kimi API...");
    console.log("URL:", KIMI_API_URL);
    console.log("Key:", KIMI_API_KEY ? "Found" : "Missing");

    try {
        const response = await axios.post(KIMI_API_URL, {
            model: "moonshot-v1-8k",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: "Say hello and tell me one fun fact about Paris." }
            ],
            temperature: 0.7
        }, {
            headers: {
                "Authorization": `Bearer ${KIMI_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        console.log("\n✅ Success!");
        console.log("Response:", response.data.choices[0].message.content);
    } catch (error) {
        console.error("\n❌ Error:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testKimi();
