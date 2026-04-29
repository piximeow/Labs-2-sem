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

const fs = require("fs");
const readline = require("readline");

async function* readCSV(filePath) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let first = true;
  for await (const line of rl) {
    if (first) { first = false; continue; }
    if (!line.trim()) continue;

    const [id, product, price, quantity] = line.split(",");
    yield {
      id: Number(id),
      product: product.trim(),
      price: Number(price),
      quantity: Number(quantity),
    };
  }
}

module.exports = { readCSV };

const fs = require("fs");
const path = require("path");
const { generateCSV } = require("./generate");
const { readCSV } = require("./read");

async function main() {
  const file = path.join(__dirname, "data.csv");

  await generateCSV(file, 100000);

  const start = Date.now();
  const stats = {};
  let total = 0;

  for await (const row of readCSV(file)) {
    total++;

    if (!stats[row.product]) {
      stats[row.product] = { count: 0, totalRevenue: 0 };
    }

    stats[row.product].count++;
    stats[row.product].totalRevenue += row.price * row.quantity;
  }

  const time = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`Processed: ${total} rows in ${time}s\n`);

  for (const product in stats) {
    const s = stats[product];
    const avg = (s.totalRevenue / s.count).toFixed(2);
    console.log(`${product}: count=${s.count}, avgRevenue=${avg}`);
  }

  fs.unlinkSync(file);
}

main().catch(console.error);