const fs = require("fs");

async function generateCSV(filePath, rows = 100000) {
  const products = ["Laptop", "Phone", "Tablet", "Monitor", "Keyboard"];
  const ws = fs.createWriteStream(filePath);

  await new Promise((resolve, reject) => {
    ws.on("error", reject);
    ws.write("id,product,price,quantity\n");

    (async () => {
      for (let i = 1; i <= rows; i++) {
        const product = products[i % products.length];
        const price = (Math.random() * 2000 + 50).toFixed(2);
        const quantity = Math.floor(Math.random() * 100) + 1;

        const line = `${i},${product},${price},${quantity}\n`;
        if (!ws.write(line)) {
          await new Promise((res) => ws.once("drain", res));
        }
      }
      ws.end(resolve);
    })().catch(reject);
  });
}

module.exports = { generateCSV };