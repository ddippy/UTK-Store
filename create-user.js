const bcrypt = require("bcrypt");

async function createHash() {
  const password = "user123";

  const hash = await bcrypt.hash(password, 10);

  console.log("Password:", password);
  console.log("Hash:", hash);
}

createHash();
