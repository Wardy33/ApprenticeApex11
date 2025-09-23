const bcrypt = require("bcrypt");

// Test password hashing and comparison
const password = "MasterAdmin2024!";
const existingHash =
  "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

console.log("Password:", password);
console.log("Existing hash:", existingHash);

// Test if existing hash matches password
const isValid = bcrypt.compareSync(password, existingHash);
console.log("Existing hash valid:", isValid);

// Generate new hash
const newHash = bcrypt.hashSync(password, 10);
console.log("New hash:", newHash);

// Test new hash
const newIsValid = bcrypt.compareSync(password, newHash);
console.log("New hash valid:", newIsValid);
