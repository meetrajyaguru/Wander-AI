require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3005;

app.disable('x-powered-by');
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '32kb' }));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Please try again later.' }
});
const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, error: 'Chat limit reached. Please try again later.' }
});
app.use('/api', apiLimiter);
app.use('/api/chat', chatLimiter);

app.get(['/', '/index.html'], (req, res, next) => {
    fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf8', (error, html) => {
        if (error) return next(error);
        if (!process.env.FIREBASE_API_KEY) {
            return res.status(503).send('Firebase is not configured. Set FIREBASE_API_KEY in the server environment.');
        }

        const placeholder = '__FIREBASE_API_KEY_JSON__';
        if (!html.includes(placeholder)) return next(new Error('Firebase configuration placeholder is missing.'));

        res.set('Cache-Control', 'no-store');
        res.type('html').send(html.replace(placeholder, JSON.stringify(process.env.FIREBASE_API_KEY)));
    });
});

app.use(express.static(path.join(__dirname, 'public'), {
    dotfiles: 'deny',
    index: false,
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

console.log("🚀 Server starting...");

// API KEYS
const GROQ_API_KEY = process.env.GROQ_API_KEY;
console.log('Groq API key:', GROQ_API_KEY ? 'configured' : 'not configured');

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

// ===========================================
// COMPREHENSIVE DESTINATION DATABASE
// ===========================================
const destinationDatabase = {
    // ========== ASIA ==========
    // India & Cities
    "india": { currency: "Indian Rupee (₹ / INR)", language: "Hindi, English", capital: "New Delhi", bestTime: "October to March" },
    "mumbai": { currency: "Indian Rupee (₹ / INR)", language: "Hindi, Marathi, English", capital: "Mumbai", bestTime: "November to February" },
    "delhi": { currency: "Indian Rupee (₹ / INR)", language: "Hindi, English", capital: "New Delhi", bestTime: "October to March" },
    "bangalore": { currency: "Indian Rupee (₹ / INR)", language: "Kannada, English", capital: "Bengaluru", bestTime: "September to February" },
    "chennai": { currency: "Indian Rupee (₹ / INR)", language: "Tamil, English", capital: "Chennai", bestTime: "November to February" },
    "kolkata": { currency: "Indian Rupee (₹ / INR)", language: "Bengali, English", capital: "Kolkata", bestTime: "October to March" },
    "jaipur": { currency: "Indian Rupee (₹ / INR)", language: "Hindi, English", capital: "Jaipur", bestTime: "November to March" },
    "goa": { currency: "Indian Rupee (₹ / INR)", language: "Konkani, English", capital: "Panaji", bestTime: "November to February" },
    "hyderabad": { currency: "Indian Rupee (₹ / INR)", language: "Telugu, Urdu, English", capital: "Hyderabad", bestTime: "October to March" },
    "ahmedabad": { currency: "Indian Rupee (₹ / INR)", language: "Gujarati, Hindi", capital: "Ahmedabad", bestTime: "November to February" },
    "pune": { currency: "Indian Rupee (₹ / INR)", language: "Marathi, Hindi", capital: "Pune", bestTime: "October to March" },
    "agra": { currency: "Indian Rupee (₹ / INR)", language: "Hindi", capital: "Agra", bestTime: "October to March" },
    "varanasi": { currency: "Indian Rupee (₹ / INR)", language: "Hindi", capital: "Varanasi", bestTime: "October to March" },
    "udaipur": { currency: "Indian Rupee (₹ / INR)", language: "Hindi, English", capital: "Udaipur", bestTime: "October to March" },
    
    // China & Cities
    "china": { currency: "Chinese Yuan (¥ / CNY)", language: "Mandarin", capital: "Beijing", bestTime: "April to May & September to October" },
    "beijing": { currency: "Chinese Yuan (¥ / CNY)", language: "Mandarin", capital: "Beijing", bestTime: "April to May & September to October" },
    "shanghai": { currency: "Chinese Yuan (¥ / CNY)", language: "Mandarin", capital: "Shanghai", bestTime: "March to May & September to November" },
    "hong kong": { currency: "Hong Kong Dollar (HK$ / HKD)", language: "Cantonese, English", capital: "Hong Kong", bestTime: "October to December" },
    "macau": { currency: "Macanese Pataca (MOP)", language: "Cantonese, Portuguese", capital: "Macau", bestTime: "October to December" },
    
    // Japan & Cities
    "japan": { currency: "Japanese Yen (¥ / JPY)", language: "Japanese", capital: "Tokyo", bestTime: "March to May & October to November" },
    "tokyo": { currency: "Japanese Yen (¥ / JPY)", language: "Japanese", capital: "Tokyo", bestTime: "March to May & October to November" },
    "osaka": { currency: "Japanese Yen (¥ / JPY)", language: "Japanese", capital: "Osaka", bestTime: "March to May & October to November" },
    "kyoto": { currency: "Japanese Yen (¥ / JPY)", language: "Japanese", capital: "Kyoto", bestTime: "March to May & October to November" },
    "hokkaido": { currency: "Japanese Yen (¥ / JPY)", language: "Japanese", capital: "Sapporo", bestTime: "December to February (ski) & July to August" },
    "okinawa": { currency: "Japanese Yen (¥ / JPY)", language: "Japanese", capital: "Naha", bestTime: "April to October" },
    
    // South Korea & Cities
    "south korea": { currency: "South Korean Won (₩ / KRW)", language: "Korean", capital: "Seoul", bestTime: "March to May & September to November" },
    "seoul": { currency: "South Korean Won (₩ / KRW)", language: "Korean", capital: "Seoul", bestTime: "March to May & September to November" },
    "busan": { currency: "South Korean Won (₩ / KRW)", language: "Korean", capital: "Busan", bestTime: "April to June & September to October" },
    "jeju": { currency: "South Korean Won (₩ / KRW)", language: "Korean", capital: "Jeju City", bestTime: "April to June & September to November" },
    
    // Thailand & Cities
    "thailand": { currency: "Thai Baht (฿ / THB)", language: "Thai", capital: "Bangkok", bestTime: "November to February" },
    "bangkok": { currency: "Thai Baht (฿ / THB)", language: "Thai", capital: "Bangkok", bestTime: "November to February" },
    "phuket": { currency: "Thai Baht (฿ / THB)", language: "Thai", capital: "Phuket", bestTime: "November to April" },
    "chiang mai": { currency: "Thai Baht (฿ / THB)", language: "Thai", capital: "Chiang Mai", bestTime: "November to February" },
    "krabi": { currency: "Thai Baht (฿ / THB)", language: "Thai", capital: "Krabi", bestTime: "November to April" },
    "pattaya": { currency: "Thai Baht (฿ / THB)", language: "Thai", capital: "Pattaya", bestTime: "November to February" },
    
    // Vietnam & Cities
    "vietnam": { currency: "Vietnamese Dong (₫ / VND)", language: "Vietnamese", capital: "Hanoi", bestTime: "November to April" },
    "hanoi": { currency: "Vietnamese Dong (₫ / VND)", language: "Vietnamese", capital: "Hanoi", bestTime: "October to April" },
    "ho chi minh": { currency: "Vietnamese Dong (₫ / VND)", language: "Vietnamese", capital: "Ho Chi Minh City", bestTime: "December to April" },
    "da nang": { currency: "Vietnamese Dong (₫ / VND)", language: "Vietnamese", capital: "Da Nang", bestTime: "February to May" },
    "halong bay": { currency: "Vietnamese Dong (₫ / VND)", language: "Vietnamese", capital: "Ha Long", bestTime: "October to April" },
    
    // Indonesia & Cities
    "indonesia": { currency: "Indonesian Rupiah (Rp / IDR)", language: "Indonesian", capital: "Jakarta", bestTime: "April to October" },
    "bali": { currency: "Indonesian Rupiah (Rp / IDR)", language: "Indonesian, Balinese", capital: "Denpasar", bestTime: "April to October" },
    "jakarta": { currency: "Indonesian Rupiah (Rp / IDR)", language: "Indonesian", capital: "Jakarta", bestTime: "June to September" },
    "yogyakarta": { currency: "Indonesian Rupiah (Rp / IDR)", language: "Indonesian, Javanese", capital: "Yogyakarta", bestTime: "May to October" },
    "lombok": { currency: "Indonesian Rupiah (Rp / IDR)", language: "Indonesian, Sasak", capital: "Mataram", bestTime: "April to October" },
    
    // Malaysia & Cities
    "malaysia": { currency: "Malaysian Ringgit (RM / MYR)", language: "Malay, English", capital: "Kuala Lumpur", bestTime: "December to February" },
    "kuala lumpur": { currency: "Malaysian Ringgit (RM / MYR)", language: "Malay, English", capital: "Kuala Lumpur", bestTime: "May to July" },
    "penang": { currency: "Malaysian Ringgit (RM / MYR)", language: "Malay, English, Mandarin", capital: "George Town", bestTime: "December to February" },
    "langkawi": { currency: "Malaysian Ringgit (RM / MYR)", language: "Malay, English", capital: "Langkawi", bestTime: "November to March" },
    "borneo": { currency: "Malaysian Ringgit (RM / MYR)", language: "Malay, English", capital: "Kota Kinabalu", bestTime: "March to October" },
    
    // Singapore
    "singapore": { currency: "Singapore Dollar (S$ / SGD)", language: "English, Mandarin, Malay, Tamil", capital: "Singapore", bestTime: "February to April" },
    
    // Philippines & Cities
    "philippines": { currency: "Philippine Peso (₱ / PHP)", language: "Filipino, English", capital: "Manila", bestTime: "December to May" },
    "manila": { currency: "Philippine Peso (₱ / PHP)", language: "Filipino, English", capital: "Manila", bestTime: "December to May" },
    "cebu": { currency: "Philippine Peso (₱ / PHP)", language: "Cebuano, English", capital: "Cebu City", bestTime: "December to May" },
    "palawan": { currency: "Philippine Peso (₱ / PHP)", language: "Tagalog, English", capital: "Puerto Princesa", bestTime: "November to May" },
    
    // Cambodia & Cities
    "cambodia": { currency: "Cambodian Riel (៛ / KHR)", language: "Khmer", capital: "Phnom Penh", bestTime: "November to May" },
    "siem reap": { currency: "Cambodian Riel (៛ / KHR)", language: "Khmer", capital: "Siem Reap", bestTime: "November to March" },
    "phnom penh": { currency: "Cambodian Riel (៛ / KHR)", language: "Khmer", capital: "Phnom Penh", bestTime: "November to May" },
    
    // Myanmar
    "myanmar": { currency: "Myanmar Kyat (Ks / MMK)", language: "Burmese", capital: "Naypyidaw", bestTime: "November to February" },
    
    // Sri Lanka
    "sri lanka": { currency: "Sri Lankan Rupee (Rs / LKR)", language: "Sinhala, Tamil", capital: "Sri Jayawardenepura Kotte", bestTime: "December to March" },
    "colombo": { currency: "Sri Lankan Rupee (Rs / LKR)", language: "Sinhala, Tamil", capital: "Colombo", bestTime: "December to March" },
    
    // Nepal
    "nepal": { currency: "Nepalese Rupee (रू / NPR)", language: "Nepali", capital: "Kathmandu", bestTime: "October to April" },
    "kathmandu": { currency: "Nepalese Rupee (रू / NPR)", language: "Nepali", capital: "Kathmandu", bestTime: "October to April" },
    
    // Bhutan
    "bhutan": { currency: "Bhutanese Ngultrum (Nu. / BTN)", language: "Dzongkha", capital: "Thimphu", bestTime: "March to May & September to November" },
    
    // Maldives
    "maldives": { currency: "Maldivian Rufiyaa (Rf / MVR)", language: "Dhivehi", capital: "Malé", bestTime: "November to April" },
    
    // ========== MIDDLE EAST ==========
    // UAE & Cities
    "uae": { currency: "UAE Dirham (د.إ / AED)", language: "Arabic, English", capital: "Abu Dhabi", bestTime: "November to March" },
    "dubai": { currency: "UAE Dirham (د.إ / AED)", language: "Arabic, English", capital: "Dubai", bestTime: "November to March" },
    "abu dhabi": { currency: "UAE Dirham (د.إ / AED)", language: "Arabic, English", capital: "Abu Dhabi", bestTime: "November to March" },
    
    // Saudi Arabia
    "saudi arabia": { currency: "Saudi Riyal (﷼ / SAR)", language: "Arabic", capital: "Riyadh", bestTime: "November to March" },
    "riyadh": { currency: "Saudi Riyal (﷼ / SAR)", language: "Arabic", capital: "Riyadh", bestTime: "November to March" },
    
    // Qatar
    "qatar": { currency: "Qatari Riyal (﷼ / QAR)", language: "Arabic, English", capital: "Doha", bestTime: "November to March" },
    "doha": { currency: "Qatari Riyal (﷼ / QAR)", language: "Arabic, English", capital: "Doha", bestTime: "November to March" },
    
    // Kuwait
    "kuwait": { currency: "Kuwaiti Dinar (د.ك / KWD)", language: "Arabic", capital: "Kuwait City", bestTime: "November to April" },
    
    // Oman
    "oman": { currency: "Omani Rial (﷼ / OMR)", language: "Arabic", capital: "Muscat", bestTime: "October to April" },
    "muscat": { currency: "Omani Rial (﷼ / OMR)", language: "Arabic", capital: "Muscat", bestTime: "October to April" },
    
    // Jordan
    "jordan": { currency: "Jordanian Dinar (د.ا / JOD)", language: "Arabic", capital: "Amman", bestTime: "March to May & September to November" },
    "petra": { currency: "Jordanian Dinar (د.ا / JOD)", language: "Arabic", capital: "Petra", bestTime: "March to May & September to November" },
    
    // Israel
    "israel": { currency: "Israeli Shekel (₪ / ILS)", language: "Hebrew, Arabic", capital: "Jerusalem", bestTime: "March to May & September to November" },
    "jerusalem": { currency: "Israeli Shekel (₪ / ILS)", language: "Hebrew, Arabic", capital: "Jerusalem", bestTime: "March to May & September to November" },
    
    // Turkey & Cities
    "turkey": { currency: "Turkish Lira (₺ / TRY)", language: "Turkish", capital: "Ankara", bestTime: "April to May & September to October" },
    "istanbul": { currency: "Turkish Lira (₺ / TRY)", language: "Turkish", capital: "Istanbul", bestTime: "April to May & September to October" },
    "cappadocia": { currency: "Turkish Lira (₺ / TRY)", language: "Turkish", capital: "Nevşehir", bestTime: "April to June & September to October" },
    "antalya": { currency: "Turkish Lira (₺ / TRY)", language: "Turkish", capital: "Antalya", bestTime: "April to October" },
    
    // ========== EUROPE ==========
    // United Kingdom & Cities
    "uk": { currency: "British Pound (£ / GBP)", language: "English", capital: "London", bestTime: "May to September" },
    "united kingdom": { currency: "British Pound (£ / GBP)", language: "English", capital: "London", bestTime: "May to September" },
    "london": { currency: "British Pound (£ / GBP)", language: "English", capital: "London", bestTime: "May to September" },
    "manchester": { currency: "British Pound (£ / GBP)", language: "English", capital: "Manchester", bestTime: "May to September" },
    "liverpool": { currency: "British Pound (£ / GBP)", language: "English", capital: "Liverpool", bestTime: "May to September" },
    "edinburgh": { currency: "British Pound (£ / GBP)", language: "English, Scots", capital: "Edinburgh", bestTime: "May to September" },
    "glasgow": { currency: "British Pound (£ / GBP)", language: "English", capital: "Glasgow", bestTime: "May to September" },
    
    // France & Cities
    "france": { currency: "Euro (€ / EUR)", language: "French", capital: "Paris", bestTime: "April to June & September to October" },
    "paris": { currency: "Euro (€ / EUR)", language: "French", capital: "Paris", bestTime: "April to June & September to October" },
    "nice": { currency: "Euro (€ / EUR)", language: "French", capital: "Nice", bestTime: "May to September" },
    "lyon": { currency: "Euro (€ / EUR)", language: "French", capital: "Lyon", bestTime: "May to October" },
    "bordeaux": { currency: "Euro (€ / EUR)", language: "French", capital: "Bordeaux", bestTime: "June to September" },
    "marseille": { currency: "Euro (€ / EUR)", language: "French", capital: "Marseille", bestTime: "May to September" },
    
    // Germany & Cities
    "germany": { currency: "Euro (€ / EUR)", language: "German", capital: "Berlin", bestTime: "May to September" },
    "berlin": { currency: "Euro (€ / EUR)", language: "German", capital: "Berlin", bestTime: "May to September" },
    "munich": { currency: "Euro (€ / EUR)", language: "German", capital: "Munich", bestTime: "May to October" },
    "frankfurt": { currency: "Euro (€ / EUR)", language: "German", capital: "Frankfurt", bestTime: "May to September" },
    "hamburg": { currency: "Euro (€ / EUR)", language: "German", capital: "Hamburg", bestTime: "May to September" },
    "cologne": { currency: "Euro (€ / EUR)", language: "German", capital: "Cologne", bestTime: "May to September" },
    
    // Italy & Cities
    "italy": { currency: "Euro (€ / EUR)", language: "Italian", capital: "Rome", bestTime: "April to June & September to October" },
    "rome": { currency: "Euro (€ / EUR)", language: "Italian", capital: "Rome", bestTime: "April to June & September to October" },
    "venice": { currency: "Euro (€ / EUR)", language: "Italian", capital: "Venice", bestTime: "April to June & September to October" },
    "florence": { currency: "Euro (€ / EUR)", language: "Italian", capital: "Florence", bestTime: "May to September" },
    "milan": { currency: "Euro (€ / EUR)", language: "Italian", capital: "Milan", bestTime: "April to October" },
    "naples": { currency: "Euro (€ / EUR)", language: "Italian", capital: "Naples", bestTime: "April to June & September to October" },
    "amalfi coast": { currency: "Euro (€ / EUR)", language: "Italian", capital: "Amalfi", bestTime: "April to June & September to October" },
    
    // Spain & Cities
    "spain": { currency: "Euro (€ / EUR)", language: "Spanish", capital: "Madrid", bestTime: "March to May & September to November" },
    "barcelona": { currency: "Euro (€ / EUR)", language: "Spanish, Catalan", capital: "Barcelona", bestTime: "May to June & September to October" },
    "madrid": { currency: "Euro (€ / EUR)", language: "Spanish", capital: "Madrid", bestTime: "April to June & September to November" },
    "seville": { currency: "Euro (€ / EUR)", language: "Spanish", capital: "Seville", bestTime: "March to May & September to November" },
    "granada": { currency: "Euro (€ / EUR)", language: "Spanish", capital: "Granada", bestTime: "March to May & September to November" },
    "valencia": { currency: "Euro (€ / EUR)", language: "Spanish", capital: "Valencia", bestTime: "March to June & September to October" },
    
    // Portugal & Cities
    "portugal": { currency: "Euro (€ / EUR)", language: "Portuguese", capital: "Lisbon", bestTime: "March to May & September to October" },
    "lisbon": { currency: "Euro (€ / EUR)", language: "Portuguese", capital: "Lisbon", bestTime: "March to May & September to October" },
    "porto": { currency: "Euro (€ / EUR)", language: "Portuguese", capital: "Porto", bestTime: "May to September" },
    "algarve": { currency: "Euro (€ / EUR)", language: "Portuguese", capital: "Faro", bestTime: "June to September" },
    
    // Netherlands & Cities
    "netherlands": { currency: "Euro (€ / EUR)", language: "Dutch", capital: "Amsterdam", bestTime: "April to May & September to November" },
    "amsterdam": { currency: "Euro (€ / EUR)", language: "Dutch", capital: "Amsterdam", bestTime: "April to May & September to November" },
    "rotterdam": { currency: "Euro (€ / EUR)", language: "Dutch", capital: "Rotterdam", bestTime: "May to September" },
    
    // Belgium
    "belgium": { currency: "Euro (€ / EUR)", language: "Dutch, French", capital: "Brussels", bestTime: "April to October" },
    "brussels": { currency: "Euro (€ / EUR)", language: "Dutch, French", capital: "Brussels", bestTime: "April to October" },
    "bruges": { currency: "Euro (€ / EUR)", language: "Dutch", capital: "Bruges", bestTime: "April to October" },
    
    // Switzerland & Cities
    "switzerland": { currency: "Swiss Franc (CHF)", language: "German, French, Italian", capital: "Bern", bestTime: "June to September & December to March" },
    "zurich": { currency: "Swiss Franc (CHF)", language: "German", capital: "Zurich", bestTime: "June to September" },
    "geneva": { currency: "Swiss Franc (CHF)", language: "French", capital: "Geneva", bestTime: "June to September" },
    "interlaken": { currency: "Swiss Franc (CHF)", language: "German", capital: "Interlaken", bestTime: "June to September" },
    
    // Austria
    "austria": { currency: "Euro (€ / EUR)", language: "German", capital: "Vienna", bestTime: "April to October" },
    "vienna": { currency: "Euro (€ / EUR)", language: "German", capital: "Vienna", bestTime: "April to October" },
    "salzburg": { currency: "Euro (€ / EUR)", language: "German", capital: "Salzburg", bestTime: "May to September" },
    
    // Greece & Cities
    "greece": { currency: "Euro (€ / EUR)", language: "Greek", capital: "Athens", bestTime: "April to October" },
    "athens": { currency: "Euro (€ / EUR)", language: "Greek", capital: "Athens", bestTime: "March to May & September to November" },
    "santorini": { currency: "Euro (€ / EUR)", language: "Greek", capital: "Fira", bestTime: "April to October" },
    "mykonos": { currency: "Euro (€ / EUR)", language: "Greek", capital: "Mykonos", bestTime: "May to September" },
    "crete": { currency: "Euro (€ / EUR)", language: "Greek", capital: "Heraklion", bestTime: "May to October" },
    
    // Croatia
    "croatia": { currency: "Euro (€ / EUR)", language: "Croatian", capital: "Zagreb", bestTime: "May to September" },
    "dubrovnik": { currency: "Euro (€ / EUR)", language: "Croatian", capital: "Dubrovnik", bestTime: "May to September" },
    "split": { currency: "Euro (€ / EUR)", language: "Croatian", capital: "Split", bestTime: "May to September" },
    
    // Czech Republic
    "czech republic": { currency: "Czech Koruna (Kč / CZK)", language: "Czech", capital: "Prague", bestTime: "April to October" },
    "prague": { currency: "Czech Koruna (Kč / CZK)", language: "Czech", capital: "Prague", bestTime: "April to October" },
    
    // Hungary
    "hungary": { currency: "Hungarian Forint (Ft / HUF)", language: "Hungarian", capital: "Budapest", bestTime: "April to October" },
    "budapest": { currency: "Hungarian Forint (Ft / HUF)", language: "Hungarian", capital: "Budapest", bestTime: "April to October" },
    
    // Poland
    "poland": { currency: "Polish Złoty (zł / PLN)", language: "Polish", capital: "Warsaw", bestTime: "May to September" },
    "warsaw": { currency: "Polish Złoty (zł / PLN)", language: "Polish", capital: "Warsaw", bestTime: "May to September" },
    "krakow": { currency: "Polish Złoty (zł / PLN)", language: "Polish", capital: "Krakow", bestTime: "May to September" },
    
    // Ireland
    "ireland": { currency: "Euro (€ / EUR)", language: "English, Irish", capital: "Dublin", bestTime: "May to September" },
    "dublin": { currency: "Euro (€ / EUR)", language: "English, Irish", capital: "Dublin", bestTime: "May to September" },
    
    // Scandinavia
    "sweden": { currency: "Swedish Krona (kr / SEK)", language: "Swedish", capital: "Stockholm", bestTime: "May to September" },
    "norway": { currency: "Norwegian Krone (kr / NOK)", language: "Norwegian", capital: "Oslo", bestTime: "May to September" },
    "denmark": { currency: "Danish Krone (kr / DKK)", language: "Danish", capital: "Copenhagen", bestTime: "May to September" },
    "finland": { currency: "Euro (€ / EUR)", language: "Finnish, Swedish", capital: "Helsinki", bestTime: "June to August" },
    
    // Iceland
    "iceland": { currency: "Icelandic Króna (kr / ISK)", language: "Icelandic", capital: "Reykjavik", bestTime: "June to August & December to March" },
    "reykjavik": { currency: "Icelandic Króna (kr / ISK)", language: "Icelandic", capital: "Reykjavik", bestTime: "June to August" },
    
    // ========== NORTH AMERICA ==========
    // USA & Cities
    "usa": { currency: "US Dollar ($ / USD)", language: "English", capital: "Washington D.C.", bestTime: "April to June & September to November" },
    "united states": { currency: "US Dollar ($ / USD)", language: "English", capital: "Washington D.C.", bestTime: "April to June & September to November" },
    "new york": { currency: "US Dollar ($ / USD)", language: "English", capital: "New York City", bestTime: "April to June & September to November" },
    "los angeles": { currency: "US Dollar ($ / USD)", language: "English, Spanish", capital: "Los Angeles", bestTime: "March to May & September to November" },
    "chicago": { currency: "US Dollar ($ / USD)", language: "English", capital: "Chicago", bestTime: "April to October" },
    "miami": { currency: "US Dollar ($ / USD)", language: "English, Spanish", capital: "Miami", bestTime: "November to April" },
    "san francisco": { currency: "US Dollar ($ / USD)", language: "English", capital: "San Francisco", bestTime: "September to November" },
    "las vegas": { currency: "US Dollar ($ / USD)", language: "English", capital: "Las Vegas", bestTime: "March to May & September to November" },
    "orlando": { currency: "US Dollar ($ / USD)", language: "English", capital: "Orlando", bestTime: "January to April" },
    "washington dc": { currency: "US Dollar ($ / USD)", language: "English", capital: "Washington D.C.", bestTime: "March to May & September to November" },
    "boston": { currency: "US Dollar ($ / USD)", language: "English", capital: "Boston", bestTime: "June to October" },
    "seattle": { currency: "US Dollar ($ / USD)", language: "English", capital: "Seattle", bestTime: "July to September" },
    
    // Canada & Cities
    "canada": { currency: "Canadian Dollar (C$ / CAD)", language: "English, French", capital: "Ottawa", bestTime: "May to October" },
    "toronto": { currency: "Canadian Dollar (C$ / CAD)", language: "English", capital: "Toronto", bestTime: "May to September" },
    "vancouver": { currency: "Canadian Dollar (C$ / CAD)", language: "English", capital: "Vancouver", bestTime: "March to May & September to November" },
    "montreal": { currency: "Canadian Dollar (C$ / CAD)", language: "French, English", capital: "Montreal", bestTime: "May to October" },
    "banff": { currency: "Canadian Dollar (C$ / CAD)", language: "English", capital: "Banff", bestTime: "June to August & December to March" },
    
    // Mexico & Cities
    "mexico": { currency: "Mexican Peso ($ / MXN)", language: "Spanish", capital: "Mexico City", bestTime: "November to April" },
    "cancun": { currency: "Mexican Peso ($ / MXN)", language: "Spanish", capital: "Cancun", bestTime: "December to April" },
    "mexico city": { currency: "Mexican Peso ($ / MXN)", language: "Spanish", capital: "Mexico City", bestTime: "March to May & September to November" },
    "tulum": { currency: "Mexican Peso ($ / MXN)", language: "Spanish", capital: "Tulum", bestTime: "November to April" },
    
    // ========== SOUTH AMERICA ==========
    // Brazil & Cities
    "brazil": { currency: "Brazilian Real (R$ / BRL)", language: "Portuguese", capital: "Brasília", bestTime: "April to October" },
    "rio de janeiro": { currency: "Brazilian Real (R$ / BRL)", language: "Portuguese", capital: "Rio de Janeiro", bestTime: "December to March" },
    "sao paulo": { currency: "Brazilian Real (R$ / BRL)", language: "Portuguese", capital: "São Paulo", bestTime: "April to October" },
    "iguazu falls": { currency: "Brazilian Real (R$ / BRL)", language: "Portuguese", capital: "Foz do Iguaçu", bestTime: "April to May & September to October" },
    
    // Argentina
    "argentina": { currency: "Argentine Peso ($ / ARS)", language: "Spanish", capital: "Buenos Aires", bestTime: "March to May & September to November" },
    "buenos aires": { currency: "Argentine Peso ($ / ARS)", language: "Spanish", capital: "Buenos Aires", bestTime: "March to May & September to November" },
    "patagonia": { currency: "Argentine Peso ($ / ARS)", language: "Spanish", capital: "El Calafate", bestTime: "November to March" },
    
    // Peru
    "peru": { currency: "Peruvian Sol (S/ / PEN)", language: "Spanish", capital: "Lima", bestTime: "May to September" },
    "lima": { currency: "Peruvian Sol (S/ / PEN)", language: "Spanish", capital: "Lima", bestTime: "May to September" },
    "cusco": { currency: "Peruvian Sol (S/ / PEN)", language: "Spanish, Quechua", capital: "Cusco", bestTime: "April to October" },
    "machu picchu": { currency: "Peruvian Sol (S/ / PEN)", language: "Spanish, Quechua", capital: "Machu Picchu", bestTime: "April to October" },
    
    // Chile
    "chile": { currency: "Chilean Peso ($ / CLP)", language: "Spanish", capital: "Santiago", bestTime: "September to November" },
    "santiago": { currency: "Chilean Peso ($ / CLP)", language: "Spanish", capital: "Santiago", bestTime: "September to November" },
    "atacama": { currency: "Chilean Peso ($ / CLP)", language: "Spanish", capital: "San Pedro de Atacama", bestTime: "March to May & September to November" },
    
    // Colombia
    "colombia": { currency: "Colombian Peso ($ / COP)", language: "Spanish", capital: "Bogotá", bestTime: "December to March" },
    "bogota": { currency: "Colombian Peso ($ / COP)", language: "Spanish", capital: "Bogotá", bestTime: "December to March" },
    "medellin": { currency: "Colombian Peso ($ / COP)", language: "Spanish", capital: "Medellín", bestTime: "December to March" },

    // ========== AFRICA ==========
    // Egypt & Cities
    "egypt": { currency: "Egyptian Pound (£E / EGP)", language: "Arabic", capital: "Cairo", bestTime: "October to April" },
    "cairo": { currency: "Egyptian Pound (£E / EGP)", language: "Arabic", capital: "Cairo", bestTime: "October to April" },
    "luxor": { currency: "Egyptian Pound (£E / EGP)", language: "Arabic", capital: "Luxor", bestTime: "October to April" },
    "aswan": { currency: "Egyptian Pound (£E / EGP)", language: "Arabic", capital: "Aswan", bestTime: "October to April" },
    "sharm el sheikh": { currency: "Egyptian Pound (£E / EGP)", language: "Arabic, English", capital: "Sharm El Sheikh", bestTime: "October to April" },
    "hurghada": { currency: "Egyptian Pound (£E / EGP)", language: "Arabic, English", capital: "Hurghada", bestTime: "October to April" },

    // Morocco & Cities
    "morocco": { currency: "Moroccan Dirham (د.م. / MAD)", language: "Arabic, Berber", capital: "Rabat", bestTime: "March to May & September to November" },
    "marrakech": { currency: "Moroccan Dirham (د.م. / MAD)", language: "Arabic, Berber", capital: "Marrakech", bestTime: "March to May & September to November" },
    "casablanca": { currency: "Moroccan Dirham (د.م. / MAD)", language: "Arabic, Berber", capital: "Casablanca", bestTime: "March to May & September to November" },
    "fes": { currency: "Moroccan Dirham (د.م. / MAD)", language: "Arabic, Berber", capital: "Fes", bestTime: "March to May & September to November" },
    "tangier": { currency: "Moroccan Dirham (د.م. / MAD)", language: "Arabic, Berber", capital: "Tangier", bestTime: "March to May & September to November" },
    "chefchaouen": { currency: "Moroccan Dirham (د.م. / MAD)", language: "Arabic, Berber", capital: "Chefchaouen", bestTime: "March to May & September to November" },
    "essouira": { currency: "Moroccan Dirham (د.م. / MAD)", language: "Arabic, Berber", capital: "Essouira", bestTime: "March to May & September to November" },

    // South Africa & Cities
    "south africa": { currency: "South African Rand (R / ZAR)", language: "Afrikaans, English", capital: "Pretoria", bestTime: "May to September" },
    "cape town": { currency: "South African Rand (R / ZAR)", language: "Afrikaans, English", capital: "Cape Town", bestTime: "November to March" },
    "johannesburg": { currency: "South African Rand (R / ZAR)", language: "Afrikaans, English", capital: "Johannesburg", bestTime: "April to September" },
    "durban": { currency: "South African Rand (R / ZAR)", language: "Afrikaans, English", capital: "Durban", bestTime: "April to September" },
    "kruger national park": { currency: "South African Rand (R / ZAR)", language: "Afrikaans, English", capital: "Kruger Park", bestTime: "May to September" },
    "garden route": { currency: "South African Rand (R / ZAR)", language: "Afrikaans, English", capital: "George", bestTime: "November to March" },

    // Kenya & Cities
    "kenya": { currency: "Kenyan Shilling (KSh / KES)", language: "Swahili, English", capital: "Nairobi", bestTime: "July to October" },
    "nairobi": { currency: "Kenyan Shilling (KSh / KES)", language: "Swahili, English", capital: "Nairobi", bestTime: "July to October" },
    "mombasa": { currency: "Kenyan Shilling (KSh / KES)", language: "Swahili, English", capital: "Mombasa", bestTime: "January to March & July to October" },
    "maasai mara": { currency: "Kenyan Shilling (KSh / KES)", language: "Swahili, English", capital: "Maasai Mara", bestTime: "July to October (Great Migration)" },

    // Tanzania & Cities
    "tanzania": { currency: "Tanzanian Shilling (TSh / TZS)", language: "Swahili, English", capital: "Dodoma", bestTime: "June to October" },
    "dar es salaam": { currency: "Tanzanian Shilling (TSh / TZS)", language: "Swahili, English", capital: "Dar es Salaam", bestTime: "June to October" },
    "zanzibar": { currency: "Tanzanian Shilling (TSh / TZS)", language: "Swahili, English", capital: "Zanzibar City", bestTime: "June to October" },
    "arusha": { currency: "Tanzanian Shilling (TSh / TZS)", language: "Swahili, English", capital: "Arusha", bestTime: "June to October" },
    "serengeti": { currency: "Tanzanian Shilling (TSh / TZS)", language: "Swahili, English", capital: "Serengeti", bestTime: "June to October (Great Migration)" },

    // Mauritius
    "mauritius": { currency: "Mauritian Rupee (₨ / MUR)", language: "English, French", capital: "Port Louis", bestTime: "May to December" },

    // Seychelles
    "seychelles": { currency: "Seychellois Rupee (₨ / SCR)", language: "English, French", capital: "Victoria", bestTime: "April to May & October to November" },

    // Botswana
    "botswana": { currency: "Botswana Pula (P / BWP)", language: "English, Tswana", capital: "Gaborone", bestTime: "May to October" },
    "okavango delta": { currency: "Botswana Pula (P / BWP)", language: "English, Tswana", capital: "Maun", bestTime: "June to August" },

    // Namibia
    "namibia": { currency: "Namibian Dollar (N$ / NAD)", language: "English", capital: "Windhoek", bestTime: "May to October" },
    "windhoek": { currency: "Namibian Dollar (N$ / NAD)", language: "English", capital: "Windhoek", bestTime: "May to October" },
    "swakopmund": { currency: "Namibian Dollar (N$ / NAD)", language: "English", capital: "Swakopmund", bestTime: "May to October" },

    // Zimbabwe
    "zimbabwe": { currency: "US Dollar (USD)", language: "English, Shona", capital: "Harare", bestTime: "April to October" },
    "victoria falls": { currency: "US Dollar (USD)", language: "English", capital: "Victoria Falls", bestTime: "February to May" },

    // Zambia
    "zambia": { currency: "Zambian Kwacha (ZK / ZMW)", language: "English", capital: "Lusaka", bestTime: "May to October" },
    "livingstone": { currency: "Zambian Kwacha (ZK / ZMW)", language: "English", capital: "Livingstone", bestTime: "February to May" },

    // Uganda
    "uganda": { currency: "Ugandan Shilling (USh / UGX)", language: "English, Swahili", capital: "Kampala", bestTime: "June to September & December to February" },
    "kampala": { currency: "Ugandan Shilling (USh / UGX)", language: "English, Swahili", capital: "Kampala", bestTime: "June to September & December to February" },
    "bwindi": { currency: "Ugandan Shilling (USh / UGX)", language: "English", capital: "Bwindi", bestTime: "June to August & December to February" },

    // Rwanda
    "rwanda": { currency: "Rwandan Franc (RF / RWF)", language: "English, French", capital: "Kigali", bestTime: "June to September" },
    "kigali": { currency: "Rwandan Franc (RF / RWF)", language: "English, French", capital: "Kigali", bestTime: "June to September" },

    // Ghana
    "ghana": { currency: "Ghanaian Cedi (₵ / GHS)", language: "English", capital: "Accra", bestTime: "November to March" },
    "accra": { currency: "Ghanaian Cedi (₵ / GHS)", language: "English", capital: "Accra", bestTime: "November to March" },

    // Nigeria
    "nigeria": { currency: "Nigerian Naira (₦ / NGN)", language: "English", capital: "Abuja", bestTime: "November to February" },
    "lagos": { currency: "Nigerian Naira (₦ / NGN)", language: "English", capital: "Lagos", bestTime: "November to February" },
    "abuja": { currency: "Nigerian Naira (₦ / NGN)", language: "English", capital: "Abuja", bestTime: "November to February" },

    // Senegal
    "senegal": { currency: "West African CFA Franc (CFA / XOF)", language: "French", capital: "Dakar", bestTime: "November to May" },
    "dakar": { currency: "West African CFA Franc (CFA / XOF)", language: "French", capital: "Dakar", bestTime: "November to May" },

    // Ethiopia
    "ethiopia": { currency: "Ethiopian Birr (Br / ETB)", language: "Amharic", capital: "Addis Ababa", bestTime: "October to June" },
    "addis ababa": { currency: "Ethiopian Birr (Br / ETB)", language: "Amharic", capital: "Addis Ababa", bestTime: "October to June" },

    // Madagascar
    "madagascar": { currency: "Malagasy Ariary (Ar / MGA)", language: "Malagasy, French", capital: "Antananarivo", bestTime: "April to October" },
};

function getDestinationInfo(destination) {
    if (!destination) return null;
    const destLower = destination.toLowerCase().trim();
    
    // Try exact match
    if (destinationDatabase[destLower]) return destinationDatabase[destLower];
    
    // Try partial match
    for (const key in destinationDatabase) {
        if (destLower.includes(key) || key.includes(destLower)) {
            return destinationDatabase[key];
        }
    }
    
    return null;
}

// ===========================================
// COMPREHENSIVE AIRPORT CODE DATABASE
// ===========================================
const airportDatabase = {
    // ========== INDIA ==========
    "mumbai": "BOM",
    "bombay": "BOM",
    "delhi": "DEL",
    "new delhi": "DEL",
    "bangalore": "BLR",
    "bengaluru": "BLR",
    "chennai": "MAA",
    "madras": "MAA",
    "kolkata": "CCU",
    "calcutta": "CCU",
    "hyderabad": "HYD",
    "ahmedabad": "AMD",
    "pune": "PNQ",
    "goa": "GOI",
    "jaipur": "JAI",
    "lucknow": "LKO",
    "kochi": "COK",
    "cochin": "COK",
    
    // ========== AUSTRALIA ==========
    "australia": "SYD",
    "sydney": "SYD",
    "melbourne": "MEL",
    "brisbane": "BNE",
    "perth": "PER",
    "adelaide": "ADL",
    "gold coast": "OOL",
    "cairns": "CNS",
    "canberra": "CBR",
    
    // ========== USA ==========
    "usa": "JFK",
    "united states": "JFK",
    "new york": "JFK",
    "nyc": "JFK",
    "los angeles": "LAX",
    "la": "LAX",
    "chicago": "ORD",
    "miami": "MIA",
    "san francisco": "SFO",
    "sf": "SFO",
    "las vegas": "LAS",
    "vegas": "LAS",
    "boston": "BOS",
    "seattle": "SEA",
    "washington": "IAD",
    "dc": "IAD",
    "orlando": "MCO",
    "dallas": "DFW",
    "houston": "IAH",
    "denver": "DEN",
    "phoenix": "PHX",
    "atlanta": "ATL",
    "detroit": "DTW",
    "minneapolis": "MSP",
    
    // ========== CANADA ==========
    "canada": "YYZ",
    "toronto": "YYZ",
    "vancouver": "YVR",
    "montreal": "YUL",
    "calgary": "YYC",
    "ottawa": "YOW",
    
    // ========== UK ==========
    "uk": "LHR",
    "united kingdom": "LHR",
    "london": "LHR",
    "manchester": "MAN",
    "edinburgh": "EDI",
    "glasgow": "GLA",
    "birmingham": "BHX",
    "liverpool": "LPL",
    
    // ========== FRANCE ==========
    "france": "CDG",
    "paris": "CDG",
    "nice": "NCE",
    "lyon": "LYS",
    "marseille": "MRS",
    "bordeaux": "BOD",
    
    // ========== GERMANY ==========
    "germany": "FRA",
    "berlin": "BER",
    "munich": "MUC",
    "frankfurt": "FRA",
    "hamburg": "HAM",
    "cologne": "CGN",
    "dusseldorf": "DUS",
    
    // ========== ITALY ==========
    "italy": "FCO",
    "rome": "FCO",
    "milan": "MXP",
    "venice": "VCE",
    "florence": "FLR",
    "naples": "NAP",
    
    // ========== SPAIN ==========
    "spain": "MAD",
    "madrid": "MAD",
    "barcelona": "BCN",
    "valencia": "VLC",
    "seville": "SVQ",
    "malaga": "AGP",
    
    // ========== PORTUGAL ==========
    "portugal": "LIS",
    "lisbon": "LIS",
    "porto": "OPO",
    
    // ========== NETHERLANDS ==========
    "netherlands": "AMS",
    "amsterdam": "AMS",
    "rotterdam": "RTM",
    
    // ========== BELGIUM ==========
    "belgium": "BRU",
    "brussels": "BRU",
    
    // ========== SWITZERLAND ==========
    "switzerland": "ZRH",
    "zurich": "ZRH",
    "geneva": "GVA",
    
    // ========== AUSTRIA ==========
    "austria": "VIE",
    "vienna": "VIE",
    "salzburg": "SZG",
    
    // ========== GREECE ==========
    "greece": "ATH",
    "athens": "ATH",
    "santorini": "JTR",
    "mykonos": "JMK",
    "crete": "HER",
    
    // ========== TURKEY ==========
    "turkey": "IST",
    "istanbul": "IST",
    "ankara": "ESB",
    "antalya": "AYT",
    
    // ========== JAPAN ==========
    "japan": "NRT",
    "tokyo": "NRT",
    "osaka": "KIX",
    "kyoto": "ITM",
    "hokkaido": "CTS",
    "nagoya": "NGO",
    "fukuoka": "FUK",
    
    // ========== SOUTH KOREA ==========
    "south korea": "ICN",
    "korea": "ICN",
    "seoul": "ICN",
    "busan": "PUS",
    
    // ========== CHINA ==========
    "china": "PEK",
    "beijing": "PEK",
    "shanghai": "PVG",
    "hong kong": "HKG",
    "macau": "MFM",
    "guangzhou": "CAN",
    "shenzhen": "SZX",
    
    // ========== THAILAND ==========
    "thailand": "BKK",
    "bangkok": "BKK",
    "phuket": "HKT",
    "chiang mai": "CNX",
    "krabi": "KBV",
    "pattaya": "UTP",
    
    // ========== VIETNAM ==========
    "vietnam": "HAN",
    "hanoi": "HAN",
    "ho chi minh": "SGN",
    "saigon": "SGN",
    "da nang": "DAD",
    
    // ========== INDONESIA ==========
    "indonesia": "CGK",
    "bali": "DPS",
    "jakarta": "CGK",
    "surabaya": "SUB",
    "yogyakarta": "JOG",
    "lombok": "LOP",
    
    // ========== MALAYSIA ==========
    "malaysia": "KUL",
    "kuala lumpur": "KUL",
    "penang": "PEN",
    "langkawi": "LGK",
    "borneo": "BKI",
    
    // ========== SINGAPORE ==========
    "singapore": "SIN",
    
    // ========== PHILIPPINES ==========
    "philippines": "MNL",
    "manila": "MNL",
    "cebu": "CEB",
    "palawan": "PPS",
    
    // ========== UAE ==========
    "uae": "DXB",
    "dubai": "DXB",
    "abu dhabi": "AUH",
    "sharjah": "SHJ",
    
    // ========== QATAR ==========
    "qatar": "DOH",
    "doha": "DOH",
    
    // ========== SAUDI ARABIA ==========
    "saudi arabia": "RUH",
    "riyadh": "RUH",
    "jeddah": "JED",
    
    // ========== KUWAIT ==========
    "kuwait": "KWI",
    "kuwait city": "KWI",
    
    // ========== OMAN ==========
    "oman": "MCT",
    "muscat": "MCT",
    
    // ========== JORDAN ==========
    "jordan": "AMM",
    "amman": "AMM",
    "petra": "AQJ",
    
    // ========== ISRAEL ==========
    "israel": "TLV",
    "tel aviv": "TLV",
    "jerusalem": "TLV",
    
    // ========== EGYPT ==========
    "egypt": "CAI",
    "cairo": "CAI",
    "luxor": "LXR",
    "sharm el sheikh": "SSH",
    "hurghada": "HRG",
    
    // ========== MOROCCO ==========
    "morocco": "CMN",
    "casablanca": "CMN",
    "marrakech": "RAK",
    "fes": "FEZ",
    "tangier": "TNG",
    
    // ========== SOUTH AFRICA ==========
    "south africa": "JNB",
    "johannesburg": "JNB",
    "cape town": "CPT",
    "durban": "DUR",
    
    // ========== KENYA ==========
    "kenya": "NBO",
    "nairobi": "NBO",
    "mombasa": "MBA",
    
    // ========== TANZANIA ==========
    "tanzania": "DAR",
    "dar es salaam": "DAR",
    "zanzibar": "ZNZ",
    "arusha": "ARK",
    
    // ========== MAURITIUS ==========
    "mauritius": "MRU",
    
    // ========== BRAZIL ==========
    "brazil": "GRU",
    "sao paulo": "GRU",
    "rio de janeiro": "GIG",
    "brasilia": "BSB",
    "salvador": "SSA",
    
    // ========== ARGENTINA ==========
    "argentina": "EZE",
    "buenos aires": "EZE",
    
    // ========== PERU ==========
    "peru": "LIM",
    "lima": "LIM",
    "cusco": "CUZ",
    
    // ========== CHILE ==========
    "chile": "SCL",
    "santiago": "SCL",
    
    // ========== COLOMBIA ==========
    "colombia": "BOG",
    "bogota": "BOG",
    "medellin": "MDE",
    
    // ========== MEXICO ==========
    "mexico": "MEX",
    "mexico city": "MEX",
    "cancun": "CUN",
    "tulum": "TQO",
    "puerto vallarta": "PVR"
};

function getAirportCode(cityName) {
    if (!cityName) return "JFK";
    
    const lowerCity = cityName.toLowerCase().trim();
    console.log(`🔍 Looking up airport code for: "${lowerCity}"`);
    
    // Direct match
    if (airportDatabase[lowerCity]) {
        console.log(`✅ Found: ${airportDatabase[lowerCity]}`);
        return airportDatabase[lowerCity];
    }
    
    // Partial match
    for (let [city, code] of Object.entries(airportDatabase)) {
        if (lowerCity.includes(city) || city.includes(lowerCity)) {
            console.log(`✅ Found partial match: ${city} → ${code}`);
            return code;
        }
    }
    
    console.log(`⚠️ No airport code found for: ${cityName}, using default JFK`);
    return "JFK";
}

function getFlightPrice(origin, destination) {
    const originCode = getAirportCode(origin);
    const destCode = getAirportCode(destination);
    
    console.log(`✈️ Route: ${originCode} → ${destCode}`);
    
    // Route-based pricing
    const routePrices = {
        // From India
        "BOM-SYD": 850, "BOM-MEL": 850, "BOM-PER": 750,
        "DEL-SYD": 800, "DEL-MEL": 800,
        
        // From USA
        "JFK-SYD": 1400, "JFK-MEL": 1400, "LAX-SYD": 1200,
        
        // From UK
        "LHR-SYD": 1100, "LHR-MEL": 1100,
        
        // From Singapore
        "SIN-SYD": 550, "SIN-MEL": 550, "SIN-PER": 450,
        
        // Default
        "BOM-JFK": 850, "JFK-CDG": 650, "JFK-LHR": 600,
        "BOM-CDG": 800, "BOM-LHR": 700, "SIN-BKK": 150
    };
    
    const routeKey = `${originCode}-${destCode}`;
    const reverseKey = `${destCode}-${originCode}`;
    
    let price = routePrices[routeKey] || routePrices[reverseKey];
    
    if (!price) {
        if (destCode === "SYD" || destCode === "MEL") price = 850;
        else if (destCode === "BKK") price = 400;
        else if (destCode === "SIN") price = 450;
        else price = 500;
    }
    
    return price;
}




async function getDestinationPhotos(destination) {
    const photos = [];
    const lowerDest = destination.toLowerCase();
    
    // Specific search terms for different types of photos
    const photoQueries = {
        // Popular destinations with specific landmarks
        "paris": ["eiffel tower", "louvre museum", "notre dame", "montmartre"],
        "london": ["big ben", "tower bridge", "buckingham palace", "london eye"],
        "new york": ["statue of liberty", "times square", "central park", "empire state building"],
        "tokyo": ["tokyo tower", "shibuya crossing", "senso-ji temple", "shinjuku"],
        "bali": ["uluwatu temple", "tanah lot", "rice terraces", "bali beach"],
        "singapore": ["marina bay sands", "gardens by the bay", "sentosa", "merlion"],
        "sydney": ["sydney opera house", "sydney harbour bridge", "bondi beach", "darling harbour"],
        "dubai": ["burj khalifa", "palm jumeirah", "burj al arab", "dubai fountain"],
        "rome": ["colosseum", "trevi fountain", "vatican", "pantheon"],
        "bangkok": ["grand palace", "wat arun", "wat pho", "chatuchak market"],
        "mumbai": ["gateway of india", "marine drive", "taj hotel", "juhu beach"],
        "delhi": ["india gate", "qutub minar", "red fort", "lotus temple"],
        "jaipur": ["hawa mahal", "amber fort", "city palace", "jal mahal"],
        "agra": ["taj mahal", "agra fort", "fatehpur sikri", "itmad ud daulah"]
    };
    
    // Get specific queries or use generic
    let queries = photoQueries[lowerDest];
    if (!queries) {
        queries = [`${destination} landmark`, `${destination} tourist attraction`, `${destination} famous place`];
    }
    
    // Try Unsplash first if key exists
    if (process.env.UNSPLASH_KEY && process.env.UNSPLASH_KEY !== 'your-unsplash-key-here') {
        for (let i = 0; i < Math.min(queries.length, 2); i++) {
            try {
                const response = await axios.get('https://api.unsplash.com/search/photos', {
                    params: {
                        query: queries[i],
                        per_page: 5,
                        orientation: 'landscape'
                    },
                    headers: {
                        'Authorization': `Client-ID ${process.env.UNSPLASH_KEY}`
                    },
                    timeout: 5000
                });
                
                if (response.data && response.data.results && response.data.results.length > 0) {
                    const img = response.data.results[0];
                    photos.push({
                        url: img.urls.regular,
                        thumb: img.urls.small,
                        description: img.description || img.alt_description || `${queries[i]} in ${destination}`,
                        credit: img.user.name
                    });
                }
            } catch (e) {
                console.log(`Unsplash query failed: ${queries[i]}`);
            }
        }
    }
    
    // If Unsplash failed or no photos, use reliable image URLs
    if (photos.length < 2) {
        // Reliable image sources using Lorem Picsum with keywords
        const reliableImages = [
            `https://picsum.photos/id/104/800/600?grayscale`, // Landmark
            `https://picsum.photos/id/15/800/600`, // Nature
            `https://picsum.photos/id/96/800/600`, // Mountain
            `https://picsum.photos/id/42/800/600`, // City
            `https://picsum.photos/id/20/800/600`  // Beach
        ];
        
        // Use destination-specific Picsum images
        const seedMap = {
            "paris": 104, "london": 15, "new york": 42, "tokyo": 96, 
            "bali": 20, "singapore": 42, "sydney": 15, "dubai": 104,
            "rome": 96, "bangkok": 20, "mumbai": 15, "delhi": 104,
            "jaipur": 96, "agra": 104
        };
        
        const seed = seedMap[lowerDest] || 42;
        
        if (photos.length === 0) {
            photos.push({
                url: `https://picsum.photos/id/${seed}/800/600`,
                description: `${destination} landmark view`,
                thumb: `https://picsum.photos/id/${seed}/200/150`
            });
            photos.push({
                url: `https://picsum.photos/id/${seed + 10}/800/600`,
                description: `${destination} travel scene`,
                thumb: `https://picsum.photos/id/${seed + 10}/200/150`
            });
        } else if (photos.length === 1) {
            photos.push({
                url: `https://picsum.photos/id/${seed + 5}/800/600`,
                description: `${destination} scenic view`,
                thumb: `https://picsum.photos/id/${seed + 5}/200/150`
            });
        }
    }
    
    return photos.slice(0, 2);
}

function isValidPlace(value) {
    return typeof value === 'string' &&
        value.trim().length > 0 &&
        value.trim().length <= 100 &&
        /^[\p{L}\p{M}0-9 .,'’()&/-]+$/u.test(value.trim());
}

function isValidDate(value) {
    if (value === '' || value === undefined || value === null) return true;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

// ===========================================
// CHAT ENDPOINT - WORKING VERSION
// ===========================================
app.post('/api/chat', async (req, res) => {
    let safeDestination = 'Paris';
    try {
        const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
        const message = typeof body.message === 'string' ? body.message.trim() : '';
        if (!message || message.length > 4000) {
            return res.status(400).json({ success: false, error: 'Message must be between 1 and 4000 characters.' });
        }

        const tripContext = body.tripContext && typeof body.tripContext === 'object' && !Array.isArray(body.tripContext)
            ? body.tripContext
            : {};
        safeDestination = isValidPlace(tripContext.destination) ? tripContext.destination.trim() : 'Paris';
        const peopleValue = Number(tripContext.people);
        const budgetValue = Number(tripContext.budget);
        const people = Number.isInteger(peopleValue) && peopleValue >= 1 && peopleValue <= 20 ? peopleValue : 2;
        const budget = Number.isFinite(budgetValue) && budgetValue >= 0 && budgetValue <= 100000 ? budgetValue : 2000;
        
        if (!GROQ_API_KEY) {
            return sendWorkingFallback(res, safeDestination);
        }
        const destination = safeDestination;
        
        // Simple, direct prompt
        let userPrompt = `Recommend 5 places to visit in ${destination || "Paris"} for ${people} people with a budget of $${budget}. 
        
For each place, include:
- Entry cost in local currency
- Transport info
- Time needed
- Best time to visit

Format exactly like this:
1. **Real Place Name** - Brief description
   Entry: $XX
   Transport: How to get there
   Time: X hours
   Best Time: When to visit

2. **Next Place**...

Also add:
💡 Travel Tips (3-4 tips)
🔍 Book with Local Experts (2-3 Google Maps links for tour operators)`;

        const messages = [
            { role: "system", content: "You are an expert travel guide. Give REAL place names, not generic ones. Be specific and accurate." },
            { role: "user", content: userPrompt }
        ];
        
        // Call Groq API
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.3-70b-versatile",
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        }, {
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            timeout: 30000
        });
        
        let aiResponse = response.data.choices[0].message.content;
        // Add the tour link at the end if not present
        if (destination && !aiResponse.includes('Check it out')) {
            const destEncoded = encodeURIComponent(destination);
            aiResponse += `\n\n🔍 **Book with Local Experts**\n• <a href="https://www.google.com/maps/search/tour+operators+${destEncoded}" target="_blank" class="consultant-link">Find Tours in ${destination}</a>`;
        }
        
        res.json({ success: true, message: aiResponse });
        
    } catch (error) {
        console.error('Chat request failed:', error.message);
        sendWorkingFallback(res, safeDestination);
    }
});

// ===========================================
// FALLBACK FUNCTION - WORKING
// ===========================================
function sendWorkingFallback(res, destination = 'Paris') {
    const destLower = destination.toLowerCase();
    
    let response = "";
    
    // Paris
    if (destLower.includes("paris")) {
        response = `🏰 **Top 5 Places to Visit in Paris**

**1. Eiffel Tower**
   Entry: €11-28 (depending on level)
   Transport: Metro line 6 to Bir-Hakeim (€2.10)
   Time: 2-3 hours
   Best Time: Sunset or early morning

**2. Louvre Museum**
   Entry: €17 (online booking recommended)
   Transport: Metro line 1 to Palais Royal (€2.10)
   Time: 3-4 hours minimum
   Best Time: Wednesday/Friday evenings

**3. Notre-Dame Cathedral**
   Entry: Free (exterior viewing)
   Transport: Metro line 4 to Cité (€2.10)
   Time: 1-2 hours
   Best Time: Morning

**4. Montmartre & Sacré-Cœur**
   Entry: Free
   Transport: Metro line 2 to Anvers (€2.10)
   Time: 2-3 hours
   Best Time: Morning

**5. Seine River Cruise**
   Entry: €10-15
   Transport: Pont Neuf or Eiffel Tower departure
   Time: 1 hour
   Best Time: Sunset

💡 **Travel Tips**
- Book Eiffel Tower tickets weeks in advance
- Get a Paris Museum Pass for multiple attractions
- Learn basic French phrases (Bonjour, Merci)
- Use the Metro for easy transport

🔍 **Book with Local Experts**
• <a href="https://www.google.com/maps/search/tour+operators+Paris" target="_blank" class="consultant-link">Find Tour Operators in Paris</a>
• <a href="https://www.google.com/maps/search/travel+agencies+Paris" target="_blank" class="consultant-link">Find Travel Agencies in Paris</a>`;
    }
    // London
    else if (destLower.includes("london")) {
        response = `🏰 **Top 5 Places to Visit in London**

**1. The British Museum**
   Entry: Free
   Transport: Tube to Tottenham Court Road (£2.80)
   Time: 2-3 hours
   Best Time: Weekday mornings

**2. Tower of London**
   Entry: £33.60 (online advance booking)
   Transport: Tube to Tower Hill (£2.80)
   Time: 2-3 hours
   Best Time: Arrive at opening (9am)

**3. Buckingham Palace**
   Entry: £30-49 (State Rooms)
   Transport: Tube to Green Park (£2.80)
   Time: 1-2 hours
   Best Time: 11am for Changing of the Guard

**4. London Eye**
   Entry: £30-40 (book online)
   Transport: Tube to Waterloo (£2.80)
   Time: 30-60 minutes
   Best Time: Sunset

**5. Hyde Park**
   Entry: Free
   Transport: Tube to Hyde Park Corner (£2.80)
   Time: 1-3 hours
   Best Time: Afternoon

💡 **Travel Tips**
- Get an Oyster card for cheaper Tube fares
- Book attractions online in advance
- Walk or use Santander Cycles
- Visit markets like Borough Market

🔍 **Book with Local Experts**
• <a href="https://www.google.com/maps/search/tour+operators+London" target="_blank" class="consultant-link">Find Tour Operators in London</a>
• <a href="https://www.google.com/maps/search/travel+agencies+London" target="_blank" class="consultant-link">Find Travel Agencies in London</a>`;
    }
    // Singapore
    else if (destLower.includes("singapore")) {
        response = `🏰 **Top 5 Places to Visit in Singapore**

**1. Gardens by the Bay**
   Entry: SGD 28 (Flower Dome & Cloud Forest)
   Transport: MRT to Bayfront Station (SGD 1.50)
   Time: 2-3 hours
   Best Time: Morning or late afternoon

**2. Marina Bay Sands SkyPark**
   Entry: SGD 23
   Transport: MRT to Bayfront Station (SGD 1.50)
   Time: 1-2 hours
   Best Time: Sunset

**3. Universal Studios Singapore**
   Entry: SGD 68
   Transport: MRT to HarbourFront, then Sentosa Express (SGD 4)
   Time: 6-8 hours
   Best Time: Weekdays

**4. Chinatown**
   Entry: Free
   Transport: MRT to Chinatown Station (SGD 1.50)
   Time: 2-3 hours
   Best Time: Morning

**5. Sentosa Island**
   Entry: Free
   Transport: MRT to HarbourFront, then Sentosa Express (SGD 4)
   Time: 4-6 hours
   Best Time: Morning

💡 **Travel Tips**
- Get a Singapore Tourist Pass for unlimited travel
- Try local hawker center food
- Stay hydrated in the humidity
- Visit Gardens by the Bay at night for light show

🔍 **Book with Local Experts**
• <a href="https://www.google.com/maps/search/tour+operators+Singapore" target="_blank" class="consultant-link">Find Tour Operators in Singapore</a>
• <a href="https://www.google.com/maps/search/travel+agencies+Singapore" target="_blank" class="consultant-link">Find Travel Agencies in Singapore</a>`;
    }
    // Sydney/Australia
    else if (destLower.includes("sydney") || destLower.includes("australia")) {
        response = `🏰 **Top 5 Places to Visit in Sydney**

**1. Sydney Opera House**
   Entry: Tours from AUD 43
   Transport: Circular Quay station
   Time: 1-2 hours
   Best Time: Morning or sunset

**2. Sydney Harbour Bridge**
   Entry: Free to walk, climb from AUD 174
   Transport: Circular Quay station
   Time: 1-3 hours
   Best Time: Morning

**3. Bondi Beach**
   Entry: Free
   Transport: Bus from Bondi Junction
   Time: 2-4 hours
   Best Time: Morning or late afternoon

**4. Taronga Zoo**
   Entry: AUD 46
   Transport: Ferry from Circular Quay
   Time: 3-4 hours
   Best Time: Morning

**5. The Rocks**
   Entry: Free
   Transport: Circular Quay station
   Time: 2-3 hours
   Best Time: Weekends for markets

💡 **Travel Tips**
- Get an Opal card for public transport
- Wear sunscreen and a hat
- Book Opera House tickets in advance
- Take the ferry for best harbour views

🔍 **Book with Local Experts**
• <a href="https://www.google.com/maps/search/tour+operators+Sydney" target="_blank" class="consultant-link">Find Tour Operators in Sydney</a>
• <a href="https://www.google.com/maps/search/travel+agencies+Sydney" target="_blank" class="consultant-link">Find Travel Agencies in Sydney</a>`;
    }
    // Default
    else {
        response = `I'd be happy to help you discover amazing places in ${destination}! 🌍

**1. Main City Square**
   Entry: Free
   Transport: Walking distance
   Time: 1-2 hours
   Best Time: Morning

**2. Central Museum**
   Entry: $10-15
   Transport: Local bus or taxi
   Time: 2-3 hours
   Best Time: Afternoon

**3. Local Market**
   Entry: Free
   Transport: Easy access
   Time: 1-2 hours
   Best Time: Morning

**4. Scenic Viewpoint**
   Entry: Free
   Transport: Short walk
   Time: 1 hour
   Best Time: Sunset

**5. Cultural Landmark**
   Entry: $5-10
   Transport: Local transport
   Time: 1-2 hours
   Best Time: Morning

💡 **Travel Tips**
- Book accommodations in advance
- Try local cuisine
- Learn basic local phrases

🔍 **Book with Local Experts**
• <a href="https://www.google.com/maps/search/tour+operators+${encodeURIComponent(destination)}" target="_blank" class="consultant-link">Find Tour Operators in ${destination}</a>`;
    }
    
    res.json({ success: true, message: response });
}

// ===========================================
// PLAN TRIP ENDPOINT - WITH ACCURATE DATA
// ===========================================
app.post('/api/plan-trip', async (req, res) => {
    try {
        const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
        const { destination, origin, startDate, endDate } = body;
        const budget = Number(body.budget);
        const people = Number(body.people);
        if (!isValidPlace(destination) || !isValidPlace(origin)) {
            return res.status(400).json({ success: false, error: 'Enter a valid origin and destination.' });
        }
        if (!Number.isFinite(budget) || budget < 100 || budget > 100000 ||
            !Number.isInteger(people) || people < 1 || people > 20) {
            return res.status(400).json({ success: false, error: 'Budget or traveler count is outside the allowed range.' });
        }
        if (!isValidDate(startDate) || !isValidDate(endDate) ||
            (startDate && endDate && endDate < startDate)) {
            return res.status(400).json({ success: false, error: 'Enter valid trip dates.' });
        }
        
        // Get photos for the destination
        const photos = await getDestinationPhotos(destination);
        
        // Get destination info from database
        const destInfo = getDestinationInfo(destination) || {
            currency: "Local currency",
            language: "Local language",
            capital: destination,
            bestTime: "Spring or Fall"
        };
        
        // Generate hotels
        const hotels = [
            { name: `The Grand ${destination}`, pricePerNight: Math.round(budget * 0.2), rating: 4.8, description: "Luxury hotel with premium amenities", amenities: ["Infinity Pool", "Spa", "Fine Dining"] },
            { name: `${destination} City Central`, pricePerNight: Math.round(budget * 0.15), rating: 4.3, description: "Perfect central location", amenities: ["Free WiFi", "Restaurant", "Gym"] },
            { name: `${destination} Comfort Inn`, pricePerNight: Math.round(budget * 0.1), rating: 4.0, description: "Great value for money", amenities: ["Free WiFi", "Breakfast Included"] }
        ];
        
        res.json({
            success: true,
            data: {
                destination: destination,
                origin: origin,
                startDate: startDate,
                endDate: endDate,
                budget: budget,
                people: people,
                description: `${destination} is a beautiful destination with rich culture and amazing experiences.`,
                currency: destInfo.currency,
                language: destInfo.language,
                capital: destInfo.capital,
                bestTimeToVisit: destInfo.bestTime,
                flightPrice: getFlightPrice(origin, destination),
                hotels: hotels,
                photos: photos,
                tips: [
                    "Book accommodations in advance for best rates",
                    "Learn a few basic local phrases",
                    "Check visa requirements before traveling",
                    "Pack according to the season",
                    "Try local cuisine and street food"
                ]
            }
        });
    } catch (error) {
        console.error('Plan trip request failed:', error.message);
        res.status(500).json({ success: false, error: 'Unable to plan this trip right now.' });
    }
});

// ===========================================
// RANDOM TRIP
// ===========================================
app.post('/api/random-trip', async (req, res) => {
    const destinations = ["Paris", "Tokyo", "Bali", "New York", "London", "Dubai", "Rome", "Bangkok", "Singapore", "Sydney"];
    const randomDest = destinations[Math.floor(Math.random() * destinations.length)];
    const randomBudget = [1000, 1500, 2000, 2500, 3000][Math.floor(Math.random() * 5)];
    const randomPeople = [1, 2, 3, 4][Math.floor(Math.random() * 4)];
    
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4);
    
    res.json({
        success: true,
        data: {
            destination: randomDest,
            origin: "New York",
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            budget: randomBudget,
            people: randomPeople,
            description: `Discover the magic of ${randomDest}!`,
            currency: "Local currency",
            language: "Local language",
            capital: randomDest,
            bestTimeToVisit: "Spring or Fall",
            flightPrice: 600
        }
    });
});

// ===========================================
// START SERVER
// ===========================================
app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status === 413 ? 413 : 500;
    res.status(status).json({ success: false, error: status === 413 ? 'Request body is too large.' : 'Internal server error.' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
