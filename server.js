const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// নিচে আপনার MongoDB লিংক এবং পাসওয়ার্ডটি আগের মতো বসিয়ে দিন
const mongoURI = "mongodb+srv://shaikathasan1234_db_user:e5p05EG51UYH3Uwq@cluster0.yomqfay.mongodb.net/";

// ডাটাবেসের সাথে কানেকশন
mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB Database Connected Successfully!"))
    .catch((err) => console.log("Database Connection Failed!", err));


// ==========================================
// ১. User Schema (আগের তৈরি করা ইউজারের ডাটাবেস ছক)
// ==========================================
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);


// ==========================================
// ২. Device Schema (নতুন: হারানো ফোনের ডাটাবেস ছক)
// ==========================================
const deviceSchema = new mongoose.Schema({
    imei: { type: String, required: true, unique: true }, // IMEI নম্বর ইউনিক হতে হবে
    brand: { type: String, required: true },              // যেমন: Samsung, Apple
    model: { type: String, required: true },              // যেমন: Galaxy S23
    lostLocation: { type: String, required: true },       // কোথায় হারিয়েছে
    status: { type: String, default: "stolen" }           // ডিফল্ট স্ট্যাটাস 'stolen' বা চুরি হয়ে গেছে
});
const Device = mongoose.model('Device', deviceSchema);


// ==========================================
// ৩. আমাদের API বা রাউটগুলো
// ==========================================

// API 1: User Registration (আগের কাজ)
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const newUser = new User({ name, email, password });
        await newUser.save();
        res.status(201).json({ success: true, message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Registration failed or Email already exists!" });
    }
});

// API 2: Report Stolen Device (নতুন কাজ: হারানো ফোন রিপোর্ট করা)
app.post('/api/devices/report', async (req, res) => {
    try {
        const { imei, brand, model, lostLocation } = req.body;

        // নতুন ফোনের ডেটা তৈরি করে ডাটাবেসে সেভ করা
        const newDevice = new Device({
            imei: imei,
            brand: brand,
            model: model,
            lostLocation: lostLocation
        });
        
        await newDevice.save(); // ডাটাবেসে সেভ হওয়ার জন্য অপেক্ষা করবে

        console.log("হারানো ফোনের তথ্য সেভ হয়েছে! IMEI:", imei);

        res.status(201).json({
            success: true,
            message: "Stolen device reported successfully!",
            data: newDevice
        });
    } catch (error) {
        console.log("এরর হয়েছে:", error.message);
        res.status(500).json({ success: false, message: "Failed to report device!" });
    }
});
// API 3: Search Device by IMEI (ফোন ট্র্যাক করা)
app.get('/api/devices/search/:imei', async (req, res) => {
    try {
        // ইউজার যে IMEI লিখে সার্চ করবে, সেটি রিসিভ করা
        const searchImei = req.params.imei;
        
        // ডাটাবেসে এই IMEI নম্বরের কোনো ফোন আছে কি না তা খোঁজা
        const device = await Device.findOne({ imei: searchImei });

        if (device) {
            // যদি ডাটাবেসে ফোন পাওয়া যায় (মানে চুরি হওয়া ফোন)
            res.status(200).json({
                success: true,
                message: "Alert! This phone is reported as STOLEN.",
                data: device
            });
        } else {
            // যদি ফোন পাওয়া না যায় (মানে নিরাপদ)
            res.status(404).json({
                success: false,
                message: "Safe! No stolen report found for this IMEI."
            });
        }
    } catch (error) {
        console.log("এরর হয়েছে:", error.message);
        res.status(500).json({ success: false, message: "Server Error!" });
    }
});
// সার্ভার চালু করা
// সার্ভার চালু করা (লোকাল পিসির জন্য)
if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => {
        console.log('Server is running on http://localhost:3000');
    });
}

// Vercel-এ লাইভ করার জন্য এই লাইনটি বাধ্যতামুলক!
module.exports = app;