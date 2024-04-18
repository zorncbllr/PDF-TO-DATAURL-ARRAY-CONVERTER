const pdfPoppler = require("pdf-poppler");
const fs = require("fs");
const { remove } = require("fs-extra");
const path = require("path");

if (!fs.existsSync("./images")) {
  fs.mkdir("./images", (err) => {
    if (err) throw err;
    console.log("mkdir success");
  });
}
if (!fs.existsSync("./output")) {
  fs.mkdir("./output", (err) => {
    if (err) throw err;
    console.log("mkdir success");
  });
}

//   REPLACE SAMPLE.PDF WITH YOUR PDF FILE
const pdfPath = "./input/sample.pdf";
const outputDir = "./images";
const resultsDir = "./output";

const options = {
  format: "jpg",
  out_dir: outputDir,
  out_prefix: "image",
};

pdfPoppler
  .convert(pdfPath, options)
  .then(() => {
    console.log("PDF converted to images successfully.");

    fs.readdir(outputDir, (err, files) => {
      if (err) {
        console.error("Error reading directory:", err);
        return;
      }

      const imagePaths = files
        .filter((file) => path.extname(file).toLowerCase() === ".jpg")
        .map((file) => path.join(outputDir, file));

      const resultsPath = path.join(resultsDir, "base64_images.js");
      const writeStream = fs.createWriteStream(resultsPath);

      writeStream.on("error", (err) => {
        console.error("Error writing base64 images to file:", err);
      });

      writeStream.write("export const imageURL = [\n");

      imagePaths.forEach((imagePath, index) => {
        const imageData = fs.readFileSync(imagePath);
        const base64Image = Buffer.from(imageData).toString("base64");
        writeStream.write(`  "data:image/jpeg;base64,${base64Image}"`);
        if (index < imagePaths.length - 1) {
          writeStream.write(",\n");
        }
      });

      writeStream.write("\n]");
      writeStream.end();

      writeStream.on("finish", () => {
        console.log("Base64 images written to file:", resultsPath);
        remove(outputDir, (err) => {
          if (err) throw err;
          console.log("CLEANED UP DIRECTORY");
        });
      });
    });
  })
  .catch((error) => {
    console.error("Error converting PDF to images:", error);
  });
