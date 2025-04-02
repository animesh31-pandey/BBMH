Skip to content
Navigation Menu
AnshulKhichi11
BBMH

Type / to search
Code
Issues
Pull requests
Actions
Projects
Security
Insights
Files
Go to file
t
models
public
ShedulePage.css
about.css
appointment.css
blogs.css
blogs.js
dashboard.css
doctorinfo.css
doctorinfo.js
doctors.css
empalenments.css
ent.css
index.css
index.js
login.css
news.css
news.js
rating.css
rating.js
register.css
specialities.css
views
README.md
app.js
package.json
BBMH
/app.js
AnshulKhichi11
AnshulKhichi11
Add files via upload
5658bea
 · 
4 hours ago

Code

Blame
429 lines (339 loc) · 12.4 KB
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const Appointment = require("./models/Appointment");
const Doctor = require("./models/Doctor");
const methodOverride = require('method-override');
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");

const flash = require("connect-flash");
const bcrypt = require("bcrypt");



const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.json());
app.use(cors());

// Session configuration
app.use(session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true
}));

// Flash messages
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});



// Authentication middleware
function isAuthenticated(req, res, next) {
    if (!req.session.doctorId) {
        req.flash("error", "Please log in first");
        return res.redirect("/login");
    }
    next();
}

// MongoDB connection
async function main() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/BangerDB');
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
main();



//  API to get doctors based on specialization (fixing disease mismatch)
app.get("/doctors", async (req, res) => {
    const { department } = req.query;
    // console.log("Requested Department:", department); // Debugging

    try {
        const doctors = await Doctor.find({ department: { $regex: new RegExp(department, "i") } });
        // console.log("Doctors Found:", doctors); //  Debugging

        if (doctors.length === 0) {
            return res.status(404).json({ message: "No doctors found for this department." });
        }

        res.json(doctors);
    } catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({ error: "Server error" });
    }
});




//  API to get available schedule for a selected doctor
//  Get doctor's available schedule
app.get("/doctor-schedule/:doctorId", async (req, res) => {
    const { doctorId } = req.params;

    try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        res.json({
            availableDates: doctor.availableDates, // Ensure this field exists in your Doctor schema
            availableTime: doctor.availableTime
        });
    } catch (error) {
        console.error("Error fetching doctor schedule:", error);
        res.status(500).json({ error: "Server error" });
    }
});



// Doctor registration
app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.post("/register", async (req, res) => {
    try {
        const { name, email, password, department } = req.body;
        // console.log("Register Input:", { name, email, password, department });

        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            req.flash("error", "Doctor already registered");
            return res.redirect("/register");
        }

        const doctor = new Doctor({ name, email, password, department });
        await doctor.save();

        // console.log("Saved Doctor:", doctor);
        req.flash("success", "Doctor registered successfully");
        res.redirect("/login");
    } catch (error) {
        console.error("Registration Error:", error);
        req.flash("error", "Registration failed");
        res.redirect("/register");
    }
});

// Login routes
app.get("/login", (req, res) => {
    res.render("login.ejs");
});
// Login route
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            req.flash("error", "Doctor not found");
            return res.redirect("/login");
        }

        const isMatch = await doctor.comparePassword(password);
        if (!isMatch) {
            req.flash("error", "Invalid password");
            return res.redirect("/login");
        }

        req.session.doctorId = doctor._id;
        req.flash("success", "Login successful");
        res.redirect("/dashboard");
    } catch (error) {
        console.error("Login Error:", error);
        req.flash("error", "Login failed");
        res.redirect("/login");
    }
});



// update route
app.get("/dashboard", isAuthenticated, async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.session.doctorId);
        if (!doctor) {
            req.flash("error", "Doctor not found");
            return res.redirect("/login");
        }
        res.render("dashboard", { doctor });
    } catch (error) {
        console.error("Dashboard error:", error);
        req.flash("error", "Something went wrong");
        res.redirect("/login");
    }
});


app.post("/updateAvailability", async (req, res) => {
    try {
        // console.log("🔹 Request Body:", req.body);

        let { availableDates, availableTime } = req.body;

        // Convert string of dates to an array
        availableDates = availableDates ? availableDates.split(", ") : [];

        // console.log("🔹 Formatted availableDates:", availableDates);
        // console.log("🔹 Formatted availableTime:", availableTime);

        if (!req.session.doctorId) {
            req.flash("error", "Session expired. Please log in again.");
            return res.redirect("/login");
        }

        // Update MongoDB document
        const updateFields = {};
        if (availableDates.length) updateFields.availableDates = availableDates;
        if (availableTime) updateFields.availableTime = availableTime;

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            req.session.doctorId,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedDoctor) {
            console.log("❌ Doctor not found!");
            req.flash("error", "Doctor not found");
            return res.redirect("/dashboard");
        }

        // console.log("✅ MongoDB Updated Successfully:", updatedDoctor);

        req.flash("success", "Availability updated successfully");
        res.redirect("/");

    } catch (error) {
        console.error("❌ Update Error:", error);
        req.flash("error", "Failed to update availability");
        res.redirect("/dashboard");
    }
});
      

// Logout
// app.get("/logout", (req, res) => {
//     req.logout((error) => {
//         if (error) {
//             console.error("Logout error");
//             req.flash("error", "Logout failed");
//             return res.redirect("/dashboard");
//         }// Clears session cookie if using express-session
//         req.flash("success", "Logged out successfully");
//         res.redirect("/");
//     });
// });


// Public routes
app.get("/", (req, res) => res.render("index.ejs"));
app.get("/blogs", (req, res) => res.render("blogs.ejs"));
app.get("/news", (req, res) => res.render("news.ejs"));
app.get("/aboutBBMH", (req, res) => res.render("about.ejs"));
app.get("/doct", (req, res) => res.render("doctors.ejs"));
app.get("/empanelments", (req, res) => res.render("empalenments.ejs"));
app.get("/specialities", (req, res) => res.render("specialities.ejs"));

// Speciality routes
const specialities = ["ent", "Gynecology", "Gastrology", "Neurosurgery", "JointReplacement",
    "Orthopedic", "Plasticsurgery", "SportsInjuries", "Urology"];
specialities.forEach(route => {
    app.get(`/${route}`, (req, res) => res.render(`${route}.ejs`));
});

// Appointment routes
app.get("/appointment", (req, res) => {
    try {
        res.render("appointment.ejs");
    } catch (error) {
        console.error(error);
        req.flash("error", "Something went wrong");
        res.redirect("/");
    }
});



//appointment show route
app.get("/appointments", async (req, res) => {
    try {
      const appointments = await Appointment.find({}).populate("doctor");
      res.render("appointments.ejs", { appointments });
    } catch (err) {
      console.error("Error fetching appointments:", err);
      res.status(500).send("Error fetching appointments");
    }
  });

app.post("/appointments", async (req, res) => {
    try {
        // console.log(" Full Request Body:", req.body);
        // console.log(" Appointment Data:", req.body.appointment);

        //  Ensure `req.body.appointment` exists
        if (!req.body.appointment) {
            req.flash("error", "Invalid appointment data");
            return res.redirect("/appointment");
        }

        //  Log missing fields before saving
        const requiredFields = ["doctor", "disease", "availableDates", "availableTime", "gender"];
        // requiredFields.forEach(field => {
        //     // if (!req.body.appointment[field]) {
        //     //     console.log(` Missing field: ${field}`);
        //     // }
        // });

        const newAppointment = new Appointment(req.body.appointment);
        await newAppointment.save();

        res.render("rating.ejs", { newAppointment });
    } catch (err) {
        console.error(" Error saving appointment:", err);
        req.flash("error", "Error saving appointment");
        res.redirect("/appointment");
    }
});


// doctor info
app.get("/doctorinfoAL", (req,res) =>{
    res.render("doctorinfoAl.ejs");
  })
  
  app.get("/doctorinfoNer" ,(req, res) =>{
    res.render("doctorinfoNer.ejs");
  })
  
  app.get("/doctorinfoPar" ,(req, res) =>{
    res.render("doctorinfoPar.ejs");
  })
  
  app.get("/doctorinfoUt" ,(req, res) =>{
    res.render("doctorinfoUt.ejs");
  })
  
  app.get("/doctorinfoSid" ,(req, res) =>{
    res.render("doctorinfoSid.ejs");
  })
  
  
  app.get("/doctorinfoAn" ,(req, res) =>{
    res.render("doctorinfoAn.ejs");
  });
  
  app.get("/doctorinfoKD" ,(req, res) =>{
    res.render("doctorinfoKD.ejs");
  });
  
  app.get("/doctorinfoSac" ,(req, res) =>{
    res.render("doctorinfoSac.ejs");
  });
  
  app.get("/doctorinfoDe" ,(req, res) =>{
    res.render("doctorinfoDe.ejs");
  });
  
  app.get("/doctorinfoSu" ,(req, res) =>{
    res.render("doctorinfoSu.ejs");
  });
  
  app.get("/doctorinfoAk" ,(req, res) =>{
    res.render("doctorinfoAk.ejs");
  });
  
  app.get("/doctorinfoVi" ,(req, res) =>{
    res.render("doctorinfoVi.ejs");
  });
  
  app.get("/doctorinfoMa" ,(req, res) =>{
    res.render("doctorinfoMa.ejs");
  });
  
  app.get("/doctorinfoVij" ,(req, res) =>{
    res.render("doctorinfoVij.ejs");
  });
  
  app.get("/doctorinfoNi" ,(req, res) =>{
    res.render("doctorinfoNi.ejs");
  });
  
  app.get("/doctorinfoTa" ,(req, res) =>{
    res.render("doctorinfoTa.ejs");
  });
  
  app.get("/doctorinfoRo" ,(req, res) =>{
    res.render("doctorinfoRo.ejs");
  });
  
  


//rating hospital route
app.post("/appointments/:id/rating", async (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;
        await Appointment.findByIdAndUpdate(id, { rating });
        req.flash("success", "Rating saved successfully");
        res.redirect("/appointments");
    } catch (err) {
        console.error("Error saving rating:", err);
        req.flash("error", "Failed to save rating");
        res.redirect("/appointments");
    }
});


//delete appointment route
app.delete("/appointments/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await Appointment.deleteOne({ _id: id });
        req.flash("success", "Appointment deleted successfully");
        res.redirect("/appointments");
    } catch (err) {
        console.error("Error deleting appointment:", err);
        req.flash("error", "Failed to delete appointment");
        res.redirect("/appointments");
    }
});



const port = 3000;
app.listen(port, () => {
    console.log(`App working at ${port}`);
});
BBMH/app.js at main · AnshulKhichi11/BBMH
