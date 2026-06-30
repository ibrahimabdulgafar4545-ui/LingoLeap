import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

/**
 * Runs a startup diagnostic that checks and resets user passwords
 * in the local db.json file. Writes results to diagnostic.txt.
 */
export const runStartupDiagnostic = () => {
  (async () => {
    const diagLogs = [];
    diagLogs.push(`=== STARTUP DIAGNOSTIC AT ${new Date().toISOString()} ===`);
    try {
      const dbPath = path.join(process.cwd(), './data/db.json');
      if (fs.existsSync(dbPath)) {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        diagLogs.push(`Loaded db.json successfully. User count: ${db.users?.length || 0}`);
        
        let updatedCount = 0;
        for (const u of db.users || []) {
          if (u.email === 'admin@lingoleap.com') {
            diagLogs.push(`User: admin (${u.email}) - Skipped resetting admin`);
            continue;
          }
          
          let isPwd123 = false;
          try {
            isPwd123 = bcrypt.compareSync('password123', u.password);
          } catch (e) {
            isPwd123 = false;
          }
          
          diagLogs.push(`User: ${u.username} (${u.email})`);
          diagLogs.push(`  Existing Hash: ${u.password}`);
          diagLogs.push(`  Matches 'password123'? ${isPwd123}`);
          
          if (!isPwd123) {
            diagLogs.push(`  -> Resetting local db.json password hash to 'password123'`);
            const salt = bcrypt.genSaltSync(10);
            u.password = bcrypt.hashSync('password123', salt);
            updatedCount++;
          }
        }
        if (updatedCount > 0) {
          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
          diagLogs.push(`Saved updated db.json with ${updatedCount} corrected passwords.`);
        } else {
          diagLogs.push(`No password updates required in db.json.`);
        }
      } else {
        diagLogs.push(`db.json not found at ${dbPath}`);
      }
    } catch (err) {
      diagLogs.push(`Diagnostic error: ${err.message}`);
    }
    
    try {
      fs.writeFileSync(path.join(process.cwd(), './diagnostic.txt'), diagLogs.join('\n'), 'utf-8');
      console.log('\u{1F4DD} Startup diagnostic complete. Log saved to server/diagnostic.txt');
    } catch (logErr) {
      console.error('Failed to write diagnostic file:', logErr.message);
    }
  })();
};
