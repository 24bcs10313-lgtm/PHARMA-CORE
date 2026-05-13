const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pharmacy.db');
const db = new sqlite3.Database(dbPath);

const bases = ['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Azithromycin', 'Cetirizine', 'Loratadine', 'Omeprazole', 'Pantoprazole', 'Metformin', 'Amlodipine', 'Losartan', 'Atorvastatin', 'Rosuvastatin', 'Aspirin', 'Vitamin B-Complex', 'Vitamin D3', 'Cough Suppressant', 'Dolo', 'Crocin', 'Levocetirizine', 'Fluconazole'];
const categories = ['Pain Relief', 'Antibiotics', 'Allergy', 'Digestive Health', 'Diabetes', 'Heart Health', 'Supplements', 'Cold & Flu', 'Skin Care', 'Vitamins'];
const dosages = ['100mg', '250mg', '500mg', '650mg', '1000mg', '5ml', '10ml', '20mg', '40mg'];
const formats = ['Tablets', 'Capsules', 'Syrup', 'Drops', 'Gel', 'Ointment', 'Injection'];

db.serialize(() => {
    console.log("Emptying medicines table...");
    db.run("DELETE FROM medicines");

    console.log("Seeding 100+ new medicines...");
    const stmt = db.prepare("INSERT INTO medicines (name, description, price, category, image, requiresPrescription) VALUES (?, ?, ?, ?, ?, ?)");
    
    let count = 0;
    
    for (let c of categories) {
        for (let b of bases) {
            // Generate some random variation
            let dosage = dosages[Math.floor(Math.random() * dosages.length)];
            let format = formats[Math.floor(Math.random() * formats.length)];
            
            let name = `${b} ${dosage} ${format}`;
            let price = (Math.random() * 80 + 10).toFixed(2);
            let requiresRx = Math.random() > 0.6 ? 1 : 0; // 40% require prescription
            let description = `Premium quality ${b} formulation for effective ${c.toLowerCase()}. Available as quick-action ${format}.`;
            
            // Generate a random dark hex color for background, white for text
            let imgColor = Math.floor(Math.random() * 8388607).toString(16).padStart(6, '0'); 
            let image = `https://placehold.co/400x400/${imgColor}/ffffff?text=${b}`;

            stmt.run(name, description, parseFloat(price), c, image, requiresRx);
            count++;
            
            if(count >= 125) break; 
        }
        if(count >= 125) break;
    }

    stmt.finalize();
    console.log(`Successfully seeded ${count} medicines.`);
    db.close();
});
