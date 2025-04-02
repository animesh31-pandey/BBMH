const doctors = {
    "john": { name: "Dr. John Doe", specialty: "Cardiologist", image: "john.jpg", description: "Expert in heart disease treatment." },
    "jane": { name: "Dr. Jane Smith", specialty: "Neurologist", image: "jane.jpg", description: "Specialist in brain disorders." },
    "mike": { name: "Dr. Mike Brown", specialty: "Orthopedic", image: "mike.jpg", description: "Expert in bone and joint care." },
    "lisa": { name: "Dr. Lisa Green", specialty: "Pediatrician", image: "lisa.jpg", description: "Specialist in children's health." },
    "david": { name: "Dr. David White", specialty: "Dermatologist", image: "david.jpg", description: "Expert in skin conditions." }
};

// Get doctor ID from URL
const params = new URLSearchParams(window.location.search);
const doctorId = params.get("doctor");

if (doctorId && doctors[doctorId]) {
    document.getElementById("doctor-name").textContent = doctors[doctorId].name;
    document.getElementById("doctor-specialty").textContent = "Specialty: " + doctors[doctorId].specialty;
    document.getElementById("doctor-description").textContent = doctors[doctorId].description;
    document.getElementById("doctor-image").src = doctors[doctorId].image;
} else {
    document.querySelector(".info-section").innerHTML = "<h2>Doctor Not Found</h2>";
}
