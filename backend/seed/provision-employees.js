/**
 * Creates a User account for every Employee who doesn't have one yet.
 * Default password: employee123
 * Run: node backend/seed/provision-employees.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const User     = require("../models/User");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB\n");

  const employees = await Employee.find({});
  let created = 0, skipped = 0;

  for (const emp of employees) {
    const exists = await User.findOne({ email: emp.email.toLowerCase() });
    if (exists) {
      console.log(`  skip  ${emp.email}  (already has account)`);
      skipped++;
      continue;
    }

    await User.create({
      name:     emp.name,
      email:    emp.email.toLowerCase(),
      password: "employee123",
      role:     emp.title || "Employee",
      userRole: "employee",
      empId:    emp.empId,
      avatar:   emp.av || { bg: "#F4DDE8", fg: "#6F1947" },
      active:   emp.status !== "inactive",
    });
    console.log(`  created  ${emp.email}  (${emp.empId})`);
    created++;
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
