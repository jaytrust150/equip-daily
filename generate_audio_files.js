/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Setup for ES modules to define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Define the target directory: current folder -> public -> audio
const audioDir = path.join(__dirname, 'public', 'audio');

console.log("📂 Target Directory:", audioDir);

// 3. Create the audio directory if it doesn't exist
if (!fs.existsSync(audioDir)) {
    try {
        fs.mkdirSync(audioDir, { recursive: true });
        console.log("✅ Created 'public/audio' folder.");
    } catch (err) {
        console.error("❌ Error creating directory:", err);
        process.exit(1);
    }
} else {
    console.log("ℹ️ 'public/audio' folder already exists.");
}

// 4. Map of days in each month
const daysInMonth = {
    1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30,
    7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31
};

// 5. Loop and Generate
console.log("🚀 Starting file generation...");

let count = 0;
try {
    for (let month = 1; month <= 12; month++) {
        for (let day = 1; day <= daysInMonth[month]; day++) {
            // Name format: M.D-devotional.mp3
            const fileName = `${month}.${day}-devotional.mp3`;
            const filePath = path.join(audioDir, fileName);

            // Only create if it doesn't exist
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, ''); 
                count++;
            }
        }
    }
    console.log(`🎉 Success! Created ${count} new placeholder files.`);
} catch (err) {
    console.error("❌ Error writing files:", err);
}