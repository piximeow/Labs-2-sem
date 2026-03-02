function* counter(start) {
    let num = start;

    while (true) {
        yield num;
        num += 1;
    }
}

function runWithTimeout(iter, seconds) {
    const start = Date.now();
    const limit = seconds * 1000;

    while (Date.now() - start < limit) {
        const value = iter.next().value;
        console.log(value);
    }

    console.log("Done");
}

const myGenerator = counter(1);
runWithTimeout(myGenerator, 3);