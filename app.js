require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const flash = require('connect-flash');
const path = require('path');

const app = express();

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trip-planner', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err.message));

// User Schema
const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: String,
  trips: [{
    destination: String,
    startDate: Date,
    endDate: Date,
    budget: Number,
    people: Number,
    itinerary: Object,
    createdAt: { type: Date, default: Date.now }
  }]
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value
        });
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Authentication Middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

// Routes
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

app.get('/login', (req, res) => {
  res.render('login', { messages: req.flash('error') });
});

app.get('/register', (req, res) => {
  res.render('register');
});

// Google OAuth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Dashboard
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// AI Trip Generation (Mock AI response - replace with actual AI API)
app.post('/generate-trip', isAuthenticated, async (req, res) => {
  try {
    const { destination, startDate, endDate, budget, people } = req.body;
    
    // Mock AI-generated itinerary (replace with actual AI service)
    const mockItinerary = {
      destination: destination,
      dates: `${startDate} to ${endDate}`,
      budget: budget,
      people: people,
      summary: `A ${people}-person trip to ${destination} with a budget of $${budget}`,
      dayByDay: [
        {
          day: 1,
          activities: [
            "Arrival and check-in to accommodation",
            "Explore local markets",
            "Welcome dinner at a traditional restaurant"
          ]
        },
        {
          day: 2,
          activities: [
            "Visit main attractions",
            "Guided city tour",
            "Sunset viewing at popular spot"
          ]
        },
        {
          day: 3,
          activities: [
            "Day trip to nearby attractions",
            "Local cuisine cooking class",
            "Evening cultural show"
          ]
        }
      ],
      recommendations: {
        accommodation: ["Budget hotels", "Hostels", "Airbnb"],
        restaurants: ["Local eateries", "Food courts", "Street food"],
        activities: ["Free walking tours", "Museum visits", "Park explorations"]
      },
      estimatedCost: {
        accommodation: budget * 0.4,
        food: budget * 0.3,
        activities: budget * 0.2,
        transportation: budget * 0.1
      }
    };

    // Save trip to user's history
    req.user.trips.push({
      destination,
      startDate,
      endDate,
      budget,
      people,
      itinerary: mockItinerary
    });
    
    await req.user.save();

    res.render('trip', { 
      itinerary: mockItinerary,
      user: req.user 
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating trip');
  }
});

// View saved trips
app.get('/my-trips', isAuthenticated, (req, res) => {
  res.render('my-trips', { trips: req.user.trips, user: req.user });
});

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
