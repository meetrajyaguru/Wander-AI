const mongoose = require('mongoose');

// Trip Schema - Stores everything
const tripSchema = new mongoose.Schema({
    // Trip Details
    destination: { type: String, required: true },
    origin: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    budget: { type: Number, required: true },
    budgetOption: { type: String, required: true },
    people: { type: Number, required: true },
    
    // Generated Trip Data
    description: { type: String },
    currency: { type: String },
    language: { type: String },
    capital: { type: String },
    bestTime: { type: String },
    flightPrice: { type: Number },
    
    // Hotels Data
    hotels: { type: Array, default: [] },
    
    // Photos Data
    photos: { type: Array, default: [] },
    
    // FULL Chat History - All messages
    chatHistory: { 
        type: Array, 
        default: [],
        of: {
            text: String,
            isUser: Boolean,
            timestamp: Date
        }
    },
    
    // When saved
    savedAt: { type: Date, default: Date.now },
    
    // PDF filename
    pdfFilename: { type: String },
    
    // User association
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Trip', tripSchema);
