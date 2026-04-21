function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function asyncMapCallback(array, asyncFn, callback, options = {}) {
    const results = [];
    let index = 0;
    const signal = options.signal;

    function next() {
        if (signal?.aborted) {
            callback(new Error("Operation aborted"), null);
            return;
        }

        if (index >= array.length) {
            callback(null, results);
            return;
        }

        const currentIndex = index++;

        asyncFn(array[currentIndex], currentIndex, array, (err, result) => {
            if (signal?.aborted) {
                callback(new Error("Operation aborted"), null);
                return;
            }

            if (err) {
                callback(err, null);
                return;
            }

            results[currentIndex] = result;
            next();
        });
    }

    next();
}


function asyncMapPromise(array, asyncFn, options = {}) {
    const signal = options.signal;

    return new Promise((resolve, reject) => {
        const results = [];
        let index = 0;

        function next() {
            if (signal?.aborted) {
                reject(new Error("Operation aborted"));
                return;
            }

            if (index >= array.length) {
                resolve(results);
                return;
            }

            const currentIndex = index++;

            asyncFn(array[currentIndex], currentIndex, array)
                .then(result => {
                    if (signal?.aborted) {
                        reject(new Error("Operation aborted"));
                        return;
                    }

                    results[currentIndex] = result;
                    next();
                })
                .catch(reject);
        }

        next();
    });
}

async function runAsyncAwaitDemo() {
    const data = [1, 2, 3, 4];

    const result = await asyncMapPromise(data, async (num) => {
        await delay(400);
        return num * 2;
    });

    console.log("Async/Await result:", result);
}

function demoCallback() {
    const controller = new AbortController();

    asyncMapCallback(
        [1, 2, 3],
        (num, i, arr, cb) => {
            setTimeout(() => {
                cb(null, num * 10);
            }, 300);
        },
        (err, result) => {
            if (err) return console.error("Callback error:", err.message);
            console.log("Callback result:", result);
        },
        { signal: controller.signal }
    );
}

function demoPromise() {
    const controller = new AbortController();

    asyncMapPromise(
        [5, 6, 7],
        async (num) => {
            await delay(300);
            return num + 1;
        },
        { signal: controller.signal }
    )
        .then(result => console.log("Promise result:", result))
        .catch(err => console.error("Promise error:", err.message));
}

function demoAbort() {
    const controller = new AbortController();

    asyncMapPromise(
        [1, 2, 3, 4, 5],
        async (num) => {
            await delay(1000);
            return num * 2;
        },
        { signal: controller.signal }
    )
        .then(result => console.log("Result:", result))
        .catch(err => console.log("Aborted:", err.message));

    
    setTimeout(() => {
        controller.abort();
    }, 2000);
}

