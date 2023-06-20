import fs from "fs";
import path from "path";

// The path to the file to add the shebang to.
const filePath = path.join(__dirname, "./index.js");

// Read the current contents of the file.
const contents = fs.readFileSync(filePath, "utf8");

// if shebang already exists, ignore
if (!contents.startsWith("#!/usr/bin/env node")) {
  // Write the shebang plus the current contents back to the file.
  fs.writeFileSync(filePath, `#!/usr/bin/env node\n${contents}`);
}
