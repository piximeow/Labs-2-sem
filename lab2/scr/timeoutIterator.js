export async function consumeWithTimeout(iterator, timeoutSeconds, callback) {
  const endTime = Date.now() + timeoutSeconds * 1000;

  let count = 0;
  let sum = 0;

  while (Date.now() < endTime) {
    const { value } = iterator.next();

    // обробка значення
    if (typeof value === 'number') {
      sum += value;
      count++;
      const avg = sum / count;
      console.log(`Value: ${value}, Avg: ${avg.toFixed(2)}`);
    } else {
      console.log(`Value: ${value}`);
    }

    if (callback) {
      callback(value);
    }

    // невелика затримка щоб не забити CPU
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("Timeout reached.");
}